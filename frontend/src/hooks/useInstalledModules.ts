"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";

const CORE_MODULE_IDS = ["sis", "communications", "users"];

export interface InstalledModule {
  _id: string;
  moduleId: string;
  status: "active" | "inactive";
  installedAt: number;
  installedBy: string;
  config: Record<string, any>;
  updatedAt: number;
}

export function useInstalledModules() {
  const { sessionToken, isLoading, isAuthenticated } = useAuth();
  const hasLiveTenantSession =
    !!sessionToken && sessionToken !== "dev_session_token";
  const canQueryModules = !isLoading && isAuthenticated && hasLiveTenantSession;
  const [queryTimedOut, setQueryTimedOut] = useState(false);

  // Single query for full module records — IDs are derived from these, avoiding
  // the previous triple-query pattern (getInstalledModuleIds + getInstalledModules).
  const installedModuleDetails = useQuery(
    api.modules.marketplace.queries.getInstalledModules,
    canQueryModules ? { sessionToken } : "skip"
  );

  const availableModules = useQuery(
    api.modules.marketplace.queries.getAvailableForTier,
    canQueryModules ? { sessionToken } : "skip"
  );

  useEffect(() => {
    if (!canQueryModules) {
      setQueryTimedOut(false);
      return;
    }

    if (installedModuleDetails !== undefined && availableModules !== undefined) {
      setQueryTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setQueryTimedOut(true);
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [availableModules, canQueryModules, installedModuleDetails]);

  const resolvedInstalledModuleDetails = queryTimedOut
    ? (installedModuleDetails ?? [])
    : installedModuleDetails;
  const resolvedAvailableModules = queryTimedOut
    ? (availableModules ?? [])
    : availableModules;

  // Derive IDs from details; always include core modules
  const installedModuleIds: string[] = resolvedInstalledModuleDetails
    ? [...new Set([...CORE_MODULE_IDS, ...resolvedInstalledModuleDetails.map((m: any) => m.moduleId)])]
    : CORE_MODULE_IDS;

  return {
    installedModuleIds,
    installedModules: resolvedInstalledModuleDetails ?? [],
    availableModules: resolvedAvailableModules ?? [],
    isLoading:
      !queryTimedOut &&
      canQueryModules &&
      (installedModuleDetails === undefined || availableModules === undefined),
    isModuleInstalled: (moduleId: string) =>
      CORE_MODULE_IDS.includes(moduleId) ||
      (resolvedInstalledModuleDetails?.some((m: any) => m.moduleId === moduleId) ?? false),
    isModuleActive: (moduleId: string) => {
      if (CORE_MODULE_IDS.includes(moduleId)) return true;
      const mod = resolvedInstalledModuleDetails?.find((m: any) => m.moduleId === moduleId);
      return mod?.status === "active";
    },
  };
}
