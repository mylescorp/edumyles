"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";

/** Core module IDs — always considered installed regardless of DB state */
const CORE_MODULE_IDS = ["sis", "communications", "users"];

export function useTenant() {
  const { sessionToken, tenantId: sessionTenantId } = useAuth();

  const tenantContext = useQuery(
    api.tenants.getTenantContext,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  const installedModuleIds = useQuery(
    api.modules.marketplace.queries.getInstalledModuleIds,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  // Always include core modules even if the query hasn't loaded yet
  const resolvedModules = installedModuleIds ?? CORE_MODULE_IDS;
  const resolvedTenantId = tenantContext?.tenantId ?? sessionTenantId ?? "demo-tenant-001";
  const resolvedTier =
    tenantContext?.organization?.tier ?? tenantContext?.tenant?.plan ?? "free";

  return {
    tenantId: resolvedTenantId,
    tenant: tenantContext?.tenant
      ? {
          _id: resolvedTenantId,
          name: tenantContext.tenant.name,
          plan: tenantContext.tenant.plan,
          status: tenantContext.tenant.status,
          subdomain: tenantContext.tenant.subdomain,
          email: tenantContext.tenant.email ?? "support@edumyles.com",
          phone: tenantContext.tenant.phone ?? "",
          country: tenantContext.tenant.country,
          county: tenantContext.tenant.county ?? "",
        }
      : {
          _id: resolvedTenantId,
          name: "Demo School",
          plan: "free",
          status: "active",
          subdomain: "demo",
          email: "admin@demo.edumyles.com",
          phone: "+254 700 000 000",
          country: "Kenya",
          county: "Nairobi",
        },
    organization: tenantContext?.organization
      ? {
          _id: tenantContext.organization.subdomain ?? "org",
          name: tenantContext.organization.name,
          tier: tenantContext.organization.tier,
        }
      : { _id: "demo-org-001", name: "Demo School", tier: "free" },
    installedModules: resolvedModules,
    tier: resolvedTier,
    isLoading:
      !!sessionToken &&
      (tenantContext === undefined || installedModuleIds === undefined),
  };
}
