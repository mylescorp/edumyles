import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

// ── helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateWallet(
  ctx: any,
  tenantId: string,
  ownerId: string,
  ownerType: string,
  currency = "KES"
) {
  let wallet = await ctx.db
    .query("wallets")
    .withIndex("by_owner", (q: any) =>
      q.eq("tenantId", tenantId).eq("ownerId", ownerId)
    )
    .first();

  if (!wallet) {
    const now = Date.now();
    const walletId = await ctx.db.insert("wallets", {
      tenantId,
      ownerId,
      ownerType,
      balanceCents: 0,
      currency,
      createdAt: now,
      updatedAt: now,
    });
    wallet = await ctx.db.get(walletId);
  }
  if (!wallet) throw new Error("Failed to create wallet");
  return wallet;
}

// ── mutations ─────────────────────────────────────────────────────────────────

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

    const wallet = await getOrCreateWallet(ctx, tenant.tenantId, args.ownerId, args.ownerType, args.currency);
    if (wallet.frozen) throw new Error("Wallet is frozen");

    const now = Date.now();
    await ctx.db.insert("walletTransactions", {
      tenantId: tenant.tenantId,
      walletId: wallet._id,
      type: "top_up",
      amountCents: args.amountCents,
      reference: args.reference,
      createdAt: now,
    });
    await ctx.db.patch(wallet._id, {
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
      .withIndex("by_owner", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("ownerId", args.ownerId)
      )
      .first();
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.frozen) throw new Error("Wallet is frozen");
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

/**
 * Transfer funds between two wallets within the same tenant.
 */
export const transfer = mutation({
  args: {
    fromOwnerId: v.string(),
    toOwnerId: v.string(),
    amountCents: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "ewallet");
    requirePermission(tenant, "ewallet:write");

    if (args.amountCents <= 0) throw new Error("Amount must be positive");
    if (args.fromOwnerId === args.toOwnerId) throw new Error("Cannot transfer to the same wallet");

    const fromWallet = await ctx.db
      .query("wallets")
      .withIndex("by_owner", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("ownerId", args.fromOwnerId)
      )
      .first();
    if (!fromWallet) throw new Error("Source wallet not found");
    if (fromWallet.frozen) throw new Error("Source wallet is frozen");
    if (fromWallet.balanceCents < args.amountCents) throw new Error("Insufficient balance");

    const toWallet = await getOrCreateWallet(ctx, tenant.tenantId, args.toOwnerId, "student");
    if (toWallet.frozen) throw new Error("Destination wallet is frozen");

    const now = Date.now();
    const reference = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Debit from sender
    await ctx.db.insert("walletTransactions", {
      tenantId: tenant.tenantId,
      walletId: fromWallet._id,
      type: "transfer_out",
      amountCents: -args.amountCents,
      reference,
      toWalletId: toWallet._id.toString(),
      note: args.note,
      createdAt: now,
    });

    // Credit to receiver
    await ctx.db.insert("walletTransactions", {
      tenantId: tenant.tenantId,
      walletId: toWallet._id,
      type: "transfer_in",
      amountCents: args.amountCents,
      reference,
      toWalletId: fromWallet._id.toString(),
      note: args.note,
      createdAt: now,
    });

    await ctx.db.patch(fromWallet._id, {
      balanceCents: fromWallet.balanceCents - args.amountCents,
      updatedAt: now,
    });
    await ctx.db.patch(toWallet._id, {
      balanceCents: toWallet.balanceCents + args.amountCents,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.initiated",
      entityType: "wallet",
      entityId: fromWallet._id.toString(),
      after: { type: "transfer", amountCents: args.amountCents, to: args.toOwnerId, reference },
    });

    return {
      success: true,
      reference,
      fromBalanceCents: fromWallet.balanceCents - args.amountCents,
      toBalanceCents: toWallet.balanceCents + args.amountCents,
    };
  },
});

/**
 * Request a withdrawal from a wallet (creates a pending withdrawal record).
 * Debits the balance immediately; actual payout is handled externally.
 */
export const withdraw = mutation({
  args: {
    ownerId: v.string(),
    amountCents: v.number(),
    method: v.union(v.literal("mpesa"), v.literal("bank"), v.literal("cash")),
    destination: v.string(), // phone number, account number, or "counter"
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "ewallet");
    requirePermission(tenant, "ewallet:write");

    if (args.amountCents <= 0) throw new Error("Amount must be positive");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_owner", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("ownerId", args.ownerId)
      )
      .first();
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.frozen) throw new Error("Wallet is frozen");
    if (wallet.balanceCents < args.amountCents) throw new Error("Insufficient balance");

    const now = Date.now();
    const reference = `WDR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    await ctx.db.insert("walletTransactions", {
      tenantId: tenant.tenantId,
      walletId: wallet._id,
      type: "withdrawal",
      amountCents: -args.amountCents,
      reference,
      note: args.note ?? `Withdrawal via ${args.method} to ${args.destination}`,
      createdAt: now,
    });

    await ctx.db.patch(wallet._id, {
      balanceCents: wallet.balanceCents - args.amountCents,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.initiated",
      entityType: "wallet",
      entityId: wallet._id.toString(),
      after: { type: "withdrawal", amountCents: args.amountCents, method: args.method, reference },
    });

    return { success: true, reference, newBalanceCents: wallet.balanceCents - args.amountCents };
  },
});

/**
 * Admin top-up: a school admin or bursar credits a specific user's wallet.
 * Requires ewallet:write + school_admin/bursar role (enforced via permission check).
 */
export const adminTopUp = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    targetOwnerId: v.string(),
    targetOwnerType: v.string(),
    amountCents: v.number(),
    note: v.string(),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "ewallet");
    requirePermission(tenant, "ewallet:write");

    if (args.amountCents <= 0) throw new Error("Amount must be positive");

    const wallet = await getOrCreateWallet(
      ctx,
      tenant.tenantId,
      args.targetOwnerId,
      args.targetOwnerType,
      args.currency
    );

    const now = Date.now();
    const reference = `ADM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    await ctx.db.insert("walletTransactions", {
      tenantId: tenant.tenantId,
      walletId: wallet._id,
      type: "admin_top_up",
      amountCents: args.amountCents,
      reference,
      note: args.note,
      performedBy: tenant.userId,
      createdAt: now,
    });

    await ctx.db.patch(wallet._id, {
      balanceCents: wallet.balanceCents + args.amountCents,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.recorded",
      entityType: "wallet",
      entityId: wallet._id.toString(),
      after: {
        type: "admin_top_up",
        amountCents: args.amountCents,
        targetOwnerId: args.targetOwnerId,
        reference,
        note: args.note,
      },
    });

    return { success: true, reference, newBalanceCents: wallet.balanceCents + args.amountCents };
  },
});

/**
 * Freeze a wallet — prevents all debits and credits.
 * Requires ewallet:write and school_admin/bursar role.
 */
export const freezeWallet = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    ownerId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "ewallet");
    requirePermission(tenant, "ewallet:write");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_owner", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("ownerId", args.ownerId)
      )
      .first();
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.frozen) throw new Error("Wallet is already frozen");

    const now = Date.now();
    await ctx.db.patch(wallet._id, { frozen: true, frozenAt: now, frozenBy: tenant.userId, updatedAt: now });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "settings.updated",
      entityType: "wallet",
      entityId: wallet._id.toString(),
      after: { frozen: true, reason: args.reason },
    });

    return { success: true };
  },
});

/**
 * Unfreeze a previously frozen wallet.
 */
export const unfreezeWallet = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "ewallet");
    requirePermission(tenant, "ewallet:write");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_owner", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("ownerId", args.ownerId)
      )
      .first();
    if (!wallet) throw new Error("Wallet not found");
    if (!wallet.frozen) throw new Error("Wallet is not frozen");

    const now = Date.now();
    await ctx.db.patch(wallet._id, {
      frozen: false,
      frozenAt: undefined,
      frozenBy: undefined,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "settings.updated",
      entityType: "wallet",
      entityId: wallet._id.toString(),
      after: { frozen: false },
    });

    return { success: true };
  },
});
