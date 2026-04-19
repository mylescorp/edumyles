"use client";

import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";
import { getModuleAliases, normalizeModuleSlug } from "@/lib/moduleSlugs";

const CORE_MODULE_IDS = ["core"]; // Define core module IDs constant

type AccessibleNavItem = {
  href: string;
  label: string;
  icon: string;
  requiredFeature: string;
  moduleSlug: string;
};

function getRoleAccessLevel(install: any, userRole: string | undefined) {
  if (!userRole) return "full";
  if (userRole === "school_admin" || userRole === "principal" || userRole === "master_admin" || userRole === "super_admin") {
    return "full";
  }

  const roleAccess = install.accessConfig?.roleAccess?.find(
    (entry: any) => entry.role === userRole
  );
  return roleAccess?.accessLevel ?? "none";
}

export function useInstalledModules(userRole?: string) {
  const { sessionToken, isLoading, isAuthenticated } = useAuth();
  const canQuery = !isLoading && isAuthenticated && !!sessionToken;
  const [queryTimedOut, setQueryTimedOut] = useState(false);

  // Single query for full module records — IDs are derived from these, avoiding
  // the previous triple-query pattern (getInstalledModuleIds + getInstalledModules).
  const installedModuleDetailsResult = useQuery(
    api.modules.marketplace.queries.getInstalledModules,
    canQuery ? { sessionToken } : "skip"
  );

  const availableModulesResult = useQuery(
    api.modules.marketplace.queries.getAvailableForTier,
    canQuery ? { sessionToken } : "skip"
  );

  const installedModuleDetails = installedModuleDetailsResult?.data;
  const availableModules = availableModulesResult?.data;

  const normalizedInstalledModules = useMemo(
    () =>
      (installedModuleDetails ?? []).map((install: any) => ({
        ...install,
        accessLevel: getRoleAccessLevel(install, userRole),
      })),
    [installedModuleDetails, userRole]
  );

  const accessibleNavItems = useMemo(() => {
    return normalizedInstalledModules.flatMap((install) => {
      if (!install.accessibleNavConfig) return [];

      const roleKey =
        userRole === "teacher"
          ? "teacherNav"
          : userRole === "student"
            ? "studentNav"
            : userRole === "parent"
              ? "parentNav"
              : "adminNav";

      return ((install.accessibleNavConfig[roleKey] ?? []) as any[]).map((item) => ({
        ...item,
        moduleSlug: install.moduleSlug,
      }));
    }) as AccessibleNavItem[];
  }, [normalizedInstalledModules, userRole]);

  const dashboardWidgets = useMemo(
    () =>
      normalizedInstalledModules.flatMap((install) =>
        (install.dashboardWidgets ?? []).map((widget: any) => ({
          ...widget,
          moduleSlug: install.moduleSlug,
        }))
      ),
    [normalizedInstalledModules]
  );

  const resolvedInstalledModuleDetails = queryTimedOut
    ? (installedModuleDetails ?? [])
    : installedModuleDetails;
  const resolvedAvailableModules = queryTimedOut
    ? (availableModules ?? [])
    : availableModules;

  // Derive IDs from details; always include core modules
  const installedModuleIds: string[] = resolvedInstalledModuleDetails && Array.isArray(resolvedInstalledModuleDetails)
    ? [...new Set([...CORE_MODULE_IDS, ...resolvedInstalledModuleDetails.map((m: any) => m.moduleId)])]
    : CORE_MODULE_IDS;

  return {
    installedModules: normalizedInstalledModules,
    installedModuleIds,
    availableModules,
    accessibleNavItems,
    dashboardWidgets,
    isLoading:
      canQuery && (installedModuleDetailsResult === undefined || availableModulesResult === undefined),
    isModuleInstalled: (moduleSlug: string) => {
      const normalizedModuleSlug = normalizeModuleSlug(moduleSlug);
      return normalizedInstalledModules.some(
        (module) => normalizeModuleSlug(module.moduleSlug) === normalizedModuleSlug
      );
    },
    isModuleActive: (moduleSlug: string) => {
      const normalizedModuleSlug = normalizeModuleSlug(moduleSlug);
      return normalizedInstalledModules.some(
        (module) =>
          normalizeModuleSlug(module.moduleSlug) === normalizedModuleSlug &&
          module.status === "active"
      );
    },
    getModuleAccessLevel: (moduleSlug: string) => {
      const normalizedModuleSlug = normalizeModuleSlug(moduleSlug);
      const match = normalizedInstalledModules.find(
        (module) => normalizeModuleSlug(module.moduleSlug) === normalizedModuleSlug
      );
      return match?.accessLevel ?? "none";
    },
    isModuleAccessible: (moduleSlug: string) => {
      const normalizedModuleSlug = normalizeModuleSlug(moduleSlug);
      const match = normalizedInstalledModules.find(
        (module) => normalizeModuleSlug(module.moduleSlug) === normalizedModuleSlug
      );
      return Boolean(match && match.accessLevel !== "none" && match.status === "active");
    },
  };
}
