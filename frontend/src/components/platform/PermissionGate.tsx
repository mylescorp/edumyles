"use client";

import { ReactNode } from "react";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";

export function PermissionGate({
  permission,
  children,
  fallback = null,
  showDisabled = false,
  disabledTooltip,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  showDisabled?: boolean;
  disabledTooltip?: string;
}) {
  const { can, isLoaded } = usePlatformPermissions();

  if (!isLoaded) return null;
  if (!can(permission)) {
    if (showDisabled) {
      return (
        <div
          aria-disabled="true"
          className="cursor-not-allowed opacity-60"
          title={disabledTooltip ?? `Requires ${permission}`}
        >
          {children}
        </div>
      );
    }
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
