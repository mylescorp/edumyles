import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "../../_generated/server";
import { requireTenantSession } from "../../helpers/tenantGuard";
import { logAction } from "../../helpers/auditLog";

async function getTenantModules(ctx: any, tenantId: string) {
  return await ctx.db
    .query("module_installs")
    .withIndex("by_tenantId", (q: any) => q.eq("tenantId", tenantId))
    .collect();
}

async function getPlanInclusion(ctx: any, moduleId: any, plan: string) {
  return await ctx.db
    .query("module_plan_inclusions")
    .withIndex("by_moduleId_plan", (q: any) => q.eq("moduleId", moduleId).eq("plan", plan))
    .unique();
}

export const auditModulesForPlanChange = query({
  args: {
    sessionToken: v.string(),
    fromPlan: v.string(),
    toPlan: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, args);
    const installs = await getTenantModules(ctx, tenant.tenantId);

    const results = [];
    for (const install of installs.filter((entry: any) => entry.status === "active")) {
      const fromInclusion = await getPlanInclusion(ctx, install.moduleId, args.fromPlan);
      const toInclusion = await getPlanInclusion(ctx, install.moduleId, args.toPlan);

      if (Boolean(fromInclusion?.isIncluded) === Boolean(toInclusion?.isIncluded)) {
        continue;
      }

      results.push({
        moduleSlug: install.moduleSlug,
        action: toInclusion?.isIncluded ? "newly_included" : "suspend_at_period_end",
        impact:
          toInclusion?.isIncluded
            ? "This module becomes available under the target plan."
            : "This module will require separate billing or suspension.",
      });
    }

    return results;
  },
});

export const handlePlanUpgrade = internalMutation({
  args: {
    tenantId: v.string(),
    fromPlan: v.string(),
    toPlan: v.string(),
    actorId: v.optional(v.string()),
    actorEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const installs = await getTenantModules(ctx, args.tenantId);
    let newlyAvailable = 0;

    for (const install of installs) {
      const fromInclusion = await getPlanInclusion(ctx, install.moduleId, args.fromPlan);
      const toInclusion = await getPlanInclusion(ctx, install.moduleId, args.toPlan);
      if (!fromInclusion?.isIncluded && toInclusion?.isIncluded) {
        newlyAvailable += 1;
      }
    }

    if (args.actorId && args.actorEmail) {
      await logAction(ctx, {
        tenantId: args.tenantId,
        actorId: args.actorId,
        actorEmail: args.actorEmail,
        action: "subscription.updated",
        entityType: "plan_change",
        entityId: args.tenantId,
        after: { fromPlan: args.fromPlan, toPlan: args.toPlan, newlyAvailable },
      });
    }

    return { newlyAvailable };
  },
});

export const handlePlanDowngrade = internalMutation({
  args: {
    tenantId: v.string(),
    fromPlan: v.string(),
    toPlan: v.string(),
    actorId: v.optional(v.string()),
    actorEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const installs = await getTenantModules(ctx, args.tenantId);
    let affected = 0;

    for (const install of installs.filter((entry: any) => entry.status === "active")) {
      const toInclusion = await getPlanInclusion(ctx, install.moduleId, args.toPlan);
      if (toInclusion?.isIncluded) continue;

      await ctx.db.patch(install._id, {
        status: "suspended_platform",
        updatedAt: Date.now(),
      });
      affected += 1;
    }

    if (args.actorId && args.actorEmail) {
      await logAction(ctx, {
        tenantId: args.tenantId,
        actorId: args.actorId,
        actorEmail: args.actorEmail,
        action: "subscription.updated",
        entityType: "plan_change",
        entityId: args.tenantId,
        after: { fromPlan: args.fromPlan, toPlan: args.toPlan, affected },
      });
    }

    return { affected };
  },
});

export const isModuleIncludedInPlan = internalMutation({
  args: {
    tenantId: v.string(),
    moduleId: v.union(v.string(), v.id("marketplace_modules")),
  },
  handler: async (ctx, args) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
    const plan = organization?.tier ?? tenant?.plan ?? "free";

    const inclusion = await ctx.db
      .query("module_plan_inclusions")
      .withIndex("by_moduleId_plan", (q) =>
        q.eq("moduleId", args.moduleId as any).eq("plan", plan as any)
      )
      .unique();

    return Boolean(inclusion?.isIncluded);
  },
});
