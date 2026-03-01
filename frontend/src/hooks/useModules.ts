"use client";

import { useTenant } from "./useTenant";
// Module type matches shared/src/types
type Module = string;

export function useModules() {
  const { installedModules, tier, isLoading } = useTenant();

  function isInstalled(moduleId: Module | string): boolean {
    return installedModules.includes(moduleId);
  }

  function isAvailableForTier(moduleId: Module | string): boolean {
    const TIER_MODULES: Record<string, string[]> = {
      starter: ["sis", "admissions", "finance", "communications"],
      standard: ["sis", "admissions", "finance", "timetable", "academics", "communications"],
      pro: ["sis", "admissions", "finance", "timetable", "academics", "hr", "library", "transport", "communications"],
      enterprise: ["sis", "admissions", "finance", "timetable", "academics", "hr", "library", "transport", "communications", "ewallet", "ecommerce"],
    };

    if (!tier) return false;
    const available = TIER_MODULES[tier] ?? [];
    return available.includes(moduleId);
  }

  return {
    installedModules,
    isInstalled,
    isAvailableForTier,
    isLoading,
  };
}
