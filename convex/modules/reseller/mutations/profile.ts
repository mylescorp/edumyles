import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requireResellerContext, requireAffiliateContext, requireTier } from "../../../helpers/resellerGuard";
import { logAction } from "../../../helpers/auditLog";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const reseller = await ctx.db
      .query("resellers")
      .withIndex("by_userId", q => q.eq("userId", identity.subject))
      .first();

    if (!reseller) {
      throw new Error("Reseller profile not found");
    }

    return reseller;
  },
});

export const updateProfile = mutation({
  args: {
    businessName: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    contactInfo: v.optional(v.object({
      email: v.string(),
      phone: v.string(),
      address: v.string(),
      country: v.string(),
    })),
    banking: v.optional(v.object({
      bankName: v.string(),
      accountNumber: v.string(),
      accountName: v.string(),
      branchCode: v.optional(v.string()),
      payPalEmail: v.optional(v.string()),
    })),
    settings: v.optional(v.object({
      emailNotifications: v.boolean(),
      monthlyReports: v.boolean(),
      referralTracking: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.businessName) updates.businessName = args.businessName;
    if (args.website !== undefined) updates.website = args.website;
    if (args.description) updates.description = args.description;
    if (args.contactInfo) updates.contactInfo = args.contactInfo;
    if (args.banking) updates.banking = args.banking;
    if (args.settings) updates.settings = { ...reseller.reseller.settings, ...args.settings };

    const before = { ...reseller.reseller };
    const after = { ...reseller.reseller, ...updates };

    await ctx.db.patch(reseller.reseller._id, updates);

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "user.updated" as any,
      entityType: "reseller",
      entityId: reseller.resellerId,
      before,
      after,
    });

    return { success: true };
  },
});

export const uploadVerificationDocument = mutation({
  args: {
    documentUrl: v.string(),
    documentType: v.string(),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    const currentDocuments = reseller.reseller.verificationDocuments || [];
    const updatedDocuments = [...currentDocuments, args.documentUrl];

    await ctx.db.patch(reseller.reseller._id, {
      verificationDocuments: updatedDocuments,
      updatedAt: Date.now(),
    });

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "file.uploaded" as any,
      entityType: "reseller",
      entityId: reseller.resellerId,
      after: { documentUrl: args.documentUrl, documentType: args.documentType },
    });

    return { success: true };
  },
});

export const requestTierUpgrade = mutation({
  args: {
    requestedTier: v.union(v.literal("silver"), v.literal("gold"), v.literal("platinum")),
    justification: v.string(),
  },
  handler: async (ctx, args) => {
    const reseller = await requireResellerContext(ctx);

    // Cannot downgrade tier
    const tierOrder = ["starter", "silver", "gold", "platinum"];
    if (tierOrder.indexOf(reseller.tier) >= tierOrder.indexOf(args.requestedTier)) {
      throw new Error("Cannot request tier downgrade");
    }

    // Log the tier upgrade request
    await logAction(ctx, {
      tenantId: "platform",
      actorId: reseller.userId,
      actorEmail: reseller.email,
      action: "user.updated" as any,
      entityType: "reseller",
      entityId: reseller.resellerId,
      after: {
        currentTier: reseller.tier,
        requestedTier: args.requestedTier,
        justification: args.justification,
      },
    });

    return { success: true };
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const reseller = await ctx.db
      .query("resellers")
      .withIndex("by_userId", q => q.eq("userId", identity.subject))
      .first();

    if (!reseller) {
      throw new Error("Reseller profile not found");
    }

    // Get additional stats
    const schools = await ctx.db
      .query("resellerSchools")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    const leads = await ctx.db
      .query("resellerLeads")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    const commissions = await ctx.db
      .query("resellerCommissions")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    const payouts = await ctx.db
      .query("resellerPayouts")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    return {
      ...reseller.stats,
      schools: {
        total: schools.length,
        active: schools.filter(s => s.status === "converted").length,
        leads: schools.filter(s => s.status === "lead").length,
        trials: schools.filter(s => s.status === "trial").length,
      },
      leads: {
        total: leads.length,
        new: leads.filter(l => l.status === "new").length,
        qualified: leads.filter(l => l.status === "qualified").length,
        closedWon: leads.filter(l => l.status === "closed_won").length,
        closedLost: leads.filter(l => l.status === "closed_lost").length,
      },
      commissions: {
        total: commissions.length,
        pending: commissions.filter(c => c.status === "pending").length,
        available: commissions.filter(c => c.status === "available").length,
        paid: commissions.filter(c => c.status === "paid").length,
        totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
      },
      payouts: {
        total: payouts.length,
        pending: payouts.filter(p => p.status === "pending").length,
        completed: payouts.filter(p => p.status === "completed").length,
        totalAmount: payouts.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
      },
    };
  },
});

export const getCommissionBalance = query({
  args: {},
  handler: async (ctx) => {
    const reseller = await requireResellerContext(ctx);

    const commissions = await ctx.db
      .query("resellerCommissions")
      .withIndex("by_reseller", q => q.eq("resellerId", reseller.resellerId))
      .collect();

    const availableCommissions = commissions.filter(c => c.status === "available");
    const totalAvailable = availableCommissions.reduce((sum, c) => sum + c.amount, 0);

    const pendingCommissions = commissions.filter(c => c.status === "pending" || c.status === "held");
    const totalPending = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

    return {
      availableAmount: totalAvailable,
      pendingAmount: totalPending,
      availableCount: availableCommissions.length,
      pendingCount: pendingCommissions.length,
      minPayout: reseller.reseller.commission.minPayout,
      canPayout: totalAvailable >= reseller.reseller.commission.minPayout,
    };
  },
});
