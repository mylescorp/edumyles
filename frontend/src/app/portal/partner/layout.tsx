"use client";

import { AppShell } from "@/components/layout/AppShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { partnerNavItems } from "@/lib/routes";

const PARTNER_ROLES = [
  "partner",
  "master_admin",
  "super_admin",
  "school_admin",
];

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={PARTNER_ROLES}>
      <AppShell navItems={partnerNavItems}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
