import { v } from "convex/values";
import { internalAction, internalMutation, query } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { requireSocialContext, socialPlatformValidator, socialScopeArgs } from "./shared";

function buildSyntheticMetrics(seed: number) {
  const impressions = 500 + (seed % 3000);
  const reach = Math.round(impressions * 0.72);
  const engagements = Math.round(reach * 0.16);
  return {
    impressions,
    reach,
    engagements,
    likes: Math.round(engagements * 0.45),
    comments: Math.round(engagements * 0.18),
    shares: Math.round(engagements * 0.12),
    saves: Math.round(engagements * 0.08),
    clicks: Math.round(engagements * 0.17),
    followerGrowth: Math.round(reach * 0.02),
    videoViews: Math.round(impressions * 0.42),
    videoWatchTimeSeconds: Math.round(impressions * 6.4),
    videoCompletionRate: 0.48,
  };
}

async function upsertAnalyticsRecord(ctx: any, payload: any) {
  const existing = payload.postId
    ? await ctx.db
        .query("social_analytics")
        .withIndex("by_postId", (q: any) => q.eq("postId", payload.postId))
        .collect()
        .then((rows: any[]) =>
          rows.find(
            (row) =>
              String(row.accountId) === String(payload.accountId) &&
              row.periodStart === payload.periodStart &&
              row.periodEnd === payload.periodEnd
          )
        )
    : null;

  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return existing._id;
  }

  return await ctx.db.insert("social_analytics", payload);
}

export const pullPostAnalytics = internalAction({
  args: { postId: v.id("social_posts") },
  handler: async (ctx, args) => {
    const post: any = await ctx.runQuery((internal as any).modules.social.publish.getRawPost, {
      postId: args.postId,
    });
    if (!post) {
      return { inserted: 0 };
    }

    let inserted = 0;
    for (const variant of post.platformVariants) {
      if (!variant.publishedPostId) continue;
      const seed = Number(String(variant.publishedPostId).replace(/\D/g, "").slice(-6) || Date.now());
      const metrics = buildSyntheticMetrics(seed);
      const record = {
        tenantId: post.tenantId,
        isPlatformAnalytics: post.isPlatformPost ? true : undefined,
        accountId: variant.accountId,
        platform: variant.platform,
        postId: post._id,
        platformPostId: variant.publishedPostId,
        ...metrics,
        rawMetrics: JSON.stringify({ source: "synthetic", seed }),
        periodStart: post.publishedAt ?? post.createdAt,
        periodEnd: Date.now(),
        pulledAt: Date.now(),
      };
      await ctx.runMutation((internal as any).modules.social.analytics.storeAnalyticsRecord, {
        payload: record,
      });
      inserted += 1;
    }

    return { inserted };
  },
});

export const pullAllPostAnalytics = internalMutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("social_posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    const partiallyPublished = await ctx.db
      .query("social_posts")
      .withIndex("by_status", (q) => q.eq("status", "partially_published"))
      .collect();
    const targets = [...posts, ...partiallyPublished].filter((post) => !post.isDeleted);

    for (const post of targets) {
      await ctx.scheduler.runAfter(0, (internal as any).modules.social.analytics.pullPostAnalytics, {
        postId: post._id,
      });
    }

    return { scheduled: targets.length };
  },
});

export const pullAccountAnalytics = internalAction({
  args: { accountId: v.id("social_accounts") },
  handler: async (ctx, args) => {
    const account = await ctx.runQuery((internal as any).modules.social.publish.getRawAccount, {
      accountId: args.accountId,
    });
    if (!account) {
      return { inserted: 0 };
    }

    const seed = Number(String(account.accountId).replace(/\D/g, "").slice(-6) || Date.now());
    const metrics = buildSyntheticMetrics(seed);
    await ctx.runMutation((internal as any).modules.social.analytics.storeAnalyticsRecord, {
      payload: {
        tenantId: account.tenantId,
        isPlatformAnalytics: account.isPlatformAccount ? true : undefined,
        accountId: account._id,
        platform: account.platform,
        ...metrics,
        rawMetrics: JSON.stringify({ source: "synthetic_account", seed }),
        periodStart: Date.now() - 24 * 60 * 60 * 1000,
        periodEnd: Date.now(),
        pulledAt: Date.now(),
      },
    });
    return { inserted: 1 };
  },
});

export const pullAllAccountAnalytics = internalMutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("social_accounts").collect();
    const activeAccounts = accounts.filter((account) => account.status === "active");
    for (const account of activeAccounts) {
      await ctx.scheduler.runAfter(0, (internal as any).modules.social.analytics.pullAccountAnalytics, {
        accountId: account._id,
      });
    }
    return { scheduled: activeAccounts.length };
  },
});

export const storeAnalyticsRecord = internalMutation({
  args: { payload: v.any() },
  handler: async (ctx, args) => {
    return await upsertAnalyticsRecord(ctx, args.payload);
  },
});

export const getAnalytics = query({
  args: {
    ...socialScopeArgs,
    platform: v.optional(socialPlatformValidator),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const scope = await requireSocialContext(ctx, args, "view_analytics");
    const since = Date.now() - (args.days ?? 30) * 24 * 60 * 60 * 1000;
    const rows = await ctx.db.query("social_analytics").collect();
    const filtered = rows.filter((row) =>
      scope.isPlatformContext ? row.isPlatformAnalytics : row.tenantId === scope.tenantId
    ).filter((row) => row.periodEnd >= since)
      .filter((row) => (args.platform ? row.platform === args.platform : true));

    const summary = filtered.reduce(
      (accumulator, row) => {
        accumulator.impressions += row.impressions ?? 0;
        accumulator.reach += row.reach ?? 0;
        accumulator.engagements += row.engagements ?? 0;
        accumulator.followers += row.followerGrowth ?? 0;
        return accumulator;
      },
      { impressions: 0, reach: 0, engagements: 0, followers: 0 }
    );

    return {
      summary,
      rows: filtered.sort((a, b) => b.periodEnd - a.periodEnd),
    };
  },
});
