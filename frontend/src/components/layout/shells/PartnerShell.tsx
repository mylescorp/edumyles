"use client";

import { ReactNode } from "react";
import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { ModuleAccessGuard } from "@/components/shared/ModuleAccessGuard";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { partnerNavItems } from "@/lib/routes";

const PARTNER_ROLES = ["partner", "master_admin", "super_admin"];

export function PartnerShell({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={PARTNER_ROLES}>
        <GlobalShell navItems={partnerNavItems}>
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
