import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { filterAndSortUsers } from "./utils";

// List all platform admins (master_admin + super_admin)
export const listPlatformAdmins = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        await requirePlatformSession(ctx, args);

        const users = await ctx.db.query("users").collect();
        return users.filter(
            (u) => u.role === "master_admin" || u.role === "super_admin"
        );
    },
});

// Get the current logged-in platform user's full record
export const getCurrentPlatformUser = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        try {
            const session = await requirePlatformSession(ctx, args);
            const byWorkosId = await ctx.db
                .query("users")
                .withIndex("by_workos_user", (q) => q.eq("workosUserId", session.userId))
                .first();

            if (byWorkosId) {
                return byWorkosId;
            }

            const byPlatformEmail = await ctx.db
                .query("users")
                .withIndex("by_tenant_email", (q) =>
                    q.eq("tenantId", session.tenantId).eq("email", session.email || "")
                )
                .first();
            if (byPlatformEmail) {
                return byPlatformEmail;
            }

            const allUsers = await ctx.db.query("users").collect();
            return allUsers.find((user) => user.email === session.email) || null;
        } catch (error) {
            console.error("Error in getCurrentPlatformUser:", error);
            // Return null instead of throwing to prevent app crashes
            return null;
        }
    },
});

// Get a single user by Convex document ID
export const getUserById = query({
    args: {
        sessionToken: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        await requirePlatformSession(ctx, args);
        return await ctx.db.get(args.userId);
    },
});

// Cross-tenant user search (master_admin only)
export const listAllUsers = query({
    args: {
        sessionToken: v.string(),
        search: v.optional(v.string()),
        role: v.optional(v.string()),
        tenantId: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requirePlatformSession(ctx, args);

        const users = await ctx.db.query("users").collect();
        return filterAndSortUsers(users, args);
    },
});

export const listTenantFilterOptions = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        await requirePlatformSession(ctx, args);

        const tenants = await ctx.db.query("tenants").collect();

        return [...tenants]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((tenant) => ({
                tenantId: tenant.tenantId,
                name: tenant.name,
                status: tenant.status,
                subdomain: tenant.subdomain,
            }));
    },
});
