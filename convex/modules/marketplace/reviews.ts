import { internal } from "../../_generated/api";
import { mutation, query } from "../../_generated/server";
import { ConvexError, v } from "convex/values";
import { logAction } from "../../helpers/auditLog";
import { requirePlatformRole } from "../../helpers/platformGuard";
import { requirePublisherContext } from "../../helpers/publisherGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";

async function getModuleByRef(ctx: any, moduleId: string) {
  const direct = await ctx.db
    .query("modules")
    .withIndex("by_slug", (q: any) => q.eq("slug", moduleId))
    .first();
  if (direct) return direct;

  const modules = await ctx.db
    .query("modules")
    .withIndex("by_publisherId", (q: any) => q.gt("publisherId", ""))
    .collect();
  return modules.find((record: any) => String(record._id) === moduleId) ?? null;
}

async function refreshStats(ctx: any, moduleId: string) {
  await ctx.runMutation(internal.modules.marketplace.analytics.refreshModuleInstallStats, {
    moduleId,
  });
}

export const getModuleReviews = query({
  args: {
    moduleId: v.string(),
  },
  handler: async (ctx, args) => {
    const module = await getModuleByRef(ctx, args.moduleId);
    if (!module) {
      return [];
    }

    const reviews = await ctx.db
      .query("module_reviews")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", String(module._id)))
      .collect();

    return reviews
      .filter((review) => review.status === "approved")
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const submitReview = mutation({
  args: {
    moduleId: v.string(),
    rating: v.number(),
    title: v.optional(v.string()),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireTenantContext(ctx);
    const module = await getModuleByRef(ctx, args.moduleId);
    if (!module) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Module not found" });
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new ConvexError({ code: "INVALID_ARGUMENT", message: "Rating must be between 1 and 5" });
    }

    const installs = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", actor.tenantId))
      .collect();
    const install = installs.find(
      (entry) =>
        [String(module._id), module.slug].includes(entry.moduleId) &&
        ["active", "suspended"].includes(entry.status) &&
        typeof entry.installedAt === "number"
    );

    if (!install?.installedAt) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only review a module after installation",
      });
    }

    const installedDaysAtReview = Math.floor((Date.now() - install.installedAt) / 86_400_000);
    if (installedDaysAtReview < 14) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Modules can only be reviewed after 14 days of installation",
      });
    }

    const existingReviews = await ctx.db
      .query("module_reviews")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", actor.tenantId))
      .collect();
    const existingReview = existingReviews.find(
      (review) => review.moduleId === String(module._id) && review.status !== "deleted"
    );
    if (existingReview) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "A review for this module already exists for your tenant",
      });
    }

    const now = Date.now();
    const reviewId = await ctx.db.insert("module_reviews", {
      moduleId: String(module._id),
      tenantId: actor.tenantId,
      rating: args.rating,
      title: args.title ?? "Module review",
      body: args.body,
      status: "pending",
      publisherReply: undefined,
      flaggedAt: undefined,
      installedDaysAtReview,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.runMutation(internal.modules.marketplace.analytics.recordAnalyticsEvent, {
      moduleId: String(module._id),
      tenantId: actor.tenantId,
      eventType: "review_submitted",
      metadata: { reviewId: String(reviewId), rating: args.rating },
      timestamp: now,
    });

    await refreshStats(ctx, String(module._id));

    await logAction(ctx, {
      tenantId: actor.tenantId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "marketplace.review_submitted",
      entityType: "module_review",
      entityId: String(reviewId),
      after: { moduleId: String(module._id), rating: args.rating },
    });

    return { success: true, reviewId };
  },
});

export const updateReview = mutation({
  args: {
    reviewId: v.id("module_reviews"),
    rating: v.optional(v.number()),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireTenantContext(ctx);
    const review = await ctx.db.get(args.reviewId);

    if (!review || review.tenantId !== actor.tenantId || review.status === "deleted") {
      throw new ConvexError({ code: "NOT_FOUND", message: "Review not found" });
    }

    if (args.rating !== undefined && (args.rating < 1 || args.rating > 5)) {
      throw new ConvexError({ code: "INVALID_ARGUMENT", message: "Rating must be between 1 and 5" });
    }

    await ctx.db.patch(args.reviewId, {
      rating: args.rating ?? review.rating,
      title: args.title ?? review.title,
      body: args.body ?? review.body,
      status: "pending",
      updatedAt: Date.now(),
    });

    await refreshStats(ctx, review.moduleId);
    return { success: true };
  },
});

export const replyToReview = mutation({
  args: {
    reviewId: v.id("module_reviews"),
    reply: v.string(),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Review not found" });
    }

    const module = await getModuleByRef(ctx, review.moduleId);
    if (!module || module.publisherId !== publisher.publisherId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Review access denied" });
    }

    await ctx.db.patch(args.reviewId, {
      publisherReply: args.reply,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "marketplace.listing_updated",
      entityType: "module_review",
      entityId: String(args.reviewId),
      after: { publisherReply: true },
    });

    return { success: true };
  },
});

export const moderateReview = mutation({
  args: {
    sessionToken: v.string(),
    reviewId: v.id("module_reviews"),
    status: v.union(v.literal("approved"), v.literal("flagged"), v.literal("deleted")),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformRole(ctx, args, [
      "marketplace_reviewer",
      "content_moderator",
      "platform_manager",
      "super_admin",
      "master_admin",
    ]);
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Review not found" });
    }

    await ctx.db.patch(args.reviewId, {
      status: args.status,
      flaggedAt: args.status === "flagged" ? Date.now() : review.flaggedAt,
      updatedAt: Date.now(),
    });

    await refreshStats(ctx, review.moduleId);

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "marketplace.review_moderated",
      entityType: "module_review",
      entityId: String(args.reviewId),
      after: { status: args.status },
    });

    return { success: true };
  },
});

export const flagReview = mutation({
  args: {
    reviewId: v.id("module_reviews"),
  },
  handler: async (ctx, args) => {
    const publisher = await requirePublisherContext(ctx);
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Review not found" });
    }

    const module = await getModuleByRef(ctx, review.moduleId);
    if (!module || module.publisherId !== publisher.publisherId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Review access denied" });
    }

    await ctx.db.patch(args.reviewId, {
      status: "flagged",
      flaggedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: "PLATFORM",
      actorId: publisher.userId,
      actorEmail: publisher.email,
      action: "marketplace.review_moderated",
      entityType: "module_review",
      entityId: String(args.reviewId),
      after: { status: "flagged", flaggedByPublisher: true },
    });

    return { success: true };
  },
});
