"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";

export function useTenant() {
  const { sessionToken } = useAuth();

  const tenantContext = useQuery(
    api.tenants.getTenantContext,
    sessionToken ? { sessionToken } : "skip"
  );

  const isLoading = tenantContext === undefined;

  return {
    tenantId: tenantContext?.tenantId ?? null,
    tenant: tenantContext?.tenant ?? null,
    organization: tenantContext?.organization ?? null,
    installedModules: tenantContext?.installedModules ?? [],
    tier: tenantContext?.organization?.tier ?? tenantContext?.tenant?.plan ?? null,
    isLoading,
  };
}
