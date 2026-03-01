import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";

// List all tenant subscriptions
export const listSubscriptions = query({
    args: {
        plan: v.optional(v.string()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenantCtx = await requireTenantContext(ctx);
        requireRole(tenantCtx, "master_admin", "super_admin");

        let tenants = await ctx.db.query("tenants").collect();

        if (args.plan) {
            tenants = tenants.filter((t) => t.plan === args.plan);
        }

        if (args.status) {
            tenants = tenants.filter((t) => t.status === args.status);
        }

        return tenants.map((t) => ({
            _id: t._id,
            tenantId: t.tenantId,
            name: t.name,
            subdomain: t.subdomain,
            plan: t.plan,
            status: t.status,
            email: t.email,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
        }));
    },
});

// Get subscription details for a single tenant
export const getSubscriptionDetails = query({
    args: { tenantId: v.string() },
    handler: async (ctx, args) => {
        const tenantCtx = await requireTenantContext(ctx);
        requireRole(tenantCtx, "master_admin", "super_admin");

        const tenant = await ctx.db
            .query("tenants")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
            .first();

        if (!tenant) throw new Error("NOT_FOUND: Tenant not found");

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .first();

        const users = await ctx.db
            .query("users")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .collect();

        const modules = await ctx.db
            .query("installedModules")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .collect();

        return {
            tenant: {
                ...tenant,
            },
            organization: org
                ? { name: org.name, tier: org.tier, subdomain: org.subdomain }
                : null,
            userCount: users.length,
            moduleCount: modules.filter((m) => m.status === "active").length,
        };
    },
});
