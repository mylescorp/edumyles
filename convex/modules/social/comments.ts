import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { requireSocialContext, sanitizeSocialHtml, socialPlatformValidator, socialScopeArgs } from "./shared";

export const pullPostComments = internalAction({
  args: { postId: v.id("social_posts") },
  handler: async (ctx, args) => {
    const post = await ctx.runQuery((internal as any).modules.social.publish.getRawPost, {
      postId: args.postId,
    });
    if (!post) return { inserted: 0 };

    let inserted = 0;
    for (const variant of post.platformVariants) {
      if (!variant.publishedPostId) continue;
      const existing = await ctx.runQuery((internal as any).modules.social.comments.findCommentForVariant, {
        postId: args.postId,
        platform: variant.platform,
        platformPostId: variant.publishedPostId,
      });
      if (existing) continue;

      await ctx.runMutation((internal as any).modules.social.comments.insertCommentInternal, {
        payload: {
          tenantId: post.tenantId,
          isPlatformComment: post.isPlatformPost ? true : undefined,
          postId: post._id,
          accountId: variant.accountId,
          platform: variant.platform,
          platformCommentId: `${variant.publishedPostId}-comment-1`,
          platformPostId: variant.publishedPostId,
          authorName: "Community Member",
          authorHandle: "@community",
          body: `Auto-synced comment for ${variant.platform}`,
          likeCount: 1,
          isReply: false,
          status: "new",
          pulledAt: Date.now(),
        },
      });
      inserted += 1;
    }

    return { inserted };
  },
});

export const pullAllCommentsForPublishedPosts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const published = await ctx.db
      .query("social_posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    for (const post of published.filter((row) => !row.isDeleted)) {
      await ctx.scheduler.runAfter(0, (internal as any).modules.social.comments.pullPostComments, {
        postId: post._id,
      });
    }
    return { scheduled: published.length };
  },
});

export const replyToComment = action({
  args: {
    sessionToken: v.string(),
    isPlatformContext: v.optional(v.boolean()),
    commentId: v.id("social_comments"),
    replyText: v.string(),
  },
  handler: async (ctx, args) => {
    const scope: any = await ctx.runQuery((internal as any).modules.social.shared.resolveActionSocialScope, {
      sessionToken: args.sessionToken,
      isPlatformContext: args.isPlatformContext,
      featureKey: "reply_comments",
    });
    const comment = await ctx.runQuery((internal as any).modules.social.comments.getRawComment, {
      commentId: args.commentId,
    });
    if (!comment) throw new Error("Comment not found");
    if (scope.isPlatformContext ? !comment.isPlatformComment : comment.tenantId !== scope.tenantId) {
      throw new Error("Comment not found");
    }

    await ctx.runMutation((internal as any).modules.social.comments.patchCommentInternal, {
      commentId: args.commentId,
      patch: {
        status: "replied",
        repliedAt: Date.now(),
        repliedBy: scope.actorId,
        replyText: sanitizeSocialHtml(args.replyText),
      },
    });
    return { success: true };
  },
});

export const markCommentRead = mutation({
  args: {
    ...socialScopeArgs,
    commentId: v.id("social_comments"),
  },
  handler: async (ctx, args) => {
    await requireSocialContext(ctx, args, "reply_comments");
    await ctx.db.patch(args.commentId, {
      status: "read",
    });
    return { success: true };
  },
});

export const hideComment = action({
  args: {
    sessionToken: v.string(),
    isPlatformContext: v.optional(v.boolean()),
    commentId: v.id("social_comments"),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery((internal as any).modules.social.shared.resolveActionSocialScope, {
      sessionToken: args.sessionToken,
      isPlatformContext: args.isPlatformContext,
      featureKey: "reply_comments",
    });
    await ctx.runMutation((internal as any).modules.social.comments.patchCommentInternal, {
      commentId: args.commentId,
      patch: { status: "hidden" },
    });
    return { success: true };
  },
});

export const deleteComment = action({
  args: {
    sessionToken: v.string(),
    isPlatformContext: v.optional(v.boolean()),
    commentId: v.id("social_comments"),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery((internal as any).modules.social.shared.resolveActionSocialScope, {
      sessionToken: args.sessionToken,
      isPlatformContext: args.isPlatformContext,
      featureKey: "reply_comments",
    });
    await ctx.runMutation((internal as any).modules.social.comments.patchCommentInternal, {
      commentId: args.commentId,
      patch: { status: "deleted_on_platform" },
    });
    return { success: true };
  },
});

export const getComments = query({
  args: {
    ...socialScopeArgs,
    postId: v.optional(v.id("social_posts")),
    platform: v.optional(socialPlatformValidator),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "reply_comments");
    const comments = await ctx.db.query("social_comments").collect();
    return comments
      .filter((comment) =>
        scope.isPlatformContext ? comment.isPlatformComment : comment.tenantId === scope.tenantId
      )
      .filter((comment) => (args.postId ? comment.postId === args.postId : true))
      .filter((comment) => (args.platform ? comment.platform === args.platform : true))
      .filter((comment) => (args.status ? comment.status === args.status : true))
      .sort((a, b) => b.pulledAt - a.pulledAt);
  },
});

export const findCommentForVariant = internalQuery({
  args: {
    postId: v.id("social_posts"),
    platform: socialPlatformValidator,
    platformPostId: v.string(),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("social_comments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .collect();
    return comments.find(
      (comment) =>
        comment.platform === args.platform && comment.platformPostId === args.platformPostId
    );
  },
});

export const insertCommentInternal = internalMutation({
  args: { payload: v.any() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("social_comments", args.payload);
  },
});

export const patchCommentInternal = internalMutation({
  args: { commentId: v.id("social_comments"), patch: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.commentId, args.patch);
    return args.commentId;
  },
});

export const getRawComment = internalQuery({
  args: { commentId: v.id("social_comments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.commentId);
  },
});
