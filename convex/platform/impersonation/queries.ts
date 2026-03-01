import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";

// List all impersonation sessions (active and completed)
export const listImpersonationSessions = query({
    args: {
        activeOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const tenantCtx = await requireTenantContext(ctx);
        requireRole(tenantCtx, "master_admin", "super_admin");

        let sessions = await ctx.db.query("impersonationSessions").order("desc").collect();

        if (args.activeOnly) {
            sessions = sessions.filter((s) => s.active);
        }

        // Enrich with user and tenant info
        const enriched = await Promise.all(
            sessions.map(async (session) => {
                const adminUser = await ctx.db
                    .query("users")
                    .filter((q) => q.eq(q.field("eduMylesUserId"), session.adminId))
                    .first();

                const targetUser = await ctx.db
                    .query("users")
                    .filter((q) => q.eq(q.field("eduMylesUserId"), session.targetUserId))
                    .first();

                const tenant = await ctx.db
                    .query("tenants")
                    .withIndex("by_tenantId", (q) =>
                        q.eq("tenantId", session.targetTenantId)
                    )
                    .first();

                return {
                    ...session,
                    adminName: adminUser
                        ? `${adminUser.firstName ?? ""} ${adminUser.lastName ?? ""}`.trim() || adminUser.email
                        : session.adminId,
                    adminEmail: adminUser?.email ?? "",
                    targetUserName: targetUser
                        ? `${targetUser.firstName ?? ""} ${targetUser.lastName ?? ""}`.trim() || targetUser.email
                        : session.targetUserId,
                    targetUserEmail: targetUser?.email ?? "",
                    tenantName: tenant?.name ?? session.targetTenantId,
                };
            })
        );

        return enriched;
    },
});
