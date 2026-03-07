import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";
import { logAction } from "../../helpers/auditLog";

// Update a tenant's subscription tier/plan
export const updateTenantTier = mutation({
    args: {
        sessionToken: v.string(),
        tenantId: v.string(),
        plan: v.union(
            v.literal("free"),
            v.literal("starter"),
            v.literal("growth"),
            v.literal("enterprise")
        ),
    },
    handler: async (ctx, args) => {
        const tenantCtx = await requirePlatformSession(ctx, args);

        const tenant = await ctx.db
            .query("tenants")
            .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
            .first();

        if (!tenant) throw new Error("NOT_FOUND: Tenant not found");

        const previousPlan = tenant.plan;

        await ctx.db.patch(tenant._id, {
            plan: args.plan,
            updatedAt: Date.now(),
        });

        // Also update org tier if it exists
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .first();

        if (org) {
            await ctx.db.patch(org._id, { tier: args.plan });
        }

        await logAction(ctx, {
            tenantId: tenantCtx.tenantId,
            actorId: tenantCtx.userId,
            actorEmail: tenantCtx.email,
            action: "settings.updated",
            entityType: "tenant",
            entityId: args.tenantId,
            before: { previousPlan },
            after: { plan: args.plan },
        });
    },
});
