import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requireModule } from "../../helpers/moduleGuard";

export const getMyWalletBalance = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "ewallet");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_owner", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("ownerId", tenant.userId)
      )
      .first();

    if (!wallet) {
      return {
        balanceCents: 0,
        currency: "KES",
      };
    }

    return {
      balanceCents: wallet.balanceCents,
      currency: wallet.currency,
    };
  },
});

export const getMyTransactionHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "ewallet");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_owner", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("ownerId", tenant.userId)
      )
      .first();

    if (!wallet) return [];

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .order("desc")
      .take(args.limit ?? 50);

    return transactions;
  },
});

export const getTransactionById = query({
  args: {
    transactionId: v.id("walletTransactions"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "ewallet");

    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction || transaction.tenantId !== tenant.tenantId) {
      return null;
    }

    return transaction;
  },
});
