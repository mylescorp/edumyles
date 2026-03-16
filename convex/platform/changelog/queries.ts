import { query } from "../../_generated/server";
import { v } from "convex/values";

export const listChangelogs = query({
  args: {
    sessionToken: v.string(),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

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
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const latest = await ctx.db
      .query("changelogEntries")
      .order("desc")
      .first();

    return latest?.version || "0.0.0";
  },
});
