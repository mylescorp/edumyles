import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";

// List platform-wide audit logs with filtering
export const listAuditLogs = query({
    args: {
        action: v.optional(v.string()),
        tenantId: v.optional(v.string()),
        userId: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tenantCtx = await requireTenantContext(ctx);
        requireRole(tenantCtx, "master_admin", "super_admin");

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
                    userEmail: user?.email ?? log.actorEmail,
                };
            })
        );

        return enriched;
    },
});

// Get distinct action types for filter dropdown
export const getAuditActionTypes = query({
    args: {},
    handler: async (ctx) => {
        const tenantCtx = await requireTenantContext(ctx);
        requireRole(tenantCtx, "master_admin", "super_admin");

        const logs = await ctx.db.query("auditLogs").take(500);
        const actions = [...new Set(logs.map((l) => l.action))];
        return actions.sort();
    },
});
