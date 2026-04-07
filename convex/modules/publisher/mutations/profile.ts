import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requirePublisherContext, requireTier } from "../../../helpers/publisherGuard";
import { internalLogAction } from "../../../helpers/auditLog";

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
    })),
    settings: v.optional(v.object({
      autoApproveUpdates: v.boolean(),
      emailNotifications: v.boolean(),
      supportLevel: v.union(v.literal("basic"), v.literal("standard"), v.literal("premium")),
    })),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.businessName) updates.businessName = args.businessName;
    if (args.website !== undefined) updates.website = args.website;
    if (args.description) updates.description = args.description;
    if (args.contactInfo) updates.contactInfo = args.contactInfo;
    if (args.banking) updates.banking = args.banking;
    if (args.settings) updates.settings = { ...publisher.publisher.settings, ...args.settings };

    const before = { ...publisher.publisher };
    const after = { ...publisher.publisher, ...updates };

    await ctx.db.patch(publisher.publisherId, updates);

    // Log the action
    await ctx.runMutation(internalLogAction, {
      tenantId: "platform", // Platform-level action
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "publisher.profile_updated",
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

    const currentDocuments = publisher.publisher.verificationDocuments || [];
    const updatedDocuments = [...currentDocuments, args.documentUrl];

    await ctx.db.patch(publisher.publisherId, {
      verificationDocuments: updatedDocuments,
      updatedAt: Date.now(),
    });

    // Log the action
    await ctx.runMutation(internalLogAction, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "publisher.document_uploaded",
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

    await ctx.runMutation(internalLogAction, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "publisher.tier_upgrade_requested",
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
    
    // Return publisher stats from the publisher document
    return publisher.publisher.stats;
  },
});
