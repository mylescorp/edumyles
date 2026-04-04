import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listProducts = query({
    args: {
        status: v.optional(v.string()),
        category: v.optional(v.string()),
        sessionToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "ecommerce");
            requirePermission(tenant, "ecommerce:read");

            if (args.status) {
                return await ctx.db
                    .query("products")
                    .withIndex("by_tenant_status", (q) =>
                        q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                    )
                    .collect();
            }
            let list = await ctx.db
                .query("products")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();
            if (args.category) {
                list = list.filter((p) => p.category === args.category);
            }
            return list;
        } catch (error) {
            console.error("listProducts failed", error);
            return [];
        }
    },
});

export const getProduct = query({
    args: { productId: v.id("products"), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "ecommerce");
            requirePermission(tenant, "ecommerce:read");

            const product = await ctx.db.get(args.productId);
            if (!product || product.tenantId !== tenant.tenantId) return null;
            return product;
        } catch (error) {
            console.error("getProduct failed", error);
            return null;
        }
    },
});

export const listOrders = query({
    args: {
        customerId: v.optional(v.string()),
        status: v.optional(v.string()),
        sessionToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "ecommerce");
            requirePermission(tenant, "ecommerce:read");

            if (args.customerId) {
                return await ctx.db
                    .query("orders")
                    .withIndex("by_customer", (q) => q.eq("customerId", args.customerId!))
                    .filter((f) => f.eq(f.field("tenantId"), tenant.tenantId))
                    .collect();
            }
            if (args.status) {
                return await ctx.db
                    .query("orders")
                    .withIndex("by_tenant_status", (q) =>
                        q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                    )
                    .collect();
            }
            return await ctx.db
                .query("orders")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();
        } catch (error) {
            console.error("listOrders failed", error);
            return [];
        }
    },
});

export const getOrder = query({
    args: { orderId: v.id("orders"), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "ecommerce");
            requirePermission(tenant, "ecommerce:read");

            const order = await ctx.db.get(args.orderId);
            if (!order || order.tenantId !== tenant.tenantId) return null;

            const items = await ctx.db
                .query("orderItems")
                .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
                .collect();
            const products = await Promise.all(
                items.map((item) => ctx.db.get(item.productId as any))
            );
            const productMap = new Map(
                products.filter(Boolean).map((product: any) => [product._id.toString(), product])
            );

            return {
                ...order,
                items: items.map((item) => ({
                    ...item,
                    productName: productMap.get(item.productId)?.name ?? item.productId,
                    productCategory: productMap.get(item.productId)?.category ?? null,
                })),
            };
        } catch (error) {
            console.error("getOrder failed", error);
            return null;
        }
    },
});

export const getCart = query({
    args: { customerId: v.string(), customerType: v.string(), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "ecommerce");
            requirePermission(tenant, "ecommerce:read");

            return await ctx.db
                .query("carts")
                .withIndex("by_customer", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("customerId", args.customerId)
                )
                .first();
        } catch (error) {
            console.error("getCart failed", error);
            return null;
        }
    },
});
