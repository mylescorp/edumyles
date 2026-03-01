"use client";

import { AppShell } from "@/components/layout/AppShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { platformNavItems } from "@/lib/routes";

const PLATFORM_ROLES = ["master_admin", "super_admin"];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={PLATFORM_ROLES}>
      <AppShell navItems={platformNavItems}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
