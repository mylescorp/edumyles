"use client";

import { AppShell } from "@/components/layout/AppShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { parentNavItems } from "@/lib/routes";

const PARENT_ROLES = [
  "parent",
  "master_admin",
  "super_admin",
  "school_admin",
  "principal",
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={PARENT_ROLES}>
      <AppShell navItems={parentNavItems}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
