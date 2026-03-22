"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { teacherNavItems } from "@/lib/routes";

const TEACHER_ROLES = ["teacher", "master_admin", "super_admin", "school_admin", "principal"];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={TEACHER_ROLES}>
        <GlobalShell navItems={teacherNavItems}>
          <div className="p-4 md:p-6">{children}</div>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
