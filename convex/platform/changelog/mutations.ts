import { internalMutation, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";
import { getFeedContext, visibleEntries } from "./access";

const ALLOWED_PANELS = [
  "admin",
  "teacher",
  "student",
  "parent",
  "alumni",
  "partner",
  "developer",
  "affiliate",
  "reseller",
  "platform",
];

function validateAudience(panels: string[], links?: Array<{ label: string; url: string }>) {
  if (!panels.length || panels.some((panel) => !ALLOWED_PANELS.includes(panel))) {
    throw new Error("Choose one or more valid product panels");
  }
  for (const link of links ?? []) {
    if (
      !link.label.trim() ||
      ((!link.url.startsWith("/") || link.url.startsWith("//")) && !link.url.startsWith("https://"))
    ) {
      throw new Error("Links must be labelled HTTPS URLs or relative application paths");
    }
  }
}

export const createChangelogEntry = mutation({
  args: {
    sessionToken: v.string(),
    version: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("feature"),
      v.literal("fix"),
      v.literal("improvement"),
      v.literal("breaking")
    ),
    tags: v.optional(v.array(v.string())),
    panel: v.optional(v.string()),
    panels: v.optional(v.array(v.string())),
    module: v.optional(v.string()),
    workspaceIds: v.optional(v.array(v.string())),
    links: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    status: v.optional(v.union(v.literal("draft"), v.literal("scheduled"), v.literal("published"))),
    scheduledAt: v.optional(v.number()),
    releaseKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);
    validateAudience(args.panels ?? [args.panel ?? "admin"], args.links);
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(args.version))
      throw new Error("Version must use semantic versioning (for example 1.2.3)");
    if (args.status === "scheduled" && (!args.scheduledAt || args.scheduledAt <= Date.now()))
      throw new Error("Scheduled entries need a future publication time");
    if (args.releaseKey) {
      const releaseEntries = await ctx.db
        .query("changelogEntries")
        .withIndex("by_releaseKey", (q) => q.eq("releaseKey", args.releaseKey))
        .collect();
      if (
        releaseEntries.some(
          (entry) => entry.title.toLowerCase() === args.title.trim().toLowerCase()
        )
      ) {
        throw new Error("This release already contains an entry with that title");
      }
    }

    const entryId = await ctx.db.insert("changelogEntries", {
      version: args.version,
      title: args.title,
      description: args.description,
      type: args.type,
      tags: args.tags || [],
      panel: args.panels?.[0] ?? args.panel ?? "admin",
      panels: args.panels ?? [args.panel ?? "admin"],
      module: args.module,
      workspaceIds: args.workspaceIds,
      links: args.links,
      status: args.status ?? "published",
      scheduledAt: args.scheduledAt,
      releaseKey: args.releaseKey,
      author: platform.userId,
      date: args.status === "scheduled" ? args.scheduledAt! : Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("whatsNewAudit", {
      entryId,
      releaseKey: args.releaseKey,
      actorId: platform.userId,
      action:
        args.status === "draft"
          ? "draft_created"
          : args.status === "scheduled"
            ? "scheduled"
            : "published",
      details: {
        panels: args.panels ?? [args.panel ?? "admin"],
        version: args.version,
        title: args.title,
      },
      createdAt: Date.now(),
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

export const insertReleaseManifestInternal = internalMutation({
  args: {
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
  handler: async (ctx, args) => {
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(args.version))
      throw new Error("Release version must use semantic versioning");
    if (!args.releaseKey || !Number.isFinite(args.date) || !args.entries.length)
      throw new Error("Release manifest is missing required release details");
    for (const entry of args.entries) validateAudience(entry.panels, entry.links);
    const existing = await ctx.db
      .query("changelogEntries")
      .withIndex("by_releaseKey", (q) => q.eq("releaseKey", args.releaseKey))
      .first();
    if (existing) return { success: true, duplicate: true, releaseKey: args.releaseKey };
    const now = Date.now();
    for (const entry of args.entries) {
      await ctx.db.insert("changelogEntries", {
        releaseKey: args.releaseKey,
        version: args.version,
        title: entry.title,
        description: entry.description,
        type: entry.type,
        date: args.date,
        author: "release-workflow",
        tags: entry.tags ?? [],
        panels: entry.panels,
        panel: entry.panels[0] ?? "admin",
        module: entry.module,
        workspaceIds: entry.workspaceIds,
        links: entry.links,
        status: "published",
        createdAt: now,
        updatedAt: now,
      });
    }
    await ctx.db.insert("whatsNewAudit", {
      releaseKey: args.releaseKey,
      actorId: "release-workflow",
      action: "release_published",
      details: { version: args.version, entries: args.entries.length },
      createdAt: now,
    });
    return {
      success: true,
      duplicate: false,
      releaseKey: args.releaseKey,
      entries: args.entries.length,
    };
  },
});

export const upsertGitHubHistoryInternal = internalMutation({
  args: {
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
        mergedAt: v.number(),
        isHistorical: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;
    let updated = 0;
    for (const record of args.records) {
      if (
        !record.externalId ||
        !record.title.trim() ||
        !record.url.startsWith("https://github.com/") ||
        !Number.isFinite(record.mergedAt)
      ) {
        throw new Error("GitHub history record is invalid");
      }
      const existing = await ctx.db
        .query("whatsNewGitHubHistory")
        .withIndex("by_externalId", (q) => q.eq("externalId", record.externalId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...record,
          isHistorical: existing.isHistorical && record.isHistorical,
        });
        updated += 1;
      } else {
        await ctx.db.insert("whatsNewGitHubHistory", { ...record, createdAt: now });
        inserted += 1;
      }
    }
    return { inserted, updated };
  },
});

export const updateChangelogEntry = mutation({
  args: {
    sessionToken: v.string(),
    entryId: v.id("changelogEntries"),
    version: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("feature"),
        v.literal("fix"),
        v.literal("improvement"),
        v.literal("breaking")
      )
    ),
    tags: v.optional(v.array(v.string())),
    panel: v.optional(v.string()),
    panels: v.optional(v.array(v.string())),
    module: v.optional(v.union(v.string(), v.null())),
    workspaceIds: v.optional(v.array(v.string())),
    links: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    status: v.optional(v.union(v.literal("draft"), v.literal("scheduled"), v.literal("published"))),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const platform = await requirePlatformSession(ctx, args);

    const existing = await ctx.db.get(args.entryId);
    if (!existing) throw new Error("Changelog entry not found");
    if (args.version && !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(args.version))
      throw new Error("Version must use semantic versioning (for example 1.2.3)");
    validateAudience(
      args.panels ?? (args.panel ? [args.panel] : (existing.panels ?? [existing.panel ?? "admin"])),
      args.links
    );
    if (args.status === "scheduled" && (!args.scheduledAt || args.scheduledAt <= Date.now()))
      throw new Error("Scheduled entries need a future publication time");

    const updates: any = { updatedAt: Date.now() };
    if (args.version) updates.version = args.version;
    if (args.title) updates.title = args.title;
    if (args.description) updates.description = args.description;
    if (args.type) updates.type = args.type;
    if (args.tags) updates.tags = args.tags;
    if (args.panel || args.panels) updates.panel = args.panels?.[0] ?? args.panel;
    if (args.panels) updates.panels = args.panels;
    if (args.module !== undefined) updates.module = args.module ?? undefined;
    if (args.workspaceIds) updates.workspaceIds = args.workspaceIds;
    if (args.links) updates.links = args.links;
    if (args.status) updates.status = args.status;
    if (args.scheduledAt !== undefined) updates.scheduledAt = args.scheduledAt;
    if (args.status === "published") updates.date = Date.now();

    await ctx.db.patch(args.entryId, updates);
    await ctx.db.insert("whatsNewAudit", {
      entryId: args.entryId,
      releaseKey: existing.releaseKey,
      actorId: platform.userId,
      action:
        args.status === "published"
          ? "published"
          : args.status === "scheduled"
            ? "scheduled"
            : "updated",
      details: {
        before: {
          version: existing.version,
          title: existing.title,
          description: existing.description,
          type: existing.type,
          panels: existing.panels ?? [existing.panel ?? "admin"],
          status: existing.status,
        },
        after: {
          version: updates.version ?? existing.version,
          title: updates.title ?? existing.title,
          description: updates.description ?? existing.description,
          type: updates.type ?? existing.type,
          panels: updates.panels ?? existing.panels ?? [existing.panel ?? "admin"],
          status: updates.status ?? existing.status,
        },
      },
      createdAt: Date.now(),
    });

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
        version: updates.version ?? existing.version,
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
    await ctx.db.insert("whatsNewAudit", {
      entryId: args.entryId,
      releaseKey: existing.releaseKey,
      actorId: platform.userId,
      action: "deleted",
      details: { version: existing.version, title: existing.title },
      createdAt: Date.now(),
    });

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

export const markAllRead = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const context = await getFeedContext(ctx, args.sessionToken);
    const [entries, reads] = await Promise.all([
      visibleEntries(ctx, context),
      ctx.db
        .query("whatsNewReads")
        .withIndex("by_user_workspace", (q) =>
          q.eq("userId", context.userId).eq("workspaceId", context.workspaceId)
        )
        .collect(),
    ]);
    const readIds = new Set(reads.map((read) => String(read.entryId)));
    let marked = 0;
    for (const entry of entries) {
      if (readIds.has(String(entry._id))) continue;
      await ctx.db.insert("whatsNewReads", {
        userId: context.userId,
        workspaceId: context.workspaceId,
        entryId: entry._id,
        readAt: Date.now(),
      });
      marked += 1;
    }
    return { success: true, marked };
  },
});

export const processScheduledEntries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.db
      .query("changelogEntries")
      .withIndex("by_status_scheduledAt", (q) =>
        q.eq("status", "scheduled").lte("scheduledAt", now)
      )
      .collect();
    for (const entry of due) {
      await ctx.db.patch(entry._id, { status: "published", updatedAt: now });
      await ctx.db.insert("whatsNewAudit", {
        entryId: entry._id,
        releaseKey: entry.releaseKey,
        actorId: "schedule-worker",
        action: "published",
        details: { scheduledAt: entry.scheduledAt },
        createdAt: now,
      });
    }
    return { published: due.length };
  },
});
