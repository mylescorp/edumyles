import { v } from "convex/values";
import { mutation, query } from "../../../_generated/server";
import { requirePublisherContext, requireTier } from "../../../helpers/publisherGuard";
import { logAction } from "../../../helpers/auditLog";

export const getMyModules = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("pending_review"), v.literal("changes_requested"), v.literal("published"), v.literal("suspended"), v.literal("deprecated"), v.literal("banned"))),
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

    const moduleIds = filteredModules.map((module) => String(module._id));
    const [stats, reviews] = await Promise.all([
      moduleIds.length === 0
        ? Promise.resolve([])
        : ctx.db
            .query("module_install_stats")
            .collect()
            .then((items) => items.filter((item) => moduleIds.includes(item.moduleId))),
      moduleIds.length === 0
        ? Promise.resolve([])
        : ctx.db
            .query("module_reviews")
            .collect()
            .then((items) => items.filter((item) => moduleIds.includes(item.moduleId))),
    ]);

    const enrichedModules = filteredModules.map((module) => {
      const moduleId = String(module._id);
      const stat = stats.find((item) => item.moduleId === moduleId);
      const reviewCount = reviews.filter(
        (review) => review.moduleId === moduleId && review.status === "approved"
      ).length;
      return {
        ...module,
        installs: stat?.totalInstalls ?? 0,
        activeInstalls: stat?.activeInstalls ?? 0,
        revenueKes: stat?.totalRevenueKes ?? 0,
        averageRating: stat?.avgRating ?? 0,
        reviewCount,
      };
    });

    // Apply pagination
    const paginatedModules = enrichedModules.slice(skip, skip + pageSize);

    return {
      modules: paginatedModules,
      total: enrichedModules.length,
      page,
      pageSize,
      hasMore: skip + pageSize < enrichedModules.length,
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
      featureList: args.features,
      supportedRoles: args.requirements,
      supportEmail: args.supportEmail,
      documentationUrl: args.documentation,
      status: "draft",
      isFeatured: false,
      compatibleModuleIds: [],
      incompatibleModuleIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "marketplace.module_submitted" as any,
      entityType: "module",
      entityId: String(moduleId),
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
    if (args.features) updates.featureList = args.features;
    if (args.requirements) updates.supportedRoles = args.requirements;
    if (args.documentation !== undefined) updates.documentationUrl = args.documentation;
    if (args.supportEmail) updates.supportEmail = args.supportEmail;

    // If module was published and auto-approve is enabled, keep it published
    // Otherwise, set back to draft for review
    if (module.status === "published") updates.status = "pending_review";

    const before = { ...module };
    const after = { ...module, ...updates };

    await ctx.db.patch(module._id, updates);

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "marketplace.module_updated",
      entityType: "module",
      entityId: String(module._id),
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

    // Check if module is in draft status
    if (module.status !== "draft") {
      throw new Error("Module must be in draft status to submit for review");
    }

    await ctx.db.patch(module._id, {
      status: "pending_review",
    });

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "marketplace.module_submitted",
      entityType: "module",
      entityId: String(module._id),
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
      .query("modules")
      .withIndex("by_slug", q => q.eq("slug", args.moduleId))
      .unique();

    if (!module) {
      throw new Error("Module not found");
    }

    // Check if publisher owns this module
    if (module.publisherId !== publisher.publisherId) {
      throw new Error("Not authorized to delete this module");
    }

    // Cannot delete published modules with active installs
    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_moduleId", q => q.eq("moduleId", String(module._id)))
      .collect();

    if (module.status === "published" && installs.length > 0) {
      throw new Error("Cannot delete published module with active installations");
    }

    const before = { ...module };

    await ctx.db.delete(module._id);

    // Log the action
    await logAction(ctx, {
      tenantId: "platform",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "marketplace.listing_deleted" as any,
      entityType: "module",
      entityId: String(module._id),
      before,
    });

    return { success: true };
  },
});
