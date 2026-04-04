import { v, paginationOptsValidator } from "convex/values";
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
    type: v.optional(v.string()),
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

      let transactions = await ctx.db
        .query("walletTransactions")
        .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
        .order("desc")
        .take(args.limit ?? 50);

      if (args.type) {
        const allowedTypesByBucket: Record<string, string[]> = {
          credit: ["top_up", "transfer_in", "admin_top_up", "refund"],
          debit: ["spend", "transfer_out", "withdrawal"],
          refund: ["refund"],
        };
        const allowedTypes = allowedTypesByBucket[args.type] ?? [args.type];
        transactions = transactions.filter((transaction) => allowedTypes.includes(transaction.type));
      }

      let runningBalance = wallet.balanceCents;
      return transactions.map((transaction) => {
        const balanceAfter = runningBalance;
        runningBalance -= transaction.amountCents;

        return {
          ...transaction,
          type:
            transaction.amountCents >= 0
              ? transaction.type === "refund"
                ? "refund"
                : "credit"
              : "debit",
          referenceType: transaction.type,
          description:
            transaction.note ??
            transaction.reference ??
            transaction.type.replaceAll("_", " "),
          balanceAfter,
        };
      });
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

/** Admin: list all wallets in the tenant (legacy — prefer listAllWalletsPaginated) */
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

/** Admin: cursor-paginated wallet list — use with usePaginatedQuery on the frontend. */
export const listAllWalletsPaginated = query({
  args: {
    sessionToken: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "ewallet");
    requirePermission(tenant, "ewallet:read");

    return await ctx.db
      .query("wallets")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listTopUpRequests = query({
  args: {
    sessionToken: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const tenant = args.sessionToken
        ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
        : await requireTenantContext(ctx);
      await requireModule(ctx, tenant.tenantId, "ewallet");

      const requests = args.status
        ? await ctx.db
            .query("walletTopUpRequests")
            .withIndex("by_tenant_status", (q) =>
              q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
            )
            .order("desc")
            .take(args.limit ?? 50)
        : await ctx.db
            .query("walletTopUpRequests")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .order("desc")
            .take(args.limit ?? 50);

      return requests;
    } catch (error) {
      console.error("listTopUpRequests failed", error);
      return [];
    }
  },
});

export const getMyTopUpRequests = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
      await requireModule(ctx, tenant.tenantId, "ewallet");

      return await ctx.db
        .query("walletTopUpRequests")
        .withIndex("by_requester", (q) => q.eq("requesterId", tenant.userId))
        .order("desc")
        .take(args.limit ?? 20);
    } catch (error) {
      console.error("getMyTopUpRequests failed", error);
      return [];
    }
  },
});
