"use node";

import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requireModule } from "../../helpers/moduleGuard";
import { requirePermission } from "../../helpers/authorize";

export const getMyWalletBalance = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
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
    } catch (error) {
      console.error("getMyWalletBalance failed", error);
      return { balanceCents: 0, currency: "KES" };
    }
  },
});

export const getMyTransactionHistory = query({
  args: {
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
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
    } catch (error) {
      console.error("getMyTransactionHistory failed", error);
      return [];
    }
  },
});

export const getTransactionById = query({
  args: {
    transactionId: v.id("walletTransactions"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
      await requireModule(ctx, tenant.tenantId, "ewallet");

      const transaction = await ctx.db.get(args.transactionId);

      if (!transaction || transaction.tenantId !== tenant.tenantId) {
        return null;
      }

      return transaction;
    } catch (error) {
      console.error("getTransactionById failed", error);
      return null;
    }
  },
});
export const listWalletTransactions = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
      await requireModule(ctx, tenant.tenantId, "ewallet");

      return await ctx.db
        .query("walletTransactions")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .order("desc")
        .collect();
    } catch (error) {
      console.error("listWalletTransactions failed", error);
      return [];
    }
  },
});

/** Admin: look up any user's wallet by ownerId */
export const getWalletByOwnerId = query({
  args: {
    ownerId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
      await requireModule(ctx, tenant.tenantId, "ewallet");
      requirePermission(tenant, "ewallet:read");

      return await ctx.db
        .query("wallets")
        .withIndex("by_owner", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("ownerId", args.ownerId)
        )
        .first();
    } catch (error) {
      console.error("getWalletByOwnerId failed", error);
      return null;
    }
  },
});

/** Admin: list all wallets in the tenant */
export const listAllWallets = query({
  args: {
    sessionToken: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
      await requireModule(ctx, tenant.tenantId, "ewallet");
      requirePermission(tenant, "ewallet:read");

      return await ctx.db
        .query("wallets")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .order("desc")
        .take(args.limit ?? 100);
    } catch (error) {
      console.error("listAllWallets failed", error);
      return [];
    }
  },
});
