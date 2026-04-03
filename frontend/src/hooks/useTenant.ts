"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";

const CORE_MODULE_IDS = ["sis", "communications", "users"];

export function deriveTenantResolutionState(args: {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasLiveTenantSession: boolean;
  isPlatformSession: boolean;
  resolvedTenantId: string | null;
}) {
  const queryPending =
    !args.isLoading &&
    args.isAuthenticated &&
    args.hasLiveTenantSession &&
    !args.isPlatformSession &&
    !args.resolvedTenantId;
  const isUnauthenticated = !args.isLoading && !args.isAuthenticated;
  const tenantResolutionError =
    !args.isLoading &&
    !isUnauthenticated &&
    !args.isPlatformSession &&
    args.hasLiveTenantSession &&
    !queryPending &&
    !args.resolvedTenantId
      ? "Tenant context could not be resolved for the current session."
      : null;
  const status = args.isLoading || queryPending
    ? "loading"
    : isUnauthenticated
      ? "unauthenticated"
      : tenantResolutionError
        ? "error"
        : "resolved";

  return {
    status,
    isUnauthenticated,
    tenantResolutionError,
    queryPending,
  } as const;
}

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
  const resolvedTenantId =
    tenantContext?.tenantId ??
    sessionTenantId ??
    null;
  const resolvedTier =
    tenantContext?.organization?.tier ?? tenantContext?.tenant?.plan ?? null;
  const hasTenantContext = !!resolvedTenantId;
  const resolution = deriveTenantResolutionState({
    isLoading,
    isAuthenticated,
    hasLiveTenantSession,
    isPlatformSession,
    resolvedTenantId,
  });

  return {
    tenantId: resolvedTenantId,
    tenant: hasTenantContext
      ? {
          _id: resolvedTenantId!,
          name: tenantContext?.tenant?.name ?? "My School",
          plan: tenantContext?.tenant?.plan ?? resolvedTier ?? "starter",
          status: tenantContext?.tenant?.status ?? "active",
          subdomain: tenantContext?.tenant?.subdomain ?? "",
          email: tenantContext?.tenant?.email ?? "",
          phone: tenantContext?.tenant?.phone ?? "",
          country: tenantContext?.tenant?.country ?? "KE",
          county: tenantContext?.tenant?.county ?? "",
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
    tenantResolutionError: resolution.tenantResolutionError,
    status: resolution.status,
    isUnauthenticated: resolution.isUnauthenticated,
    isPlatformTenant: isPlatformSession,
    isLoading: resolution.status === "loading",
  };
}
