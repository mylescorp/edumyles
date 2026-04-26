"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { normalizeModuleSlug } from "@/lib/moduleSlugs";
import { useAuth } from "./useAuth";

const CORE_MODULE_IDS = ["sis", "communications", "users"];

type AccessibleNavItem = {
  href: string;
  label: string;
  icon: string;
  requiredFeature: string;
  moduleSlug: string;
};

function normalizeArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.page)) return value.page;
  return [];
}

function getRoleAccessLevel(install: any, userRole: string | undefined) {
  if (!userRole) return "full";
  if (
    userRole === "school_admin" ||
    userRole === "principal" ||
    userRole === "master_admin" ||
    userRole === "super_admin"
  ) {
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

  const installedModuleDetailsResult = useQuery(
    api.modules.marketplace.queries.getInstalledModules,
    canQuery ? { sessionToken } : "skip"
  );

  const availableModulesResult = useQuery(
    api.modules.marketplace.queries.getAvailableForTier,
    canQuery ? { sessionToken } : "skip"
  );

  useEffect(() => {
    if (!canQuery) {
      setQueryTimedOut(false);
      return;
    }

    if (
      installedModuleDetailsResult !== undefined &&
      availableModulesResult !== undefined
    ) {
      setQueryTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setQueryTimedOut(true);
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [availableModulesResult, canQuery, installedModuleDetailsResult]);

  const installedModuleDetails = normalizeArray<any>(installedModuleDetailsResult);
  const availableModules = normalizeArray<any>(availableModulesResult);

  const normalizedInstalledModules = useMemo(
    () =>
      installedModuleDetails.map((install: any) => ({
        ...install,
        moduleSlug: install.moduleSlug ?? install.moduleId,
        accessLevel: getRoleAccessLevel(install, userRole),
      })),
    [installedModuleDetails, userRole]
  );

  const accessibleNavItems = useMemo(() => {
    return normalizedInstalledModules.flatMap((install: any) => {
      if (!install.accessibleNavConfig) return [];

      const roleKey =
        userRole === "teacher"
          ? "teacherNav"
          : userRole === "student"
            ? "studentNav"
            : userRole === "parent"
              ? "parentNav"
              : "adminNav";

      return normalizeArray<any>(install.accessibleNavConfig[roleKey]).map((item) => ({
        ...item,
        moduleSlug: install.moduleSlug,
      }));
    }) as AccessibleNavItem[];
  }, [normalizedInstalledModules, userRole]);

  const dashboardWidgets = useMemo(
    () =>
      normalizedInstalledModules.flatMap((install: any) =>
        normalizeArray<any>(install.dashboardWidgets).map((widget: any) => ({
          ...widget,
          moduleSlug: install.moduleSlug,
        }))
      ),
    [normalizedInstalledModules]
  );

  const resolvedInstalledModuleDetails = queryTimedOut
    ? installedModuleDetails
    : installedModuleDetails;
  const resolvedAvailableModules = queryTimedOut ? availableModules : availableModules;

  const installedModuleIds: string[] =
    resolvedInstalledModuleDetails &&
    Array.isArray(resolvedInstalledModuleDetails)
      ? [
          ...new Set([
            ...CORE_MODULE_IDS,
            ...resolvedInstalledModuleDetails.map((moduleRecord: any) =>
              moduleRecord.moduleSlug ?? moduleRecord.moduleId
            ),
          ]),
        ]
      : CORE_MODULE_IDS;

  return {
    installedModules: normalizedInstalledModules,
    installedModuleIds,
    availableModules: resolvedAvailableModules,
    accessibleNavItems,
    dashboardWidgets,
    isLoading:
      canQuery &&
      !queryTimedOut &&
      (installedModuleDetailsResult === undefined ||
        availableModulesResult === undefined),
    isModuleInstalled: (moduleSlug: string) => {
      const normalizedModuleSlug = normalizeModuleSlug(moduleSlug);
      return normalizedInstalledModules.some(
        (moduleRecord: any) =>
          normalizeModuleSlug(moduleRecord.moduleSlug) === normalizedModuleSlug
      );
    },
    isModuleActive: (moduleSlug: string) => {
      const normalizedModuleSlug = normalizeModuleSlug(moduleSlug);
      return normalizedInstalledModules.some(
        (moduleRecord: any) =>
          normalizeModuleSlug(moduleRecord.moduleSlug) === normalizedModuleSlug &&
          moduleRecord.status === "active"
      );
    },
    getModuleAccessLevel: (moduleSlug: string) => {
      const normalizedModuleSlug = normalizeModuleSlug(moduleSlug);
      const match = normalizedInstalledModules.find(
        (moduleRecord: any) =>
          normalizeModuleSlug(moduleRecord.moduleSlug) === normalizedModuleSlug
      );
      return match?.accessLevel ?? "none";
    },
    isModuleAccessible: (moduleSlug: string) => {
      const normalizedModuleSlug = normalizeModuleSlug(moduleSlug);
      const match = normalizedInstalledModules.find(
        (moduleRecord: any) =>
          normalizeModuleSlug(moduleRecord.moduleSlug) === normalizedModuleSlug
      );
      return Boolean(
        match && match.accessLevel !== "none" && match.status === "active"
      );
    },
  };
}
