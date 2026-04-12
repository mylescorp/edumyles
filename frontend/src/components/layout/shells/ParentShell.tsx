"use client";

import { ReactNode } from "react";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { parentNavItems } from "@/lib/routes";

const PARENT_ROLES = ["parent", "master_admin", "super_admin"];

export function ParentShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase allowedRoles={PARENT_ROLES} navItems={parentNavItems} useModuleAccessGuard>
      {children}
    </AppShellBase>
  );
}
