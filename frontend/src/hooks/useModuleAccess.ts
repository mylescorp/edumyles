"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";
import { normalizeModuleSlug } from "@/lib/moduleSlugs";

export function useModuleAccess(moduleSlug: string, userRole?: string) {
  const { sessionToken, isLoading, isAuthenticated } = useAuth();
  const normalizedModuleSlug = normalizeModuleSlug(moduleSlug) ?? moduleSlug;
  const canQuery =
    !isLoading &&
    isAuthenticated &&
    !!sessionToken &&
    typeof normalizedModuleSlug === "string" &&
    normalizedModuleSlug.trim().length > 0;

  const result = useQuery(
    api.modules.marketplace.settings.getModuleAccessStatus,
    canQuery ? { sessionToken, moduleSlug: normalizedModuleSlug, userRole } : "skip"
  );

  const data = (result?.data ?? null) as
    | {
        isInstalled: boolean;
        hasAccess: boolean;
        accessLevel: string;
        installStatus: string;
        reason: string;
      }
    | null;

  return {
    isLoading: canQuery && result === undefined,
    isInstalled: canQuery ? (data?.isInstalled ?? false) : true,
    hasAccess: canQuery ? (data?.hasAccess ?? false) : true,
    accessLevel: canQuery ? (data?.accessLevel ?? "none") : "full",
    installStatus: canQuery ? (data?.installStatus ?? "unknown") : "active",
    reason: canQuery ? (data?.reason ?? "Module access state is unavailable.") : "No module guard required.",
  };
}
