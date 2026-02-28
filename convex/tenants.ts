import { query } from "./_generated/server";
import { v } from "convex/values";

// Get tenant by tenantId — used by useTenant hook
export const getTenantByTenantId = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .first();
  },
});

// Get tenant with its organization and installed modules
export const getTenantContext = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", session.tenantId))
      .first();

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", session.tenantId))
      .first();

    const installedModules = await ctx.db
      .query("installedModules")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", session.tenantId).eq("status", "active")
      )
      .collect();

    return {
      tenantId: session.tenantId,
      tenant: tenant
        ? {
            name: tenant.name,
            subdomain: tenant.subdomain,
            plan: tenant.plan,
            status: tenant.status,
            country: tenant.country,
          }
        : null,
      organization: org
        ? {
            name: org.name,
            subdomain: org.subdomain,
            tier: org.tier,
          }
        : null,
      installedModules: installedModules.map((m) => m.moduleId),
    };
  },
});
