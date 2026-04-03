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
    role,
    isLoading,
    isAuthenticated,
  } = useAuth();
  const hasLiveTenantSession =
    !!sessionToken && sessionToken !== "dev_session_token";
  const isPlatformSession = role === "master_admin" || role === "super_admin";
  const canQueryTenant = !isLoading && isAuthenticated && hasLiveTenantSession && !isPlatformSession;

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

  const resolvedModules = installedModuleIds ?? (isAuthenticated ? CORE_MODULE_IDS : []);
  const resolvedTenantId = tenantContext?.tenantId ?? (isPlatformSession ? sessionTenantId : null) ?? null;
  const resolvedTier =
    tenantContext?.organization?.tier ?? tenantContext?.tenant?.plan ?? null;
  const hasTenantContext = !!tenantContext?.tenant && !!resolvedTenantId;
  const queryPending =
    canQueryTenant &&
    (tenantContext === undefined || installedModuleIds === undefined);
  const isUnauthenticated = !isLoading && !isAuthenticated;
  const tenantResolutionError =
    !isLoading &&
    !isUnauthenticated &&
    !isPlatformSession &&
    hasLiveTenantSession &&
    !queryPending &&
    !hasTenantContext
      ? "Tenant context could not be resolved for the current session."
      : null;
  const status = isLoading || queryPending
    ? "loading"
    : isUnauthenticated
      ? "unauthenticated"
      : tenantResolutionError
        ? "error"
        : "resolved";

  return {
    tenantId: resolvedTenantId,
    tenant: hasTenantContext
      ? {
          _id: resolvedTenantId!,
          name: tenantContext.tenant.name,
          plan: tenantContext.tenant.plan,
          status: tenantContext.tenant.status,
          subdomain: tenantContext.tenant.subdomain,
          email: tenantContext.tenant.email ?? "",
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
    hasResolvedTenant: isPlatformSession ? !!resolvedTenantId : hasTenantContext,
    tenantResolutionError,
    status,
    isUnauthenticated,
    isPlatformTenant: isPlatformSession,
    isLoading: status === "loading",
  };
}
