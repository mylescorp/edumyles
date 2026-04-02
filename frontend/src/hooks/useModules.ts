"use client";

import { useInstalledModules } from "./useInstalledModules";
// Module type matches shared/src/types
type Module = string;

export function useModules() {
  const { installedModuleIds, availableModules, isLoading } = useInstalledModules();

  function isInstalled(moduleId: Module | string): boolean {
    return installedModuleIds.includes(moduleId);
  }

  function isAvailableForTier(moduleId: Module | string): boolean {
    const matchingModule = availableModules.find(
      (entry: { moduleId: string; availableForTier?: boolean }) => entry.moduleId === moduleId
    );
    return !!matchingModule?.availableForTier;
  }

  return {
    installedModules: installedModuleIds,
    isInstalled,
    isAvailableForTier,
    isLoading,
  };
}
