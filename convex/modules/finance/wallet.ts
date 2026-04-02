import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

// Import wallet engine from shared lib
const { WalletEngine } = require("../../../../shared/src/lib/wallet");

/**
 * Get user wallet
 */
export const getUserWallet = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "wallet:read");

    const targetUserId = args.userId || tenant.userId;
    
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => 
        q.eq("tenantId", tenant.tenantId).eq("userId", targetUserId)
      )
      .first();

    if (!wallet) {
      return null;
    }

    // Get pending transactions
    const pendingTransactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => 
        q.eq("tenantId", tenant.tenantId).eq("fromWalletId", wallet.id)
      )
      .filter((q) => q.eq("status", "pending"))
      .collect();

    const pendingOutgoing = pendingTransactions
      .filter(tx => tx.fromWalletId === wallet.id)
      .reduce((sum, tx) => sum + tx.amountCents, 0);

    const pendingIncoming = pendingTransactions
      .filter(tx => tx.toWalletId === wallet.id)
      .reduce((sum, tx) => sum + tx.amountCents, 0);

    const balance = WalletEngine.calculateAvailableBalance(
      wallet,
      pendingOutgoing,
      pendingIncoming
    );

    return {
      ...wallet,
      ...balance,
    };
  },
});

/**
 * Create wallet for user
 */
export const createWallet = mutation({
  args: {
    userId: v.string(),
    currency: v.string(),
    dailyLimitCents: v.optional(v.number()),
    monthlyLimitCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "wallet:write");

    // Check if wallet already exists
    const existingWallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => 
        q.eq("tenantId", tenant.tenantId).eq("userId", args.userId)
      )
      .first();

    if (existingWallet) {
      throw new Error("User already has a wallet");
    }

    const walletId = await ctx.db.insert("wallets", {
      tenantId: tenant.tenantId,
      userId: args.userId,
      balanceCents: 0,
      currency: args.currency,
      status: "active",
      dailyLimitCents: args.dailyLimitCents || 0,
      monthlyLimitCents: args.monthlyLimitCents || 0,
      createdAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "wallet.created",
      entityType: "wallet",
      entityId: walletId,
      after: {
        userId: args.userId,
        currency: args.currency,
      },
    });

    return {
      success: true,
      walletId,
    };
  },
});

/**
 * Transfer funds between wallets
 */
export const transferFunds = mutation({
  args: {
    toUserId: v.string(),
    amountCents: v.number(),
    description: v.string(),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "wallet:transfer");

    const fromUserId = tenant.userId;

    // Get source wallet
    const fromWallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => 
        q.eq("tenantId", tenant.tenantId).eq("userId", fromUserId)
      )
      .first();

    if (!fromWallet) {
      throw new Error("Source wallet not found");
    }

    // Get destination wallet
    const toWallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => 
        q.eq("tenantId", tenant.tenantId).eq("userId", args.toUserId)
      )
      .first();

    if (!toWallet) {
      throw new Error("Recipient wallet not found");
    }

    // Validate transfer
    const validation = WalletEngine.validateTransferAmount(args.amountCents, fromWallet);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid transfer amount");
    }

    const recipientValidation = WalletEngine.validateRecipientWallet(fromWallet, toWallet);
    if (!recipientValidation.valid) {
      throw new Error(recipientValidation.error || "Invalid recipient");
    }

    const feeCents = WalletEngine.calculateTransferFee(args.amountCents);
    const totalAmount = args.amountCents + feeCents;

    // Check if source wallet has enough balance including fees
    if (fromWallet.balanceCents < totalAmount) {
      throw new Error("Insufficient balance including transfer fees");
    }

    const now = Date.now();
    const transactionId = await ctx.db.insert("walletTransactions", {
      tenantId: tenant.tenantId,
      fromWalletId: fromWallet.id,
      toWalletId: toWallet.id,
      amountCents: args.amountCents,
      currency: fromWallet.currency,
      type: "transfer",
      status: "pending",
      description: args.description,
      feeCents,
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "wallet.transfer.initiated",
      entityType: "walletTransaction",
      entityId: transactionId,
      after: {
        fromUserId,
        toUserId: args.toUserId,
        amountCents: args.amountCents,
        feeCents,
      },
    });

    return {
      success: true,
      transactionId,
      feeCents,
      totalAmount,
      estimatedCompletion: new Date(now + 5 * 60 * 1000), // 5 minutes
    };
  },
});

/**
 * Approve wallet transfer
 */
export const approveTransfer = mutation({
  args: {
    transactionId: v.id("walletTransactions"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "wallet:approve");

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction || transaction.tenantId !== tenant.tenantId) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "pending") {
      throw new Error("Transaction is not pending");
    }

    const now = Date.now();

    // Get wallets
    const fromWallet = await ctx.db.get(transaction.fromWalletId);
    const toWallet = await ctx.db.get(transaction.toWalletId);

    if (!fromWallet || !toWallet) {
      throw new Error("Wallets not found");
    }

    // Update balances
    const totalAmount = transaction.amountCents + transaction.feeCents;
    
    await ctx.db.patch(transaction.fromWalletId, {
      balanceCents: fromWallet.balanceCents - totalAmount,
      updatedAt: now,
    });

    await ctx.db.patch(transaction.toWalletId, {
      balanceCents: toWallet.balanceCents + transaction.amountCents,
      updatedAt: now,
    });

    // Update transaction status
    await ctx.db.patch(args.transactionId, {
      status: "completed",
      processedAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "wallet.transfer.completed",
      entityType: "walletTransaction",
      entityId: args.transactionId,
      after: {
        processedAt: now,
      },
    });

    return {
      success: true,
      processedAt: now,
    };
  },
});

/**
 * Get wallet transactions
 */
export const getWalletTransactions = query({
  args: {
    walletId: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("transfer"),
      v.literal("payment"),
      v.literal("refund"),
      v.literal("withdrawal"),
      v.literal("deposit")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    )),
    pagination: v.object({
      page: v.number(),
      pageSize: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "wallet:read");

    const targetUserId = args.walletId ? undefined : tenant.userId;
    
    let transactionsQuery = ctx.db
      .query("walletTransactions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .order("desc");

    if (args.walletId) {
      transactionsQuery = transactionsQuery.filter((q) => 
        q.eq("fromWalletId", args.walletId).or().eq("toWalletId", args.walletId)
      );
    }

    if (args.type) {
      transactionsQuery = transactionsQuery.filter((q) => q.eq("type", args.type));
    }

    if (args.status) {
      transactionsQuery = transactionsQuery.filter((q) => q.eq("status", args.status));
    }

    return await transactionsQuery
      .paginate(args.pagination)
      .take(args.pagination.pageSize);
  },
});

/**
 * Get wallet statistics
 */
export const getWalletStatistics = query({
  args: {
    walletId: v.optional(v.string()),
    period: v.union(v.literal("current"), v.literal("last_month")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "wallet:read");

    const targetUserId = args.walletId ? undefined : tenant.userId;
    
    // Get wallet
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => 
        q.eq("tenantId", tenant.tenantId).eq("userId", targetUserId)
      )
      .first();

    if (!wallet) {
      return null;
    }

    // Get transactions for period
    const now = Date.now();
    let startDate: number;
    
    if (args.period === "last_month") {
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      startDate = lastMonth.getTime();
    } else {
      const currentMonth = new Date(now);
      currentMonth.setDate(1);
      startDate = currentMonth.getTime();
    }

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .filter((q) => 
        q.gte("createdAt", startDate).lte("createdAt", now)
      )
      .filter((q) => 
        q.eq("fromWalletId", wallet.id).or().eq("toWalletId", wallet.id)
      )
      .collect();

    const statistics = WalletEngine.calculateWalletStatistics(wallet, transactions);

    return {
      period: args.period,
      walletId: wallet.id,
      ...statistics,
    };
  },
});
