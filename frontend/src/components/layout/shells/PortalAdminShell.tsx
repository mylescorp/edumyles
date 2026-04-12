"use client";

import { ReactNode } from "react";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { adminNavItems } from "@/lib/routes";

const ADMIN_ROLES = ["school_admin", "principal", "master_admin", "super_admin"];

export function PortalAdminShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase allowedRoles={ADMIN_ROLES} navItems={adminNavItems} useModuleAccessGuard>
      {children}
    </AppShellBase>
  );
}
