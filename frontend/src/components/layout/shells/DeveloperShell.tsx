"use client";

import { ReactNode } from "react";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { developerNavItems } from "@/lib/routes";

const DEVELOPER_ROLES = ["developer", "master_admin", "super_admin"];

export function DeveloperShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase allowedRoles={DEVELOPER_ROLES} navItems={developerNavItems}>
      {children}
    </AppShellBase>
  );
}
