"use client";

import { AppShell } from "@/components/layout/AppShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { adminNavItems } from "@/lib/routes";
import { useTenant } from "@/hooks/useTenant";

const ADMIN_ROLES = [
  "master_admin",
  "super_admin",
  "school_admin",
  "principal",
  "bursar",
  "hr_manager",
  "librarian",
  "transport_manager",
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { installedModules } = useTenant();

  return (
    <RoleGuard allowedRoles={ADMIN_ROLES}>
      <AppShell navItems={adminNavItems} installedModules={installedModules}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
