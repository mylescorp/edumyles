"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";

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
    isLoading: installedModules === undefined || availableModules === undefined,
    isModuleInstalled: (moduleId: string) => installedModules?.includes(moduleId) ?? false,
    isModuleActive: (moduleId: string) => {
      const module = installedModuleDetails?.find(m => m.moduleId === moduleId);
      return module?.status === "active";
    }
  };
}
