import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

function generateOrderNumber() {
    return "ORD-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

export const createProduct = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        priceCents: v.number(),
        stock: v.number(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ecommerce");
        requirePermission(tenant, "ecommerce:write");

        const now = Date.now();
        const productId = await ctx.db.insert("products", {
            tenantId: tenant.tenantId,
            name: args.name,
            description: args.description,
            priceCents: args.priceCents,
            stock: Math.max(0, args.stock),
            category: args.category,
            status: "active",
            createdAt: now,
            updatedAt: now,
        });
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "ecommerce.product_created",
            entityType: "product",
            entityId: productId.toString(),
            after: {
                name: args.name,
                priceCents: args.priceCents,
                stock: Math.max(0, args.stock),
                category: args.category,
            },
        });
        return productId;
    },
});

export const updateProduct = mutation({
    args: {
        productId: v.id("products"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        priceCents: v.optional(v.number()),
        stock: v.optional(v.number()),
        category: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ecommerce");
        requirePermission(tenant, "ecommerce:write");

        const product = await ctx.db.get(args.productId);
        if (!product || product.tenantId !== tenant.tenantId) throw new Error("Product not found");

        const { productId, ...updates } = args;
        const nextState = { ...updates, updatedAt: Date.now() };
        await ctx.db.patch(productId, nextState);
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "ecommerce.product_updated",
            entityType: "product",
            entityId: productId.toString(),
            before: product,
            after: { ...product, ...nextState },
        });
        return productId;
    },
});

export const addToCart = mutation({
    args: {
        customerId: v.string(),
        customerType: v.string(),
        productId: v.id("products"),
        quantity: v.number(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ecommerce");
        requirePermission(tenant, "ecommerce:write");

        const product = await ctx.db.get(args.productId);
        if (!product || product.tenantId !== tenant.tenantId) throw new Error("Product not found");
        if (product.stock < args.quantity) throw new Error("Insufficient stock");

        const existing = await ctx.db
            .query("carts")
            .withIndex("by_customer", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("customerId", args.customerId)
            )
            .first();

        const item = {
            productId: args.productId,
            quantity: args.quantity,
            unitPriceCents: product.priceCents,
        };
        const now = Date.now();

        if (existing) {
            const items = [...existing.items];
            const idx = items.findIndex((i) => i.productId === args.productId);
            if (idx >= 0 && items[idx]) {
                items[idx] = { ...items[idx], quantity: items[idx].quantity + args.quantity };
            } else {
                items.push(item);
            }
            await ctx.db.patch(existing._id, { items, updatedAt: now });
            await logAction(ctx, {
                tenantId: tenant.tenantId,
                actorId: tenant.userId,
                actorEmail: tenant.email,
                action: "ecommerce.cart_updated",
                entityType: "cart",
                entityId: existing._id.toString(),
                before: existing,
                after: { ...existing, items, updatedAt: now },
            });
            return existing._id;
        }

        const cartId = await ctx.db.insert("carts", {
            tenantId: tenant.tenantId,
            customerId: args.customerId,
            customerType: args.customerType,
            items: [item],
            updatedAt: now,
        });
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "ecommerce.cart_updated",
            entityType: "cart",
            entityId: cartId.toString(),
            after: {
                customerId: args.customerId,
                customerType: args.customerType,
                items: [item],
                updatedAt: now,
            },
        });
        return cartId;
    },
});

export const updateCartItemQuantity = mutation({
    args: {
        cartId: v.id("carts"),
        productId: v.string(),
        quantity: v.number(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ecommerce");
        requirePermission(tenant, "ecommerce:write");

        const cart = await ctx.db.get(args.cartId);
        if (!cart || cart.tenantId !== tenant.tenantId) throw new Error("Cart not found");

        const items = cart.items.map((i) =>
            i.productId === args.productId ? { ...i, quantity: args.quantity } : i
        ).filter((i) => i.quantity > 0);
        const updatedAt = Date.now();
        await ctx.db.patch(args.cartId, { items, updatedAt });
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "ecommerce.cart_updated",
            entityType: "cart",
            entityId: args.cartId.toString(),
            before: cart,
            after: { ...cart, items, updatedAt },
        });
        return args.cartId;
    },
});

export const createOrderFromCart = mutation({
    args: {
        cartId: v.id("carts"),
        customerId: v.string(),
        customerType: v.string(),
        useWallet: v.boolean(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ecommerce");
        requirePermission(tenant, "ecommerce:write");

        const cart = await ctx.db.get(args.cartId);
        if (!cart || cart.tenantId !== tenant.tenantId || cart.customerId !== args.customerId) {
            throw new Error("Cart not found");
        }
        if (cart.items.length === 0) throw new Error("Cart is empty");

        let totalCents = 0;
        const now = Date.now();
        const orderNumber = generateOrderNumber();
        const orderId = await ctx.db.insert("orders", {
            tenantId: tenant.tenantId,
            orderNumber,
            customerId: args.customerId,
            customerType: args.customerType,
            totalCents: 0,
            status: "pending",
            createdAt: now,
            updatedAt: now,
        });

        for (const item of cart.items) {
            const product = await ctx.db.get(item.productId as import("../../_generated/dataModel").Id<"products">);
            if (!product || product.tenantId !== tenant.tenantId) continue;
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
            totalCents += item.unitPriceCents * item.quantity;
            await ctx.db.insert("orderItems", {
                tenantId: tenant.tenantId,
                orderId,
                productId: item.productId,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
                createdAt: now,
            });
            await ctx.db.patch(product._id, {
                stock: product.stock - item.quantity,
                updatedAt: now,
            });
        }

        await ctx.db.patch(orderId, { totalCents, updatedAt: now });

        if (args.useWallet) {
            const wallet = await ctx.db
                .query("wallets")
                .withIndex("by_owner", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("ownerId", args.customerId)
                )
                .first();
            if (wallet && wallet.balanceCents >= totalCents) {
                const walletTransactionId = await ctx.db.insert("walletTransactions", {
                    tenantId: tenant.tenantId,
                    walletId: wallet._id,
                    type: "spend",
                    amountCents: -totalCents,
                    orderId,
                    createdAt: now,
                });
                await ctx.db.patch(wallet._id, {
                    balanceCents: wallet.balanceCents - totalCents,
                    updatedAt: now,
                });
                await ctx.db.patch(orderId, {
                    status: "paid",
                    paymentMethod: "ewallet",
                    walletTransactionId,
                    updatedAt: now,
                });
            }
        }

        await ctx.db.patch(args.cartId, { items: [], updatedAt: now });
        const order = await ctx.db.get(orderId);
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "ecommerce.order_created",
            entityType: "order",
            entityId: orderId.toString(),
            after: order ?? {
                orderNumber,
                customerId: args.customerId,
                customerType: args.customerType,
                totalCents,
            },
        });
        return orderId;
    },
});

export const updateOrderStatus = mutation({
    args: { orderId: v.id("orders"), status: v.string() },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ecommerce");
        requirePermission(tenant, "ecommerce:write");

        const order = await ctx.db.get(args.orderId);
        if (!order || order.tenantId !== tenant.tenantId) throw new Error("Order not found");

        const updates = { status: args.status, updatedAt: Date.now() };
        await ctx.db.patch(args.orderId, updates);
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "ecommerce.order_updated",
            entityType: "order",
            entityId: args.orderId.toString(),
            before: order,
            after: { ...order, ...updates },
        });
        return args.orderId;
    },
});
