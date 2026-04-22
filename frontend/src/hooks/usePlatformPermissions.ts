"use client";

import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";
import { usePlatformQuery } from "./usePlatformQuery";

export function usePlatformPermissions() {
  const { sessionToken } = useAuth();

  const result = usePlatformQuery(
    api.modules.platform.rbac.getMyPermissions,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as
    | {
        permissions: string[];
        platformUser: any;
        isAuthenticated?: boolean;
        isMasterAdmin?: boolean;
      }
    | undefined;

  function can(permission: string) {
    const permissions = result?.permissions ?? [];
    return permissions.includes("*") || permissions.includes(permission);
  }

  function canAny(permissions: string[]) {
    return permissions.some((permission) => can(permission));
  }

  function canAll(permissions: string[]) {
    return permissions.every((permission) => can(permission));
  }

  return {
    permissions: result?.permissions ?? [],
    platformUser: result?.platformUser ?? null,
    can,
    canAny,
    canAll,
    isLoaded: result !== undefined,
    isAuthenticated: result?.isAuthenticated ?? Boolean(sessionToken),
    isMasterAdmin: result?.isMasterAdmin ?? result?.platformUser?.role === "master_admin",
  };
}
