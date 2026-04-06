"use client";

import { ReactNode } from "react";
import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { ModuleAccessGuard } from "@/components/shared/ModuleAccessGuard";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { teacherNavItems } from "@/lib/routes";

const TEACHER_ROLES = ["teacher", "master_admin", "super_admin"];

export function TeacherShell({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={TEACHER_ROLES}>
        <GlobalShell navItems={teacherNavItems}>
          <ModuleAccessGuard fallbackHref="/admin/modules">
            <div className="p-4 md:p-6">
              <div className="mx-auto max-w-[1400px]">{children}</div>
            </div>
          </ModuleAccessGuard>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
