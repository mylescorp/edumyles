import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requirePublisherContext, requireTier } from "../../../helpers/publisherGuard";
import { logAction } from "../../../helpers/auditLog";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const publisher = await requirePublisherContext(ctx);
    return publisher.publisher;
  },
});

export const updateProfile = mutation({
  args: {
    businessName: v.optional(v.string()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    taxId: v.optional(v.string()),
    billingCountry: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    bankDetails: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.businessName) updates.companyName = args.businessName;
    if (args.website !== undefined) updates.website = args.website;
    if (args.email) updates.email = args.email;
    if (args.taxId !== undefined) updates.taxId = args.taxId;
    if (args.billingCountry !== undefined) updates.billingCountry = args.billingCountry;
    if (args.webhookUrl !== undefined) updates.webhookUrl = args.webhookUrl;
    if (args.bankDetails !== undefined) updates.bankDetails = args.bankDetails;

    const before = { ...publisher.publisher };
    const after = { ...publisher.publisher, ...updates };

    await ctx.db.patch(publisher.publisher._id, updates);

    // Log the action
    await logAction(ctx, {
      tenantId: "platform", // Platform-level action
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "user.updated" as any,
      entityType: "publisher",
      entityId: publisher.publisherId,
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
    const publisher = await requirePublisherContext(ctx);

    await logAction(ctx, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "file.uploaded" as any,
      entityType: "publisher",
      entityId: publisher.publisherId,
      after: { documentUrl: args.documentUrl, documentType: args.documentType },
    });

    return { success: true };
  },
});

export const requestTierUpgrade = mutation({
  args: {
    requestedTier: v.union(v.literal("verified"), v.literal("enterprise")),
    justification: v.string(),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    // Cannot downgrade tier
    const tierOrder = ["indie", "verified", "enterprise"];
    if (tierOrder.indexOf(publisher.tier) >= tierOrder.indexOf(args.requestedTier)) {
      throw new Error("Cannot request tier downgrade");
    }

    // Create a tier upgrade request (you might want to create a separate table for this)
    // For now, we'll just log the request

    await logAction(ctx, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "role.updated" as any,
      entityType: "publisher",
      entityId: publisher.publisherId,
      after: {
        currentTier: publisher.tier,
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
    const publisher = await requirePublisherContext(ctx);
    
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_publisherId", (q) => q.eq("publisherId", publisher.publisherId))
      .collect();

    const installs = await ctx.db
      .query("module_installs")
      .collect();

    const myModuleIds = new Set(modules.map((module) => String(module._id)));
    const myInstalls = installs.filter((install) => myModuleIds.has(install.moduleId));

    return {
      totalModules: modules.length,
      publishedModules: modules.filter((module) => module.status === "published").length,
      totalInstalls: myInstalls.length,
      activeInstalls: myInstalls.filter((install) => install.status === "active").length,
      revenueSharePct: publisher.publisher.revenueSharePct,
      status: publisher.publisher.status,
      tier: publisher.publisher.tier,
    };
  },
});
