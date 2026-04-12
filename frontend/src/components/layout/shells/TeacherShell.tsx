"use client";

import { ReactNode } from "react";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { teacherNavItems } from "@/lib/routes";

const TEACHER_ROLES = ["teacher", "master_admin", "super_admin"];

export function TeacherShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase allowedRoles={TEACHER_ROLES} navItems={teacherNavItems} useModuleAccessGuard>
      {children}
    </AppShellBase>
  );
}
