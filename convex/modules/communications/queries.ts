import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

export const listAnnouncements = query({
    args: {
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
        sessionToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "communications");
            requirePermission(tenant, "communications:read");

            const limit = args.limit ?? 50;
            if (args.status) {
                const all = await ctx.db
                    .query("announcements")
                    .withIndex("by_tenant_status", (q) =>
                        q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
                    )
                    .collect();
                return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
            }

            const all = await ctx.db
                .query("announcements")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();
            return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
        } catch (error) {
            console.error("listAnnouncements failed", error);
            return [];
        }
    },
});

export const getAnnouncement = query({
    args: { announcementId: v.id("announcements"), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "communications");
            requirePermission(tenant, "communications:read");

            const ann = await ctx.db.get(args.announcementId);
            if (!ann || ann.tenantId !== tenant.tenantId) return null;
            return ann;
        } catch (error) {
            console.error("getAnnouncement failed", error);
            return null;
        }
    },
});

/** Notifications for the current user (tenant-scoped). */
export const listMyNotifications = query({
    args: { limit: v.optional(v.number()), sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "communications");
            requirePermission(tenant, "communications:read");

            const limit = args.limit ?? 20;
            return await ctx.db
                .query("notifications")
                .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
                .order("desc")
                .take(limit);
        } catch (error) {
            console.error("listMyNotifications failed", error);
            return [];
        }
    },
});

/** Get communications dashboard statistics. */
export const getCommunicationsStats = query({
    args: { sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "communications");
            requirePermission(tenant, "communications:read");

            const [announcements, notifications, campaigns, messageRecords] = await Promise.all([
                ctx.db
                    .query("announcements")
                    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                    .collect(),
                ctx.db
                    .query("notifications")
                    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                    .collect(),
                ctx.db
                    .query("campaigns")
                    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                    .collect(),
                ctx.db
                    .query("messageRecords")
                    .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                    .collect(),
            ]);

            const totalMessages = announcements.length + messageRecords.length;
            const activeCampaigns = campaigns.filter(c => c.status === "running").length;

            // Calculate delivery rate from message records
            const sentRecords = messageRecords.filter(r => r.status !== "queued");
            const deliveredRecords = messageRecords.filter(r =>
                ["delivered", "opened", "clicked"].includes(r.status)
            );
            const deliveryRate = sentRecords.length > 0
                ? Math.round((deliveredRecords.length / sentRecords.length) * 100)
                : 0;

            // Calculate open rate from notifications
            const readNotifications = notifications.filter(n => n.isRead).length;
            const openRate = notifications.length > 0
                ? Math.round((readNotifications / notifications.length) * 100)
                : 0;

            return {
                totalMessages,
                activeCampaigns,
                deliveryRate,
                openRate,
                totalCampaigns: campaigns.length,
                totalNotifications: notifications.length,
                unreadNotifications: notifications.filter(n => !n.isRead).length,
            };
        } catch (error) {
            console.error("getCommunicationsStats failed", error);
            return {
                totalMessages: 0,
                activeCampaigns: 0,
                deliveryRate: 0,
                openRate: 0,
                totalCampaigns: 0,
                totalNotifications: 0,
                unreadNotifications: 0,
            };
        }
    },
});

/** List tenant-scoped campaigns */
export const listCampaigns = query({
    args: {
        sessionToken: v.optional(v.string()),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "communications");
            requirePermission(tenant, "communications:read");

            const limit = args.limit ?? 50;
            const results = await ctx.db
                .query("campaigns")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();

            let filtered = results;
            if (args.status) {
                filtered = results.filter(c => c.status === args.status);
            }

            return filtered.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
        } catch (error) {
            console.error("listCampaigns failed", error);
            return [];
        }
    },
});

/** List tenant-scoped message templates + global templates available to this tenant */
export const listTemplates = query({
    args: {
        sessionToken: v.optional(v.string()),
        category: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "communications");
            requirePermission(tenant, "communications:read");

            const limit = args.limit ?? 50;

            // Get tenant-specific templates
            const tenantTemplates = await ctx.db
                .query("messageTemplates")
                .withIndex("by_tenant_status", (q) =>
                    q.eq("tenantId", tenant.tenantId).eq("status", "active")
                )
                .collect();

            // Get global templates
            const globalTemplates = await ctx.db
                .query("messageTemplates")
                .withIndex("by_global", (q) => q.eq("isGlobal", true).eq("status", "active"))
                .collect();

            let results = [...tenantTemplates, ...globalTemplates];

            if (args.category) {
                results = results.filter(t => t.category === args.category);
            }

            return results.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
        } catch (error) {
            console.error("listTemplates failed", error);
            return [];
        }
    },
});

/** List conversations for the current user */
export const listMyConversations = query({
    args: {
        sessionToken: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "communications");
            requirePermission(tenant, "communications:read");

            const limit = args.limit ?? 50;
            const conversations = await ctx.db
                .query("conversations")
                .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
                .collect();

            // Filter to only conversations the user is a participant in
            const myConversations = conversations.filter(c =>
                c.participants.includes(tenant.userId)
            );

            return myConversations
                .sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt))
                .slice(0, limit);
        } catch (error) {
            console.error("listMyConversations failed", error);
            return [];
        }
    },
});

/** Get messages in a conversation */
export const getConversationMessages = query({
    args: {
        sessionToken: v.optional(v.string()),
        conversationId: v.id("conversations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "communications");
            requirePermission(tenant, "communications:read");

            const conversation = await ctx.db.get(args.conversationId);
            if (!conversation || !conversation.participants.includes(tenant.userId)) {
                return [];
            }

            const limit = args.limit ?? 100;
            return await ctx.db
                .query("directMessages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
                .order("desc")
                .take(limit);
        } catch (error) {
            console.error("getConversationMessages failed", error);
            return [];
        }
    },
});

/** Get notification preferences for the current user */
export const getMyNotificationPreferences = query({
    args: { sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);

            const prefs = await ctx.db
                .query("notificationPreferences")
                .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
                .first();

            if (!prefs) {
                // Return defaults
                return {
                    emailEnabled: true,
                    smsEnabled: true,
                    pushEnabled: true,
                    inAppEnabled: true,
                    categories: {
                        announcements: true,
                        academic: true,
                        finance: true,
                        system: true,
                        marketing: true,
                    },
                };
            }
            return prefs;
        } catch (error) {
            console.error("getMyNotificationPreferences failed", error);
            return null;
        }
    },
});

/** Get message delivery records for a campaign */
export const getCampaignRecords = query({
    args: {
        sessionToken: v.optional(v.string()),
        campaignId: v.id("campaigns"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        try {
            const tenant = args.sessionToken
                ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
                : await requireTenantContext(ctx);
            await requireModule(ctx, tenant.tenantId, "communications");
            requirePermission(tenant, "communications:read");

            const limit = args.limit ?? 100;
            return await ctx.db
                .query("messageRecords")
                .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
                .take(limit);
        } catch (error) {
            console.error("getCampaignRecords failed", error);
            return [];
        }
    },
});
