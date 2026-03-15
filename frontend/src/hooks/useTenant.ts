"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";

/** Core module IDs — always considered installed regardless of DB state */
const CORE_MODULE_IDS = ["sis", "communications", "users"];

export function useTenant() {
  const { sessionToken } = useAuth();

  const installedModuleIds = useQuery(
    api.modules.marketplace.queries.getInstalledModuleIds,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  // Always include core modules even if the query hasn't loaded yet
  const resolvedModules = installedModuleIds ?? CORE_MODULE_IDS;

  return {
    tenantId: "demo-tenant-001",
    tenant: {
      _id: "demo-tenant-001",
      name: "Demo School",
      plan: "pro",
      status: "active",
      subdomain: "demo",
      email: "admin@demo.edumyles.com",
      phone: "+254 700 000 000",
      country: "Kenya",
      county: "Nairobi"
    },
    organization: { _id: "demo-org-001", name: "Demo School", tier: "pro" },
    installedModules: resolvedModules,
    tier: "pro",
    isLoading: installedModuleIds === undefined,
  };
}
