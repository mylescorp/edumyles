import { paginationOptsValidator } from "convex/server";
import { query } from "../../_generated/server";
import { v } from "convex/values";
import {
  getFeedContext,
  getUnreadCount,
  historyAudienceKey,
  historyVisibleCount,
  isVisibleTo,
  legacyHistoryAudienceKey,
  visibleEntries,
  visibleHistoryPage,
} from "./access";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { historyPanels } from "./visibility";

export const listChangelogs = query({
  args: {
    sessionToken: v.string(),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const entries = await ctx.db
      .query("changelogEntries")
      .order("desc")
      .collect();

    const filtered = args.type
      ? entries.filter((e) => e.type === args.type)
      : entries;

    return filtered.slice(0, args.limit || 50);
  },
});

export const getLatestVersion = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const context = await getFeedContext(ctx, args.sessionToken);
    const latest = (await visibleEntries(ctx, context))[0];

    return latest?.version || "0.0.0";
  },
});

export const getWhatsNewUnreadCount = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const context = await getFeedContext(ctx, args.sessionToken);
    const [releaseUnreadCount, historyRead, totalHistory] = await Promise.all([
      getUnreadCount(ctx, context),
      ctx.db
        .query("whatsNewHistoryReadSnapshots")
        .withIndex("by_user_workspace_audience", (q) =>
          q
            .eq("userId", context.userId)
            .eq("workspaceId", context.workspaceId)
            .eq("audienceKey", historyAudienceKey(context)),
        )
        .unique(),
      historyVisibleCount(ctx, context),
    ]);
    const scopedHistoryRead =
      historyRead ??
      (!context.canSeeAllPanels
        ? await ctx.db
            .query("whatsNewHistoryReadSnapshots")
            .withIndex("by_user_workspace_audience", (q) =>
              q
                .eq("userId", context.userId)
                .eq("workspaceId", context.workspaceId)
                .eq("audienceKey", legacyHistoryAudienceKey(context)),
            )
            .unique()
        : undefined);
    return (
      releaseUnreadCount +
      Math.max(0, totalHistory - (scopedHistoryRead?.readThroughCount ?? 0))
    );
  },
});

export const getWhatsNewFeed = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const context = await getFeedContext(ctx, args.sessionToken);
    const entries = await visibleEntries(ctx, context);
    return {
      entries: entries.map((entry: any) => ({
        _id: entry._id,
        groupKey: `release:${entry.version}`,
        isRelease: true,
        version: entry.version,
        title: entry.title,
        description: entry.description,
        type: entry.type,
        tags: entry.tags,
        module: entry.module,
        links: entry.links,
        date: entry.date,
      })),
      workspaceId: context.workspaceId,
    };
  },
});

export const getWhatsNewHistory = query({
  args: {
    sessionToken: v.string(),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    type: v.optional(
      v.union(v.literal("feature"), v.literal("fix"), v.literal("improvement")),
    ),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const context = await getFeedContext(ctx, args.sessionToken);
    return await visibleHistoryPage(ctx, context, args.paginationOpts, args);
  },
});

export const getWhatsNewHistoryEntry = query({
  args: {
    sessionToken: v.string(),
    entryId: v.string(),
  },
  handler: async (ctx, args) => {
    const context = await getFeedContext(ctx, args.sessionToken);
    const normalizedId = ctx.db.normalizeId(
      "whatsNewGitHubHistory",
      args.entryId,
    );
    if (!normalizedId) return null;
    const record = await ctx.db.get(normalizedId);
    if (
      !record ||
      record.kind !== "pull_request" ||
      !record.displayTitle ||
      !record.displayDescription ||
      !record.type ||
      !isVisibleTo({ panels: historyPanels(record.panels) }, context)
    ) {
      return null;
    }
    return {
      _id: record._id,
      groupKey: `history:${record._id}`,
      isRelease: false,
      version: "",
      title: record.displayTitle,
      description: record.displayDescription,
      type: record.type,
      tags: record.tags ?? [],
      date: record.mergedAt,
    };
  },
});

export const getEntryAudit = query({
  args: { sessionToken: v.string(), entryId: v.id("changelogEntries") },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    return await ctx.db
      .query("whatsNewAudit")
      .withIndex("by_entry", (q) => q.eq("entryId", args.entryId))
      .collect();
  },
});
