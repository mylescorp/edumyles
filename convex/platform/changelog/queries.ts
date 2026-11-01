import { query } from "../../_generated/server";
import { v } from "convex/values";
import { getFeedContext, visibleEntries, visibleHistoryRecords } from "./access";
import { requirePlatformSession } from "../../helpers/platformGuard";

export const listChangelogs = query({
  args: {
    sessionToken: v.string(),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    const entries = await ctx.db.query("changelogEntries").order("desc").collect();

    const filtered = args.type ? entries.filter((e) => e.type === args.type) : entries;

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
    const [entries, history, reads, historyReads] = await Promise.all([
      visibleEntries(ctx, context),
      visibleHistoryRecords(ctx, context),
      ctx.db
        .query("whatsNewReads")
        .withIndex("by_user_workspace", (q) =>
          q.eq("userId", context.userId).eq("workspaceId", context.workspaceId)
        )
        .collect(),
      ctx.db
        .query("whatsNewHistoryReads")
        .withIndex("by_user_workspace", (q) =>
          q.eq("userId", context.userId).eq("workspaceId", context.workspaceId)
        )
        .collect(),
    ]);
    const readIds = new Set(reads.map((read) => String(read.entryId)));
    const readHistoryIds = new Set(historyReads.map((read) => read.externalId));
    return (
      entries.reduce(
        (count: number, entry: any) => count + (readIds.has(String(entry._id)) ? 0 : 1),
        0
      ) +
      history.reduce(
        (count: number, record: any) => count + (readHistoryIds.has(record.externalId) ? 0 : 1),
        0
      )
    );
  },
});

export const getWhatsNewFeed = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const context = await getFeedContext(ctx, args.sessionToken);
    const [entries, history] = await Promise.all([
      visibleEntries(ctx, context),
      visibleHistoryRecords(ctx, context),
    ]);
    return {
      entries: [
        ...entries.map((entry: any) => ({
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
        ...history.map((record: any) => ({
          _id: record._id,
          groupKey: `history:${record._id}`,
          isRelease: false,
          version: "",
          title: record.displayTitle,
          description: record.displayDescription,
          type: record.type,
          tags: record.tags ?? [],
          date: record.mergedAt,
        })),
      ].sort((a: any, b: any) => b.date - a.date),
      workspaceId: context.workspaceId,
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
