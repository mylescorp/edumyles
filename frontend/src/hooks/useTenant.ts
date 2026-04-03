"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";

/** Core module IDs — always considered installed regardless of DB state */
const CORE_MODULE_IDS = ["sis", "communications", "users"];

export function useTenant() {
  const {
    sessionToken,
    tenantId: sessionTenantId,
    isLoading,
    isAuthenticated,
  } = useAuth();
  const hasLiveTenantSession =
    !!sessionToken && sessionToken !== "dev_session_token";
  const canQueryTenant = !isLoading && isAuthenticated && hasLiveTenantSession;

  const tenantContext = useQuery(
    api.tenants.getTenantContext,
    { sessionToken: sessionToken ?? "" },
    canQueryTenant
  );

  const installedModuleIds = useQuery(
    api.modules.marketplace.queries.getInstalledModuleIds,
    { sessionToken: sessionToken ?? "" },
    canQueryTenant
  );

  // Always include core modules even if the query hasn't loaded yet
  const resolvedModules = installedModuleIds ?? CORE_MODULE_IDS;
  const resolvedTenantId = tenantContext?.tenantId ?? sessionTenantId ?? null;
  const resolvedTier =
    tenantContext?.organization?.tier ?? tenantContext?.tenant?.plan ?? null;
  const hasTenantContext = !!tenantContext?.tenant && !!resolvedTenantId;

  return {
    tenantId: resolvedTenantId,
    tenant: hasTenantContext
      ? {
          _id: resolvedTenantId!,
          name: tenantContext.tenant.name,
          plan: tenantContext.tenant.plan,
          status: tenantContext.tenant.status,
          subdomain: tenantContext.tenant.subdomain,
          email: tenantContext.tenant.email ?? "support@edumyles.com",
          phone: tenantContext.tenant.phone ?? "",
          country: tenantContext.tenant.country,
          county: tenantContext.tenant.county ?? "",
        }
      : null,
    organization: tenantContext?.organization && resolvedTier
      ? {
          _id: tenantContext.organization.subdomain ?? "org",
          name: tenantContext.organization.name,
          tier: tenantContext.organization.tier,
        }
      : null,
    installedModules: resolvedModules,
    tier: resolvedTier,
    hasResolvedTenant: !!resolvedTenantId,
    isLoading:
      canQueryTenant &&
      (tenantContext === undefined || installedModuleIds === undefined),
  };
}
