"use client";

import { ReactNode } from "react";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { partnerNavItems } from "@/lib/routes";

const PARTNER_ROLES = ["partner", "master_admin", "super_admin"];

export function PartnerShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase allowedRoles={PARTNER_ROLES} navItems={partnerNavItems} useModuleAccessGuard>
      {children}
    </AppShellBase>
  );
}
