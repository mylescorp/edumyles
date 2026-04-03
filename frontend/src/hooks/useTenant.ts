"use client";

import { useEffect, useState } from "react";
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
  const [queryTimedOut, setQueryTimedOut] = useState(false);

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

  useEffect(() => {
    if (!canQueryTenant) {
      setQueryTimedOut(false);
      return;
    }

    if (tenantContext !== undefined && installedModuleIds !== undefined) {
      setQueryTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setQueryTimedOut(true);
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [canQueryTenant, installedModuleIds, tenantContext]);

  const resolvedTenantContext = queryTimedOut ? (tenantContext ?? null) : tenantContext;
  const resolvedInstalledModuleIds = queryTimedOut ? (installedModuleIds ?? null) : installedModuleIds;
  const resolvedModules = resolvedInstalledModuleIds ?? (isAuthenticated ? CORE_MODULE_IDS : []);
  const resolvedTenantId =
    resolvedTenantContext?.tenantId ??
    sessionTenantId ??
    null;
  const resolvedTier =
    resolvedTenantContext?.organization?.tier ?? resolvedTenantContext?.tenant?.plan ?? null;
  const hasTenantContext = !!resolvedTenantId;
  const resolution = deriveTenantResolutionState({
    isLoading: queryTimedOut ? false : isLoading,
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
          name: resolvedTenantContext?.tenant?.name ?? "My School",
          plan: resolvedTenantContext?.tenant?.plan ?? resolvedTier ?? "starter",
          status: resolvedTenantContext?.tenant?.status ?? "active",
          subdomain: resolvedTenantContext?.tenant?.subdomain ?? "",
          email: resolvedTenantContext?.tenant?.email ?? "",
          phone: resolvedTenantContext?.tenant?.phone ?? "",
          country: resolvedTenantContext?.tenant?.country ?? "KE",
          county: resolvedTenantContext?.tenant?.county ?? "",
        }
      : null,
    organization: resolvedTenantContext?.organization && resolvedTier
      ? {
          _id: resolvedTenantContext.organization.subdomain ?? "org",
          name: resolvedTenantContext.organization.name,
          tier: resolvedTenantContext.organization.tier,
        }
      : null,
    installedModules: resolvedModules,
    tier: resolvedTier,
    hasResolvedTenant: isPlatformSession ? !!resolvedTenantId : hasTenantContext,
    tenantResolutionError: resolution.tenantResolutionError,
    status: resolution.status,
    isUnauthenticated: resolution.isUnauthenticated,
    isPlatformTenant: isPlatformSession,
    isLoading: !queryTimedOut && resolution.status === "loading",
  };
}
