import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const createChangelogEntry = mutation({
  args: {
    sessionToken: v.string(),
    version: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("feature"), v.literal("fix"), v.literal("improvement"), v.literal("breaking"), v.literal("breaking")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    return await ctx.db.insert("changelogEntries", {
      version: args.version,
      title: args.title,
      description: args.description,
      type: args.type,
      tags: args.tags || [],
      author: session.userId,
      date: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const updateChangelogEntry = mutation({
  args: {
    sessionToken: v.string(),
    entryId: v.id("changelogEntries"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("feature"), v.literal("fix"), v.literal("improvement"), v.literal("breaking"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    const updates: any = {};
    if (args.title) updates.title = args.title;
    if (args.description) updates.description = args.description;
    if (args.type) updates.type = args.type;
    if (args.tags) updates.tags = args.tags;

    await ctx.db.patch(args.entryId, updates);
    return { success: true };
  },
});

export const deleteChangelogEntry = mutation({
  args: {
    sessionToken: v.string(),
    entryId: v.id("changelogEntries"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) throw new Error("Invalid session");

    await ctx.db.delete(args.entryId);
    return { success: true };
  },
});
