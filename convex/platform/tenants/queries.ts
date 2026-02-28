import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requireRole } from "../../helpers/authorize";

export const listAllTenants = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("trial")
    )),
  },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin", "super_admin");

    let tenantsQuery = ctx.db.query("tenants");

    const tenants = await tenantsQuery.collect();

    if (args.status) {
      return tenants.filter((t) => t.status === args.status);
    }

    return tenants;
  },
});

export const getTenantById = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin", "super_admin");

    return await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();
  },
});

export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    const tenantCtx = await requireTenantContext(ctx);
    requireRole(tenantCtx, "master_admin", "super_admin");

    const tenants = await ctx.db.query("tenants").collect();
    const activeTenants = tenants.filter((t) => t.status === "active");
    const suspendedTenants = tenants.filter((t) => t.status === "suspended");
    const trialTenants = tenants.filter((t) => t.status === "trial");

    return {
      totalTenants: tenants.length,
      activeTenants: activeTenants.length,
      suspendedTenants: suspendedTenants.length,
      trialTenants: trialTenants.length,
    };
  },
});
