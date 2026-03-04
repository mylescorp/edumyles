import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const topUp = mutation({
    args: {
        ownerId: v.string(),
        ownerType: v.string(),
        amountCents: v.number(),
        reference: v.optional(v.string()),
        currency: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ewallet");
        requirePermission(tenant, "ewallet:write");

        if (args.amountCents <= 0) throw new Error("Amount must be positive");

        let wallet = await ctx.db
            .query("wallets")
            .withIndex("by_owner", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("ownerId", args.ownerId)
            )
            .first();
        if (!wallet) {
            const now = Date.now();
            const walletId = await ctx.db.insert("wallets", {
                tenantId: tenant.tenantId,
                ownerId: args.ownerId,
                ownerType: args.ownerType,
                balanceCents: 0,
                currency: args.currency ?? "KES",
                createdAt: now,
                updatedAt: now,
            });
            wallet = await ctx.db.get(walletId);
        }
        if (!wallet) throw new Error("Wallet not found");
        const walletId = wallet._id;
        const now = Date.now();
        await ctx.db.insert("walletTransactions", {
            tenantId: tenant.tenantId,
            walletId: walletId,
            type: "top_up",
            amountCents: args.amountCents,
            reference: args.reference,
            createdAt: now,
        });
        await ctx.db.patch(walletId, {
            balanceCents: wallet.balanceCents + args.amountCents,
            updatedAt: now,
        });
        return { success: true, newBalanceCents: wallet.balanceCents + args.amountCents };
    },
});

export const spend = mutation({
    args: {
        ownerId: v.string(),
        amountCents: v.number(),
        reference: v.optional(v.string()),
        orderId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ewallet");
        requirePermission(tenant, "ewallet:write");

        if (args.amountCents <= 0) throw new Error("Amount must be positive");

        const wallet = await ctx.db
            .query("wallets")
            .withIndex("by_owner", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("ownerId", args.ownerId)
            )
            .first();
        if (!wallet) throw new Error("Wallet not found");
        if (wallet.balanceCents < args.amountCents) throw new Error("Insufficient balance");

        const now = Date.now();
        await ctx.db.insert("walletTransactions", {
            tenantId: tenant.tenantId,
            walletId: wallet._id,
            type: "spend",
            amountCents: -args.amountCents,
            reference: args.reference,
            orderId: args.orderId,
            createdAt: now,
        });
        await ctx.db.patch(wallet._id, {
            balanceCents: wallet.balanceCents - args.amountCents,
            updatedAt: now,
        });
        return { success: true, newBalanceCents: wallet.balanceCents - args.amountCents };
    },
});
