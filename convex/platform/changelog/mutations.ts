import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

export const createChangelogEntry = mutation({
  args: {
    sessionToken: v.string(),
    version: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("feature"), v.literal("fix"), v.literal("improvement"), v.literal("breaking")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);

    const entryId = await ctx.db.insert("changelogEntries", {
      version: args.version,
      title: args.title,
      description: args.description,
      type: args.type,
      tags: args.tags || [],
      author: platform.userId,
      date: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: platform.tenantId,
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "changelog.created",
      entityType: "changelog_entry",
      entityId: entryId,
      after: {
        version: args.version,
        title: args.title,
        type: args.type,
      },
    });

    return entryId;
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
    const platform = await requirePlatformSession(ctx, args);

    const existing = await ctx.db.get(args.entryId);
    if (!existing) throw new Error("Changelog entry not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.title) updates.title = args.title;
    if (args.description) updates.description = args.description;
    if (args.type) updates.type = args.type;
    if (args.tags) updates.tags = args.tags;

    await ctx.db.patch(args.entryId, updates);

    await logAction(ctx, {
      tenantId: platform.tenantId,
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "changelog.updated",
      entityType: "changelog_entry",
      entityId: args.entryId,
      before: {
        title: existing.title,
        description: existing.description,
        type: existing.type,
        tags: existing.tags,
      },
      after: {
        title: updates.title ?? existing.title,
        description: updates.description ?? existing.description,
        type: updates.type ?? existing.type,
        tags: updates.tags ?? existing.tags,
      },
    });

    return { success: true };
  },
});

export const deleteChangelogEntry = mutation({
  args: {
    sessionToken: v.string(),
    entryId: v.id("changelogEntries"),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);

    const existing = await ctx.db.get(args.entryId);
    if (!existing) throw new Error("Changelog entry not found");

    await ctx.db.delete(args.entryId);

    await logAction(ctx, {
      tenantId: platform.tenantId,
      actorId: platform.userId,
      actorEmail: platform.email,
      action: "changelog.deleted",
      entityType: "changelog_entry",
      entityId: args.entryId,
      before: {
        version: existing.version,
        title: existing.title,
        type: existing.type,
      },
    });

    return { success: true };
  },
});
