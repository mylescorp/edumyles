import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { requirePlatformRole, requirePlatformSession } from "../../helpers/platformGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePublisherContext } from "../../helpers/publisherGuard";

function ensureMasterAdmin(role: string) {
  if (role !== "master_admin") {
    throw new Error("FORBIDDEN: master_admin access required");
  }
}

export const getPublishers = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.string()),
    tier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    let applications = await ctx.db.query("publisherApplications").collect();
    if (args.status) applications = applications.filter((app) => app.status === args.status);
    return applications;
  },
});

export const getPublisher = query({
  args: {
    sessionToken: v.optional(v.string()),
    publisherId: v.optional(v.id("publisherApplications")),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken) {
      await requirePlatformRole(ctx, { sessionToken: args.sessionToken }, [
        "marketplace_reviewer",
        "platform_manager",
        "super_admin",
        "master_admin",
      ]);
      if (!args.publisherId) {
        throw new Error("publisherId is required");
      }
      return await ctx.db.get(args.publisherId);
    }

    const publisherCtx = await requirePublisherContext(ctx);
    return await ctx.db
      .query("publisherApplications")
      .withIndex("by_applicant", (q) => q.eq("applicantId", publisherCtx.userId))
      .first();
  },
});

export const getPublisherDetailBundle = query({
  args: {
    sessionToken: v.string(),
    publisherId: v.id("publisherApplications"),
  },
  handler: async (ctx, args) => {
    await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);

    const publisher = await ctx.db.get(args.publisherId);
    if (!publisher) {
      throw new Error("Publisher not found");
    }

    const [modules, payouts, tickets, webhooks] = await Promise.all([
      ctx.db
        .query("modules")
        .withIndex("by_publisherId", (q) => q.eq("publisherId", String(args.publisherId)))
        .collect(),
      ctx.db
        .query("publisher_payouts")
        .withIndex("by_publisherId", (q) => q.eq("publisherId", String(args.publisherId)))
        .collect(),
      ctx.db
        .query("publisher_support_tickets")
        .withIndex("by_publisherId", (q) => q.eq("publisherId", String(args.publisherId)))
        .collect(),
      ctx.db
        .query("publisher_webhook_logs")
        .withIndex("by_publisherId", (q) => q.eq("publisherId", String(args.publisherId)))
        .collect(),
    ]);

    return {
      publisher,
      modules: modules.sort((a, b) => b.updatedAt - a.updatedAt),
      payouts: payouts.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10),
      supportTickets: tickets.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10),
      webhookLogs: webhooks.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10),
      stats: {
        totalModules: modules.length,
        publishedModules: modules.filter((module) => module.status === "published").length,
        pendingModules: modules.filter((module) => module.status === "pending_review").length,
        suspendedModules: modules.filter((module) => module.status === "suspended").length,
        totalPayoutKes: payouts
          .filter((payout) => payout.status === "paid")
          .reduce((sum, payout) => sum + payout.amountKes, 0),
        openSupportTickets: tickets.filter((ticket) =>
          ["open", "in_progress"].includes(ticket.status)
        ).length,
        failedWebhooks: webhooks.filter((log) => log.status === "failed").length,
      },
    };
  },
});

export const applyAsPublisher = mutation({
  args: {
    companyName: v.string(),
    website: v.optional(v.string()),
    billingCountry: v.optional(v.string()),
    taxId: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireTenantContext(ctx);
    const existing = await ctx.db
      .query("publisherApplications")
      .withIndex("by_applicant", (q) => q.eq("applicantId", actor.userId))
      .first();

    if (existing) {
      throw new Error("Publisher application already exists");
    }

    const publisherId = await ctx.db.insert("publisherApplications", {
      applicantId: actor.userId,
      applicantEmail: actor.email,
      businessName: args.companyName,
      businessType: "company", // Default to company type
      businessDescription: "Publisher application for " + args.companyName,
      website: args.website,
      contactPhone: "+254", // Default Kenya phone prefix
      contactAddress: "Kenya",
      country: args.billingCountry || "Kenya",
      experience: "New publisher",
      modules: [],
      status: "submitted",
      submittedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "marketplace.publisher_registered",
      entityType: "publisher",
      entityId: String(publisherId),
      after: { companyName: args.companyName },
    });

    return { success: true, publisherId };
  },
});

export const approvePublisher = mutation({
  args: {
    sessionToken: v.string(),
    publisherId: v.id("publishers"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    await ctx.db.patch(args.publisherId, {
      status: "active",
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.publisher_verified",
      entityType: "publisher",
      entityId: String(args.publisherId),
      after: { status: "approved" },
    });

    return { success: true };
  },
});

export const rejectPublisher = mutation({
  args: {
    sessionToken: v.string(),
    publisherId: v.id("publisherApplications"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    await ctx.db.patch(args.publisherId, {
      status: "rejected",
      reviewedBy: platform.userId,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.publisher_suspended",
      entityType: "publisher",
      entityId: String(args.publisherId),
      after: { status: "rejected" },
    });

    return { success: true };
  },
});

export const suspendPublisher = mutation({
  args: {
    sessionToken: v.string(),
    publisherId: v.id("publisherApplications"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    await ctx.db.patch(args.publisherId, {
      status: "on_hold",
      reviewedBy: platform.userId,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.publisher_suspended",
      entityType: "publisher",
      entityId: String(args.publisherId),
      after: { status: "on_hold" },
    });

    return { success: true };
  },
});

export const banPublisher = mutation({
  args: {
    sessionToken: v.string(),
    publisherId: v.id("publisherApplications"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    ensureMasterAdmin(platform.role);
    await ctx.db.patch(args.publisherId, {
      status: "rejected",
      reviewedBy: platform.userId,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.publisher_suspended",
      entityType: "publisher",
      entityId: String(args.publisherId),
      after: { status: "rejected" },
    });
    return { success: true };
  },
});

// TODO: Re-implement when publisherApplications schema supports tier management
// export const updatePublisherTier = mutation({
//   args: {
//     sessionToken: v.string(),
//     publisherId: v.id("publisherApplications"),
//     tier: v.union(v.literal("indie"), v.literal("verified"), v.literal("enterprise")),
//   },
//   handler: async (ctx, args) => {
//     const platform = await requirePlatformSession(ctx, args);
//     ensureMasterAdmin(platform.role);
//     // Tier management not supported in publisherApplications schema
//     throw new Error("Tier management not available for publisher applications");
//   },
// });

// TODO: Revenue share is now determined by tier, not a separate field
// export const updateRevenueShare = mutation({
//   args: {
//     sessionToken: v.string(),
//     publisherId: v.id("publisherApplications"),
//     revenueSharePct: v.number(),
//   },
//   handler: async (ctx, args) => {
//     const platform = await requirePlatformSession(ctx, args);
//     ensureMasterAdmin(platform.role);
//     // Revenue share is now determined by tier, not a separate field
//     throw new Error("Revenue share management not available for publisher applications");
//   },
// });
