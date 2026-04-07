import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requirePublisherContext, requireTier } from "../../../helpers/publisherGuard";
import { internalLogAction } from "../../../helpers/auditLog";

export const getMyModules = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("submitted"), v.literal("approved"), v.literal("published"), v.literal("suspended"))),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    
    const page = args.page || 1;
    const pageSize = args.pageSize || 25;
    const skip = (page - 1) * pageSize;

    // Query modules from moduleRegistry where publisher is the owner
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_publisherId", q => q.eq("publisherId", publisher.publisherId))
      .collect();

    // Filter by status if provided
    let filteredModules = modules;
    if (args.status) {
      filteredModules = modules.filter(m => m.status === args.status);
    }

    // Apply pagination
    const paginatedModules = filteredModules.slice(skip, skip + pageSize);

    return {
      modules: paginatedModules,
      total: filteredModules.length,
      page,
      pageSize,
      hasMore: skip + pageSize < filteredModules.length,
    };
  },
});

export const createModule = mutation({
  args: {
    moduleId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    pricing: v.object({
      type: v.union(v.literal("free"), v.literal("paid"), v.literal("freemium")),
      amount: v.number(),
      currency: v.string(),
      billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual")),
    }),
    features: v.array(v.string()),
    requirements: v.array(v.string()),
    documentation: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),
    demoUrl: v.optional(v.string()),
    supportEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    // Check if module slug already exists
    const existingModule = await ctx.db
      .query("modules")
      .withIndex("by_slug", q => q.eq("slug", args.moduleId))
      .unique();

    if (existingModule) {
      throw new Error("Module ID already exists");
    }

    // Create the module
    const moduleId = await ctx.db.insert("modules", {
      publisherId: publisher.publisherId,
      name: args.name,
      slug: args.moduleId,
      tagline: args.description,
      description: args.description,
      category: args.category,
      pricingModel: args.pricing.type,
      suggestedPriceKes: args.pricing.amount,
      features: args.features,
      requirements: args.requirements,
      documentation: args.documentation,
      screenshots: args.screenshots || [],
      demoUrl: args.demoUrl,
      supportEmail: args.supportEmail,
      status: "draft",
      tier: "indie", // Default tier
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Get publisher record to update stats
    const publisherRecord = await ctx.db
      .query("publishers")
      .withIndex("by_userId", q => q.eq("userId", publisher.userId))
      .first();
    
    if (publisherRecord) {
      await ctx.db.patch(publisherRecord._id, {
        stats: {
          ...publisherRecord.stats,
          totalModules: publisherRecord.stats.totalModules + 1,
        },
        updatedAt: Date.now(),
      });
    }

    // Log the action
    await ctx.runMutation(internalLogAction, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "publisher.module_created",
      entityType: "module",
      entityId: moduleId,
      after: { moduleId: args.moduleId, name: args.name },
    });

    return { success: true, moduleId };
  },
});

export const updateModule = mutation({
  args: {
    moduleId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    pricing: v.optional(v.object({
      type: v.union(v.literal("free"), v.literal("paid"), v.literal("freemium")),
      currency: v.string(),
      amount: v.number(),
      billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual")),
    })),
    features: v.optional(v.array(v.string())),
    requirements: v.optional(v.array(v.string())),
    documentation: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),
    demoUrl: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    // Get the module
    const module = await ctx.db
      .query("modules")
      .withIndex("by_slug", q => q.eq("slug", args.moduleId))
      .unique();

    if (!module) {
      throw new Error("Module not found");
    }

    // Check if publisher owns this module
    if (module.publisherId !== publisher.publisherId) {
      throw new Error("Not authorized to update this module");
    }

    // Check if module can be updated in current status
    if (module.status === "published" && !publisher.publisher.settings.autoApproveUpdates) {
      throw new Error("Cannot update published module. Submit a new version instead.");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.category) updates.category = args.category;
    if (args.pricing) {
      updates.pricingModel = args.pricing.type;
      updates.suggestedPriceKes = args.pricing.amount;
    }
    if (args.features) updates.features = args.features;
    if (args.requirements) updates.requirements = args.requirements;
    if (args.documentation !== undefined) updates.documentation = args.documentation;
    if (args.screenshots) updates.screenshots = args.screenshots;
    if (args.demoUrl !== undefined) updates.demoUrl = args.demoUrl;
    if (args.supportEmail) updates.supportEmail = args.supportEmail;

    // If module was published and auto-approve is enabled, keep it published
    // Otherwise, set back to draft for review
    if (module.status === "published" && publisher.publisher.settings.autoApproveUpdates) {
      updates.status = "published";
    } else if (module.status === "published") {
      updates.status = "draft";
    }

    const before = { ...module };
    const after = { ...module, ...updates };

    await ctx.db.patch(module._id, updates);

    // Log the action
    await ctx.runMutation(internalLogAction, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "publisher.module_updated",
      entityType: "module",
      entityId: module._id,
      before,
      after,
    });

    return { success: true };
  },
});

export const submitForReview = mutation({
  args: {
    moduleId: v.string(),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    // Get the module
    const module = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_moduleId", q => q.eq("moduleId", args.moduleId))
      .unique();

    if (!module) {
      throw new Error("Module not found");
    }

    // Check if publisher owns this module
    if (module.publisherId !== publisher.publisherId) {
      throw new Error("Not authorized to update this module");
    }

    // Check if module is in draft status
    if (module.status !== "draft") {
      throw new Error("Module must be in draft status to submit for review");
    }

    await ctx.db.patch(module._id, {
      status: "submitted",
      updatedAt: Date.now(),
    });

    // Log the action
    await ctx.runMutation(internalLogAction, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "publisher.module_submitted",
      entityType: "module",
      entityId: module._id,
      after: { moduleId: args.moduleId, reviewNotes: args.reviewNotes },
    });

    return { success: true };
  },
});

export const deleteModule = mutation({
  args: {
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);

    // Get the module
    const module = await ctx.db
      .query("moduleRegistry")
      .withIndex("by_moduleId", q => q.eq("moduleId", args.moduleId))
      .unique();

    if (!module) {
      throw new Error("Module not found");
    }

    // Check if publisher owns this module
    if (module.publisherId !== publisher.publisherId) {
      throw new Error("Not authorized to delete this module");
    }

    // Cannot delete published modules with active installs
    if (module.status === "published" && module.downloads > 0) {
      throw new Error("Cannot delete published module with active installations");
    }

    const before = { ...module };

    await ctx.db.delete(module._id);

    // Update publisher stats
    await ctx.db.patch(publisher.publisherId, {
      stats: {
        ...publisher.publisher.stats,
        totalModules: Math.max(0, publisher.publisher.stats.totalModules - 1),
        activeModules: module.status === "published" 
          ? Math.max(0, publisher.publisher.stats.activeModules - 1)
          : publisher.publisher.stats.activeModules,
      },
      updatedAt: Date.now(),
    });

    // Log the action
    await ctx.runMutation(internalLogAction, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "publisher.module_deleted",
      entityType: "module",
      entityId: module._id,
      before,
    });

    return { success: true };
  },
});
