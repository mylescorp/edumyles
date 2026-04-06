import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

// List all impersonation sessions (active and completed)
export const listImpersonationSessions = query({
    args: {
        sessionToken: v.optional(v.string()),
        activeOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        try {
            if (!args.sessionToken) {
                return [];
            }

            const actor = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });

            // master_admin sees all sessions; other platform admins see only their own
            let sessions;
            if (actor.role === "master_admin") {
                sessions = await ctx.db.query("impersonationSessions").order("desc").collect();
            } else {
                sessions = await ctx.db
                    .query("impersonationSessions")
                    .withIndex("by_admin", (q) => q.eq("adminId", actor.userId))
                    .order("desc")
                    .collect();
            }

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
        } catch {
            return [];
        }
    },
});

export const searchImpersonationCandidates = query({
    args: {
        sessionToken: v.string(),
        search: v.optional(v.string()),
        tenantId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const actor = await requirePlatformSession(ctx, args);
        if (actor.role !== "master_admin" && actor.role !== "super_admin") {
            throw new Error("FORBIDDEN: Impersonation is restricted to master_admin and super_admin");
        }

        const normalizedSearch = args.search?.trim().toLowerCase() ?? "";

        const [tenants, users] = await Promise.all([
            ctx.db.query("tenants").collect(),
            ctx.db.query("users").collect(),
        ]);

        const tenantMap = new Map(tenants.map((tenant) => [tenant.tenantId, tenant]));

        if (args.tenantId) {
            const tenant = tenantMap.get(args.tenantId);
            if (!tenant) {
                return { tenants: [], users: [] };
            }

            const tenantUsers = users
                .filter((user) => user.tenantId === args.tenantId)
                .filter((user) => user.role !== "master_admin" && user.role !== "super_admin")
                .filter((user) => {
                    if (!normalizedSearch) return true;
                    const haystack = [
                        user.email,
                        user.firstName ?? "",
                        user.lastName ?? "",
                        user.role,
                    ]
                        .join(" ")
                        .toLowerCase();
                    return haystack.includes(normalizedSearch);
                })
                .sort((left, right) => {
                    const leftRecommended = left.role === "school_admin" ? 1 : 0;
                    const rightRecommended = right.role === "school_admin" ? 1 : 0;
                    if (leftRecommended !== rightRecommended) {
                        return rightRecommended - leftRecommended;
                    }
                    return `${left.firstName ?? ""} ${left.lastName ?? ""}`.localeCompare(
                        `${right.firstName ?? ""} ${right.lastName ?? ""}`
                    );
                })
                .slice(0, 25)
                .map((user) => ({
                    id: user.eduMylesUserId,
                    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    recommended: user.role === "school_admin",
                    tenantId: user.tenantId,
                    tenantName: tenant.name,
                }));

            return {
                tenants: [
                    {
                        tenantId: tenant.tenantId,
                        name: tenant.name,
                        plan: tenant.plan,
                        status: tenant.status,
                        email: tenant.email,
                        studentCount: 0,
                    },
                ],
                users: tenantUsers,
            };
        }

        const studentCounts = await ctx.db.query("tenant_usage_stats").collect();
        const latestUsageByTenant = new Map<string, any>();
        for (const usage of studentCounts) {
            const existing = latestUsageByTenant.get(usage.tenantId);
            if (!existing || usage.recordedAt > existing.recordedAt) {
                latestUsageByTenant.set(usage.tenantId, usage);
            }
        }

        const matchingTenantIds = new Set<string>();

        for (const tenant of tenants) {
            const haystack = [tenant.name, tenant.email, tenant.subdomain, tenant.tenantId, tenant.country, tenant.county]
                .join(" ")
                .toLowerCase();
            if (!normalizedSearch || haystack.includes(normalizedSearch)) {
                matchingTenantIds.add(tenant.tenantId);
            }
        }

        for (const user of users) {
            const haystack = [user.email, user.firstName ?? "", user.lastName ?? ""].join(" ").toLowerCase();
            if (!normalizedSearch || haystack.includes(normalizedSearch)) {
                matchingTenantIds.add(user.tenantId);
            }
        }

        const tenantResults = Array.from(matchingTenantIds)
            .map((tenantId) => tenantMap.get(tenantId))
            .filter(Boolean)
            .slice(0, 12)
            .map((tenant) => ({
                tenantId: tenant!.tenantId,
                name: tenant!.name,
                plan: tenant!.plan,
                status: tenant!.status,
                email: tenant!.email,
                studentCount: latestUsageByTenant.get(tenant!.tenantId)?.studentCount ?? 0,
            }))
            .sort((left, right) => left.name.localeCompare(right.name));

        return {
            tenants: tenantResults,
            users: [],
        };
    },
});
