"use node";

import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";

/** Authenticated entry point used by the GitHub release workflow. */
export const publishReleaseManifest: any = action({
  args: {
    releaseSecret: v.string(),
    releaseKey: v.string(),
    version: v.string(),
    date: v.number(),
    entries: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        type: v.union(
          v.literal("feature"),
          v.literal("fix"),
          v.literal("improvement"),
          v.literal("breaking")
        ),
        panels: v.array(v.string()),
        tags: v.optional(v.array(v.string())),
        module: v.optional(v.string()),
        workspaceIds: v.optional(v.array(v.string())),
        links: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
      })
    ),
  },
  handler: async (ctx, args): Promise<any> => {
    const configuredSecret = process.env.WHATS_NEW_RELEASE_SECRET;
    if (!configuredSecret || args.releaseSecret !== configuredSecret)
      throw new Error("UNAUTHORIZED: Release publisher credentials are invalid");
    return await ctx.runMutation(
      (internal as any).platform.changelog.mutations.insertReleaseManifestInternal,
      {
        releaseKey: args.releaseKey,
        version: args.version,
        date: args.date,
        entries: args.entries,
      }
    );
  },
});

/** Authenticated history sync used by the repository's GitHub Actions workflow. */
export const syncGitHubHistory: any = action({
  args: {
    releaseSecret: v.string(),
    records: v.array(
      v.object({
        externalId: v.string(),
        kind: v.union(v.literal("pull_request"), v.literal("commit")),
        title: v.string(),
        description: v.string(),
        url: v.string(),
        author: v.optional(v.string()),
        pullRequestNumber: v.optional(v.number()),
        commitSha: v.optional(v.string()),
        displayTitle: v.optional(v.string()),
        displayDescription: v.optional(v.string()),
        type: v.optional(
          v.union(
            v.literal("feature"),
            v.literal("fix"),
            v.literal("improvement"),
            v.literal("breaking")
          )
        ),
        panels: v.optional(v.array(v.string())),
        tags: v.optional(v.array(v.string())),
        mergedAt: v.number(),
        isHistorical: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args): Promise<any> => {
    const configuredSecret = process.env.WHATS_NEW_RELEASE_SECRET;
    if (!configuredSecret || args.releaseSecret !== configuredSecret)
      throw new Error("UNAUTHORIZED: GitHub history credentials are invalid");
    return await ctx.runMutation(
      (internal as any).platform.changelog.mutations.upsertGitHubHistoryInternal,
      { records: args.records }
    );
  },
});

/** Rebuilds audience totals after a full repository-history sync. */
export const rebuildGitHubHistoryStats: any = action({
  args: {
    releaseSecret: v.string(),
    counts: v.array(v.object({ key: v.string(), count: v.number() })),
  },
  handler: async (ctx, args): Promise<any> => {
    const configuredSecret = process.env.WHATS_NEW_RELEASE_SECRET;
    if (!configuredSecret || args.releaseSecret !== configuredSecret)
      throw new Error("UNAUTHORIZED: GitHub history credentials are invalid");
    return await ctx.runMutation(
      (internal as any).platform.changelog.mutations.replaceGitHubHistoryStatsInternal,
      { counts: args.counts }
    );
  },
});
