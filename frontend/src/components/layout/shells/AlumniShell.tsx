"use client";

import { ReactNode } from "react";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { alumniNavItems } from "@/lib/routes";

const ALUMNI_ROLES = ["alumni", "master_admin", "super_admin"];

export function AlumniShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase allowedRoles={ALUMNI_ROLES} navItems={alumniNavItems} useModuleAccessGuard>
      {children}
    </AppShellBase>
  );
}
