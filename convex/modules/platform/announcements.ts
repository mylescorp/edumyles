import { mutation, query } from "../../_generated/server";
import { ConvexError, v } from "convex/values";
import { requireRole } from "../../helpers/authorize";
import { logAction } from "../../helpers/auditLog";
import { requireTenantContext } from "../../helpers/tenantGuard";

function normalizeAnnouncement(record: any) {
  return {
    ...record,
    targetRoles: record.targetRoles ?? [record.audience],
  };
}

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    targetRoles: v.array(v.string()),
    priority: v.optional(v.string()),
    publishNow: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");

    const now = Date.now();
    const targetRoles = args.targetRoles.length > 0 ? args.targetRoles : ["all"];
    const audience = targetRoles.length === 1 ? (targetRoles[0] ?? "all") : "multi";

    const announcementId = await ctx.db.insert("announcements", {
      tenantId: tenant.tenantId,
      title: args.title,
      body: args.body,
      audience,
      targetRoles,
      priority: args.priority ?? "normal",
      status: args.publishNow ? "published" : "draft",
      publishedAt: args.publishNow ? now : undefined,
      archivedAt: undefined,
      createdBy: tenant.userId,
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.announcement_created",
      entityType: "announcement",
      entityId: String(announcementId),
      after: { title: args.title, targetRoles, status: args.publishNow ? "published" : "draft" },
    });

    return { success: true, announcementId };
  },
});

export const getAnnouncements = query({
  args: {
    role: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const role = args.role ?? tenant.role;
    const limit = args.limit ?? 50;

    const records = await ctx.db
      .query("announcements")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("status", args.status ?? "published")
      )
      .collect();

    return records
      .filter((announcement) => {
        const targetRoles = announcement.targetRoles ?? [announcement.audience];
        return targetRoles.includes("all") || targetRoles.includes(role);
      })
      .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt))
      .slice(0, limit)
      .map(normalizeAnnouncement);
  },
});

export const getParentAnnouncements = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    const records = await ctx.db
      .query("announcements")
      .withIndex("by_tenant_status", (q) => q.eq("tenantId", tenant.tenantId).eq("status", "published"))
      .collect();

    return records
      .filter((announcement) => {
        const targetRoles = announcement.targetRoles ?? [announcement.audience];
        return ["all", "parent", "parents", "guardian", "guardians"].some((role) =>
          targetRoles.includes(role)
        );
      })
      .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt))
      .slice(0, args.limit ?? 20)
      .map(normalizeAnnouncement);
  },
});

export const archiveAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requireRole(tenant, "school_admin");

    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement || announcement.tenantId !== tenant.tenantId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Announcement not found" });
    }

    const now = Date.now();
    await ctx.db.patch(args.announcementId, {
      status: "archived",
      archivedAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.announcement_deleted",
      entityType: "announcement",
      entityId: String(args.announcementId),
      after: { status: "archived", archivedAt: now },
    });

    return { success: true };
  },
});
