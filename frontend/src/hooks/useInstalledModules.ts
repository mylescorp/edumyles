"use client";

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
  const { sessionToken } = useAuth();
  
  const installedModules = useQuery(
    api.modules.marketplace.queries.getInstalledModuleIds,
    sessionToken ? { sessionToken } : "skip"
  );

  const installedModuleDetails = useQuery(
    api.modules.marketplace.queries.getInstalledModules,
    sessionToken ? { sessionToken } : "skip"
  );

  const availableModules = useQuery(
    api.modules.marketplace.queries.getAvailableForTier,
    sessionToken ? { sessionToken } : "skip"
  );

  return {
    installedModuleIds: installedModules ?? [],
    installedModules: installedModuleDetails ?? [],
    availableModules: availableModules ?? [],
    isLoading:
      !!sessionToken &&
      (installedModules === undefined ||
        installedModuleDetails === undefined ||
        availableModules === undefined),
    isModuleInstalled: (moduleId: string) =>
      CORE_MODULE_IDS.includes(moduleId) || installedModules?.includes(moduleId) || false,
    isModuleActive: (moduleId: string) => {
      if (CORE_MODULE_IDS.includes(moduleId)) return true;
      const module = installedModuleDetails?.find(m => m.moduleId === moduleId);
      return module?.status === "active";
    },
  };
}
