import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const getWallet = query({
    args: { ownerId: v.string(), ownerType: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ewallet");
        requirePermission(tenant, "ewallet:read");

        const wallet = await ctx.db
            .query("wallets")
            .withIndex("by_owner", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("ownerId", args.ownerId)
            )
            .first();

        if (!wallet || wallet.tenantId !== tenant.tenantId) return null;
        return wallet;
    },
});

export const getWalletBalance = query({
    args: { ownerId: v.string() },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ewallet");
        requirePermission(tenant, "ewallet:read");

        const wallet = await ctx.db
            .query("wallets")
            .withIndex("by_owner", (q) =>
                q.eq("tenantId", tenant.tenantId).eq("ownerId", args.ownerId)
            )
            .first();

        if (!wallet) return { balanceCents: 0, currency: "KES" };
        return { balanceCents: wallet.balanceCents, currency: wallet.currency };
    },
});

export const listWalletTransactions = query({
    args: {
        walletId: v.optional(v.string()),
        ownerId: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "ewallet");
        requirePermission(tenant, "ewallet:read");

        if (args.walletId) {
            const list = await ctx.db
                .query("walletTransactions")
                .withIndex("by_wallet", (q) => q.eq("walletId", args.walletId!))
                .order("desc")
                .take(args.limit ?? 50);
            return list.filter((t) => t.tenantId === tenant.tenantId);
        }

        if (args.ownerId) {
            const wallet = await ctx.db
                .query("wallets")
                .withIndex("by_owner", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("ownerId", args.ownerId!)
                )
                .first();
            if (!wallet) return [];
            const list = await ctx.db
                .query("walletTransactions")
                .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
                .order("desc")
                .take(args.limit ?? 50);
            return list;
        }

        return await ctx.db
            .query("walletTransactions")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .order("desc")
            .take(args.limit ?? 50);
    },
});
