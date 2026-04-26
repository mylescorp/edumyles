import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";

export const processScheduledPosts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("social_posts")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();

    const duePosts = posts.filter((post) => (post.scheduledAt ?? 0) <= Date.now());
    for (const post of duePosts) {
      await ctx.db.patch(post._id, {
        status: "publishing",
        updatedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, (internal as any).actions.social.publish.publishPost, {
        postId: post._id,
      });
    }

    return { processed: duePosts.length };
  },
});

export const getRawPost = internalQuery({
  args: { postId: v.id("social_posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

export const getRawAccount = internalQuery({
  args: { accountId: v.id("social_accounts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.accountId);
  },
});

export const patchPostAfterPublish = internalMutation({
  args: {
    postId: v.id("social_posts"),
    platformVariants: v.any(),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("partially_published"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      platformVariants: args.platformVariants,
      status: args.status,
      publishedAt: args.publishedAt,
      updatedAt: Date.now(),
    });
    return args.postId;
  },
});

export const getPostScope = internalQuery({
  args: { postId: v.id("social_posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    return {
      isPlatformContext: Boolean(post?.isPlatformPost),
    };
  },
});
