"use client";

import { useMemo } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";
import { getModuleAliases, normalizeModuleSlug } from "@/lib/moduleSlugs";

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

  const installedModulesResult = useQuery(
    api.modules.marketplace.settings.getInstalledModulesForTenant,
    canQuery ? { sessionToken } : "skip"
  );
  const availableModulesResult = useQuery(
    api.modules.marketplace.settings.getMarketplaceModules,
    canQuery ? { sessionToken } : "skip"
  );

  const installedModules = (installedModulesResult?.data ?? []) as any[];
  const availableModules = (availableModulesResult?.data ?? []) as any[];

  const normalizedInstalledModules = useMemo(
    () =>
      installedModules.map((install) => ({
        ...install,
        moduleSlug: normalizeModuleSlug(
          install.moduleSlug ?? install.module?.slug ?? install.moduleId
        ),
        accessLevel: getRoleAccessLevel(install, userRole),
        navConfig: install.module?.navConfig ?? null,
        dashboardWidgets:
          install.module?.dashboardWidgets ??
          install.module?.navConfig?.dashboardWidgets ??
          [],
      })),
    [installedModules]
  );

  const accessibleNavItems = useMemo(() => {
    return normalizedInstalledModules.flatMap((install) => {
      const navConfig = install.navConfig;
      if (!navConfig || install.accessLevel === "none") return [];

      const roleKey =
        userRole === "teacher"
          ? "teacherNav"
          : userRole === "student"
            ? "studentNav"
            : userRole === "parent"
              ? "parentNav"
              : "adminNav";

      return ((navConfig[roleKey] ?? []) as any[]).map((item) => ({
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

  const installedModuleIds = useMemo(
    () =>
      Array.from(
        new Set(
          normalizedInstalledModules.flatMap((module) => getModuleAliases(module.moduleSlug))
        )
      ),
    [normalizedInstalledModules]
  );

  return {
    installedModules: normalizedInstalledModules,
    installedModuleIds,
    availableModules,
    accessibleNavItems,
    dashboardWidgets,
    isLoading:
      canQuery && (installedModulesResult === undefined || availableModulesResult === undefined),
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
