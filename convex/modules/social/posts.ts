import { ConvexError, v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { internal } from "../../_generated/api";
import {
  ensureOwnedRecord,
  getScopeFlag,
  requireSocialContext,
  sanitizeSocialHtml,
  socialPlatformValidator,
  socialPostStatusValidator,
  socialScopeArgs,
  validatePlatformLimits,
} from "./shared";

const socialVariantValidator = v.object({
  platform: socialPlatformValidator,
  accountId: v.id("social_accounts"),
  textContent: v.optional(v.string()),
  mediaUrls: v.array(v.string()),
  mediaType: v.optional(v.string()),
  linkUrl: v.optional(v.string()),
  linkTitle: v.optional(v.string()),
  linkDescription: v.optional(v.string()),
  tweetThreadParts: v.optional(v.array(v.string())),
  pollOptions: v.optional(v.array(v.string())),
  pollDurationMinutes: v.optional(v.number()),
  youtubeTitle: v.optional(v.string()),
  youtubeDescription: v.optional(v.string()),
  youtubeTags: v.optional(v.array(v.string())),
  youtubeCategory: v.optional(v.string()),
  youtubePrivacy: v.optional(v.string()),
  tiktokCaption: v.optional(v.string()),
  whatsappTemplateId: v.optional(v.string()),
  telegramChatId: v.optional(v.string()),
});

function sanitizeVariant(variant: any) {
  const next = {
    ...variant,
    textContent: sanitizeSocialHtml(variant.textContent),
    linkTitle: sanitizeSocialHtml(variant.linkTitle),
    linkDescription: sanitizeSocialHtml(variant.linkDescription),
    youtubeTitle: sanitizeSocialHtml(variant.youtubeTitle),
    youtubeDescription: sanitizeSocialHtml(variant.youtubeDescription),
    tiktokCaption: sanitizeSocialHtml(variant.tiktokCaption),
    tweetThreadParts: variant.tweetThreadParts?.map((part: string) => sanitizeSocialHtml(part)),
    pollOptions: variant.pollOptions?.map((option: string) => sanitizeSocialHtml(option)),
    mediaUrls: variant.mediaUrls ?? [],
  };
  validatePlatformLimits(next);
  return next;
}

async function assertAccountsBelongToScope(ctx: any, scope: any, targetAccountIds: any[]) {
  const accounts = await Promise.all(targetAccountIds.map((accountId) => ctx.db.get(accountId)));
  for (const account of accounts) {
    ensureOwnedRecord(scope, account, "Social account");
  }
}

export const createPost = mutation({
  args: {
    ...socialScopeArgs,
    title: v.string(),
    scheduledAt: v.optional(v.number()),
    approvalRequired: v.optional(v.boolean()),
    tags: v.array(v.string()),
    campaignId: v.optional(v.id("social_campaigns")),
    targetAccountIds: v.array(v.id("social_accounts")),
    platformVariants: v.array(socialVariantValidator),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "create_posts");
    await assertAccountsBelongToScope(ctx, scope, args.targetAccountIds);

    const now = Date.now();
    const approvalRequired = args.approvalRequired ?? !scope.isPlatformContext;
    const platformVariants = args.platformVariants.map(sanitizeVariant);

    const postId = await ctx.db.insert("social_posts", {
      ...getScopeFlag(scope, "tenantId", "isPlatformPost"),
      title: sanitizeSocialHtml(args.title),
      status: approvalRequired ? "draft" : args.scheduledAt ? "scheduled" : "approved",
      scheduledAt: args.scheduledAt,
      targetAccountIds: args.targetAccountIds,
      platformVariants,
      approvalRequired,
      tags: args.tags.map((tag) => tag.trim()).filter(Boolean),
      campaignId: args.campaignId,
      createdBy: scope.actorId,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, postId };
  },
});

export const updatePost = mutation({
  args: {
    ...socialScopeArgs,
    postId: v.id("social_posts"),
    title: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    campaignId: v.optional(v.id("social_campaigns")),
    targetAccountIds: v.optional(v.array(v.id("social_accounts"))),
    platformVariants: v.optional(v.array(socialVariantValidator)),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "create_posts");
    const post = await ctx.db.get(args.postId);
    ensureOwnedRecord(scope, post, "Social post");
    if (!post) {
      throw new Error("Post not found");
    }

    if (!["draft", "rejected"].includes(post.status)) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Only draft or rejected posts can be edited.",
      });
    }

    if (args.targetAccountIds) {
      await assertAccountsBelongToScope(ctx, scope, args.targetAccountIds);
    }

    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = sanitizeSocialHtml(args.title);
    if (args.scheduledAt !== undefined) patch.scheduledAt = args.scheduledAt;
    if (args.tags !== undefined) patch.tags = args.tags.map((tag) => tag.trim()).filter(Boolean);
    if (args.campaignId !== undefined) patch.campaignId = args.campaignId;
    if (args.targetAccountIds !== undefined) patch.targetAccountIds = args.targetAccountIds;
    if (args.platformVariants !== undefined) {
      patch.platformVariants = args.platformVariants.map(sanitizeVariant);
    }

    await ctx.db.patch(args.postId, patch);
    return { success: true, postId: args.postId };
  },
});

export const deletePost = mutation({
  args: {
    ...socialScopeArgs,
    postId: v.id("social_posts"),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "create_posts");
    const post = await ctx.db.get(args.postId);
    ensureOwnedRecord(scope, post, "Social post");
    await ctx.db.patch(args.postId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const submitForApproval = mutation({
  args: {
    ...socialScopeArgs,
    postId: v.id("social_posts"),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "create_posts");
    const post = await ctx.db.get(args.postId);
    ensureOwnedRecord(scope, post, "Social post");
    if (!post) {
      throw new Error("Post not found");
    }
    if (post.isDeleted) throw new Error("Post not found");
    if (!["draft", "rejected"].includes(post.status)) {
      throw new Error("Only draft or rejected posts can be submitted.");
    }
    await ctx.db.patch(args.postId, {
      status: "pending_approval",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const approvePost = mutation({
  args: {
    ...socialScopeArgs,
    postId: v.id("social_posts"),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "approve_posts");
    const post = await ctx.db.get(args.postId);
    ensureOwnedRecord(scope, post, "Social post");
    if (!post) {
      throw new Error("Post not found");
    }
    if (!["pending_approval", "draft", "approved"].includes(post.status)) {
      throw new Error("Post cannot be approved from its current state.");
    }

    const nextStatus = post.scheduledAt && post.scheduledAt > Date.now() ? "scheduled" : "approved";
    await ctx.db.patch(args.postId, {
      status: nextStatus,
      approvedBy: scope.actorId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
    if (nextStatus === "approved") {
      await ctx.db.patch(args.postId, {
        status: "publishing",
        updatedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, (internal as any).actions.social.publish.publishPost, {
        postId: args.postId,
      });
    }
    return { success: true, status: nextStatus };
  },
});

export const rejectPost = mutation({
  args: {
    ...socialScopeArgs,
    postId: v.id("social_posts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "approve_posts");
    const post = await ctx.db.get(args.postId);
    ensureOwnedRecord(scope, post, "Social post");
    if (!post) {
      throw new Error("Post not found");
    }
    await ctx.db.patch(args.postId, {
      status: "rejected",
      rejectedBy: scope.actorId,
      rejectedAt: Date.now(),
      rejectionReason: sanitizeSocialHtml(args.reason),
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const cancelPost = mutation({
  args: {
    ...socialScopeArgs,
    postId: v.id("social_posts"),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "approve_posts");
    const post = await ctx.db.get(args.postId);
    ensureOwnedRecord(scope, post, "Social post");
    if (!post) {
      throw new Error("Post not found");
    }
    await ctx.db.patch(args.postId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const reschedulePost = mutation({
  args: {
    ...socialScopeArgs,
    postId: v.id("social_posts"),
    scheduledAt: v.number(),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "approve_posts");
    const post = await ctx.db.get(args.postId);
    ensureOwnedRecord(scope, post, "Social post");
    if (!post) {
      throw new Error("Post not found");
    }
    if (["published", "publishing", "cancelled"].includes(post.status)) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "This post can no longer be rescheduled.",
      });
    }

    const nextStatus = args.scheduledAt > Date.now() ? "scheduled" : "approved";
    await ctx.db.patch(args.postId, {
      scheduledAt: args.scheduledAt,
      status: nextStatus,
      updatedAt: Date.now(),
    });

    return { success: true, status: nextStatus };
  },
});

export const getPosts = query({
  args: {
    ...socialScopeArgs,
    status: v.optional(socialPostStatusValidator),
    platform: v.optional(socialPlatformValidator),
    creator: v.optional(v.string()),
    campaignId: v.optional(v.id("social_campaigns")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "view_social_dashboard");
    const posts = await ctx.db.query("social_posts").collect();
    return posts
      .filter((post) => ensureListScope(scope, post))
      .filter((post) => !post.isDeleted)
      .filter((post) => (args.status ? post.status === args.status : true))
      .filter((post) => (args.creator ? post.createdBy === args.creator : true))
      .filter((post) => (args.campaignId ? post.campaignId === args.campaignId : true))
      .filter((post) =>
        args.platform ? post.platformVariants.some((variant: any) => variant.platform === args.platform) : true
      )
      .filter((post) => (args.dateFrom ? (post.scheduledAt ?? post.createdAt) >= args.dateFrom : true))
      .filter((post) => (args.dateTo ? (post.scheduledAt ?? post.createdAt) <= args.dateTo : true))
      .sort((a, b) => (b.scheduledAt ?? b.createdAt) - (a.scheduledAt ?? a.createdAt));
  },
});

function ensureListScope(scope: any, post: any) {
  return scope.isPlatformContext ? Boolean(post.isPlatformPost) : post.tenantId === scope.tenantId;
}

export const getPost = query({
  args: {
    ...socialScopeArgs,
    postId: v.id("social_posts"),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "view_social_dashboard");
    const post = await ctx.db.get(args.postId);
    ensureOwnedRecord(scope, post, "Social post");
    const analytics = await ctx.db
      .query("social_analytics")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .collect();
    const comments = await ctx.db
      .query("social_comments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .collect();
    return {
      ...post,
      analytics,
      comments,
    };
  },
});

export const getPostsForCalendar = query({
  args: {
    ...socialScopeArgs,
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "view_social_dashboard");
    const start = new Date(args.year, args.month - 1, 1).getTime();
    const end = new Date(args.year, args.month, 1).getTime() - 1;
    const posts = await ctx.db.query("social_posts").collect();
    return posts
      .filter((post) => ensureListScope(scope, post))
      .filter((post) => !post.isDeleted)
      .filter((post) => {
        const scheduledAt = post.scheduledAt ?? post.createdAt;
        return scheduledAt >= start && scheduledAt <= end;
      })
      .sort((a, b) => (a.scheduledAt ?? a.createdAt) - (b.scheduledAt ?? b.createdAt));
  },
});
