import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const createAnnouncement = mutation({
    args: {
        title: v.string(),
        body: v.string(),
        audience: v.string(),
        priority: v.string(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "communications");
        requirePermission(tenant, "communications:write");

        const now = Date.now();
        const id = await ctx.db.insert("announcements", {
            tenantId: tenant.tenantId,
            title: args.title,
            body: args.body,
            audience: args.audience,
            priority: args.priority ?? "normal",
            status: args.status ?? "draft",
            createdBy: tenant.userId,
            createdAt: now,
            updatedAt: now,
        });
        return id;
    },
});

export const updateAnnouncement = mutation({
    args: {
        announcementId: v.id("announcements"),
        title: v.optional(v.string()),
        body: v.optional(v.string()),
        audience: v.optional(v.string()),
        priority: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "communications");
        requirePermission(tenant, "communications:write");

        const ann = await ctx.db.get(args.announcementId);
        if (!ann || ann.tenantId !== tenant.tenantId) throw new Error("Announcement not found");

        const { announcementId, ...updates } = args;
        await ctx.db.patch(announcementId, { ...updates, updatedAt: Date.now() });
        if (args.status === "published" && ann.status !== "published") {
            await ctx.db.patch(announcementId, { publishedAt: Date.now() });
        }
        return announcementId;
    },
});

export const publishAnnouncement = mutation({
    args: { announcementId: v.id("announcements") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "communications");
        requirePermission(tenant, "communications:write");

        const ann = await ctx.db.get(args.announcementId);
        if (!ann || ann.tenantId !== tenant.tenantId) throw new Error("Announcement not found");

        const now = Date.now();
        await ctx.db.patch(args.announcementId, {
            status: "published",
            publishedAt: now,
            updatedAt: now,
        });
        return args.announcementId;
    },
});

export const deleteAnnouncement = mutation({
    args: { announcementId: v.id("announcements") },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "communications");
        requirePermission(tenant, "communications:write");

        const ann = await ctx.db.get(args.announcementId);
        if (!ann || ann.tenantId !== tenant.tenantId) throw new Error("Announcement not found");

        await ctx.db.delete(args.announcementId);
        return { success: true };
    },
});

/** Create a notification (tenant-scoped). Used by broadcast/template flows. */
export const createNotification = mutation({
    args: {
        userId: v.string(),
        title: v.string(),
        message: v.string(),
        type: v.string(),
        link: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "communications");
        requirePermission(tenant, "communications:write");

        return await ctx.db.insert("notifications", {
            tenantId: tenant.tenantId,
            userId: args.userId,
            title: args.title,
            message: args.message,
            type: args.type,
            isRead: false,
            link: args.link,
            createdAt: Date.now(),
        });
    },
});
