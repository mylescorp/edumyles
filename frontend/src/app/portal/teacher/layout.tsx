"use client";

import { AppShell } from "@/components/layout/AppShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { teacherNavItems } from "@/lib/routes";

const TEACHER_ROLES = [
  "teacher",
  "master_admin",
  "super_admin",
  "school_admin",
  "principal",
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={TEACHER_ROLES}>
      <AppShell navItems={teacherNavItems}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
