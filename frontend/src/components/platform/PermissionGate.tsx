"use client";

import { ReactNode } from "react";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can, isLoaded } = usePlatformPermissions();

  if (!isLoaded) return null;
  if (!can(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
