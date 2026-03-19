import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { requireTenantSession } from "../../helpers/tenantGuard";

// List platform-wide audit logs with filtering (platform admins only)
export const listAuditLogs = query({
    args: {
        sessionToken: v.string(),
        action: v.optional(v.string()),
        tenantId: v.optional(v.string()),
        userId: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requirePlatformSession(ctx, args);

        const limit = args.limit ?? 100;

        let logs;

        if (args.tenantId) {
            logs = await ctx.db
                .query("auditLogs")
                .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId!))
                .order("desc")
                .take(limit);
        } else if (args.userId) {
            logs = await ctx.db
                .query("auditLogs")
                .withIndex("by_actor", (q) => q.eq("actorId", args.userId!))
                .order("desc")
                .take(limit);
        } else {
            logs = await ctx.db
                .query("auditLogs")
                .order("desc")
                .take(limit);
        }

        if (args.action) {
            logs = logs.filter((l) => l.action === args.action);
        }

        // Enrich with tenant and user names
        const enriched = await Promise.all(
            logs.map(async (log) => {
                const tenant = await ctx.db
                    .query("tenants")
                    .withIndex("by_tenantId", (q) => q.eq("tenantId", log.tenantId))
                    .first();

                const user = await ctx.db
                    .query("users")
                    .filter((q) => q.eq(q.field("eduMylesUserId"), log.actorId))
                    .first();

                return {
                    ...log,
                    tenantName: tenant?.name ?? log.tenantId,
                    userName: user
                        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
                        : log.actorId,
                    userEmail: user?.email ?? "",
                };
            })
        );

        return enriched;
    },
});

// Get distinct action types for filter dropdown (platform admins only)
export const getAuditActionTypes = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        await requirePlatformSession(ctx, args);

        const logs = await ctx.db.query("auditLogs").take(500);
        const actions = [...new Set(logs.map((l) => l.action))];
        return actions.sort();
    },
});

// List tenant-scoped audit logs (accessible by school admins for their own tenant)
export const listTenantAuditLogs = query({
    args: {
        sessionToken: v.string(),
        action: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
        const limit = args.limit ?? 200;

        let logs = await ctx.db
            .query("auditLogs")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .order("desc")
            .take(limit);

        if (args.action) {
            logs = logs.filter((l) => l.action === args.action);
        }

        // Enrich with user names
        const enriched = await Promise.all(
            logs.map(async (log) => {
                const user = await ctx.db
                    .query("users")
                    .filter((q) => q.eq(q.field("eduMylesUserId"), log.actorId))
                    .first();

                return {
                    ...log,
                    userName: user
                        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
                        : log.actorId,
                    userEmail: user?.email ?? "",
                };
            })
        );

        return enriched;
    },
});

// Get distinct action types for tenant audit filter dropdown
export const getTenantAuditActionTypes = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
        const logs = await ctx.db
            .query("auditLogs")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
            .take(500);
        const actions = [...new Set(logs.map((l) => l.action))];
        return actions.sort();
    },
});
