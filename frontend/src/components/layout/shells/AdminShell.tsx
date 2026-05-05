"use client";

import { ReactNode } from "react";
import { TrialBanner } from "@/components/admin/TrialBanner";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { adminNavItems } from "@/lib/routes";

const ADMIN_ROLES = [
  "school_admin",
  "principal",
  "bursar",
  "hr_manager",
  "librarian",
  "transport_manager",
  "master_admin",
  "super_admin",
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase
      allowedRoles={ADMIN_ROLES}
      navItems={adminNavItems}
      useModuleAccessGuard
      fallbackHref="/admin/modules"
    >
      <div className="space-y-4">
        <TrialBanner />
        {children}
      </div>
    </AppShellBase>
  );
}
