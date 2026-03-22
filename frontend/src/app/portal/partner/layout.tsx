"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { partnerNavItems } from "@/lib/routes";

const PARTNER_ROLES = ["partner", "master_admin", "super_admin", "school_admin"];

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={PARTNER_ROLES}>
        <GlobalShell navItems={partnerNavItems}>
          <div className="p-4 md:p-6">{children}</div>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
