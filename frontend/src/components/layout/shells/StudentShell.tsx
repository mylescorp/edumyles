"use client";

import { ReactNode } from "react";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { studentNavItems } from "@/lib/routes";

const STUDENT_ROLES = ["student", "master_admin", "super_admin"];

export function StudentShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase allowedRoles={STUDENT_ROLES} navItems={studentNavItems} useModuleAccessGuard>
      {children}
    </AppShellBase>
  );
}
