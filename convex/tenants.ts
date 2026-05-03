import { query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeModuleSlug } from "./modules/marketplace/moduleAliases";

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

export const getTenantBySubdomain = query({
  args: { subdomain: v.string() },
  handler: async (ctx, args) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .first();

    if (!tenant) return null;

    return {
      tenantId: tenant.tenantId,
      name: tenant.name,
      subdomain: tenant.subdomain,
      status: tenant.status,
      country: tenant.country,
    };
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

    const effectiveTenantId = session.activeTenantId ?? session.tenantId;

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", effectiveTenantId))
      .first();

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", effectiveTenantId))
      .first();

    const installedModules = await ctx.db
      .query("module_installs")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", effectiveTenantId))
      .collect();

    const network =
      tenant?.networkId
        ? await ctx.db
            .query("tenant_networks")
            .withIndex("by_networkId", (q) => q.eq("networkId", tenant.networkId!))
            .first()
        : null;

    return {
      tenantId: effectiveTenantId,
      baseTenantId: session.tenantId,
      activeTenantId: effectiveTenantId,
      networkId: session.networkId ?? tenant?.networkId ?? null,
      identityId: session.identityId ?? null,
      accessibleTenantIds: session.accessibleTenantIds ?? [effectiveTenantId],
      tenant: tenant
        ? {
            tenantId: tenant.tenantId,
            name: tenant.name,
            subdomain: tenant.subdomain,
            plan: tenant.plan,
            status: tenant.status,
            email: tenant.email,
            phone: tenant.phone,
            county: tenant.county,
            country: tenant.country,
            networkId: tenant.networkId,
            campusName: tenant.campusName,
            campusCode: tenant.campusCode,
            isPrimaryCampus: tenant.isPrimaryCampus,
          }
        : null,
      organization: org
        ? {
            name: org.name,
            subdomain: org.subdomain,
            tier: org.tier,
          }
        : null,
      network: network
        ? {
            networkId: network.networkId,
            name: network.name,
            slug: network.slug,
            organizationMode: network.organizationMode,
            billingMode: network.billingMode,
            primaryTenantId: network.primaryTenantId,
          }
        : null,
      installedModules: installedModules
        .filter((m) => m.status === "active")
        .map((m) => m.moduleSlug ?? normalizeModuleSlug(String(m.moduleId))),
    };
  },
});

export const getAccessibleCampuses = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const accessibleTenantIds = session.accessibleTenantIds ?? [session.activeTenantId ?? session.tenantId];
    const tenants = await Promise.all(
      accessibleTenantIds.map((tenantId) =>
        ctx.db.query("tenants").withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId)).first()
      )
    );

    return tenants
      .filter((tenant): tenant is NonNullable<typeof tenant> => Boolean(tenant))
      .map((tenant) => ({
        tenantId: tenant.tenantId,
        name: tenant.name,
        campusName: tenant.campusName ?? tenant.name,
        subdomain: tenant.subdomain,
        networkId: tenant.networkId ?? null,
        isPrimaryCampus: tenant.isPrimaryCampus ?? false,
        isActive: (session.activeTenantId ?? session.tenantId) === tenant.tenantId,
      }));
  },
});
