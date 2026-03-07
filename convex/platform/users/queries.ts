import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

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

// Cross-tenant user search (master_admin only)
export const listAllUsers = query({
    args: {
        sessionToken: v.string(),
        search: v.optional(v.string()),
        role: v.optional(v.string()),
        tenantId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requirePlatformSession(ctx, args);

        let users = await ctx.db.query("users").collect();

        if (args.tenantId) {
            users = users.filter((u) => u.tenantId === args.tenantId);
        }

        if (args.role) {
            users = users.filter((u) => u.role === args.role);
        }

        if (args.search) {
            const lower = args.search.toLowerCase();
            users = users.filter(
                (u) =>
                    u.email.toLowerCase().includes(lower) ||
                    (u.firstName?.toLowerCase().includes(lower) ?? false) ||
                    (u.lastName?.toLowerCase().includes(lower) ?? false)
            );
        }

        return users;
    },
});
