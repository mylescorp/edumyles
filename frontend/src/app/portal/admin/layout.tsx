"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { ModuleAccessGuard } from "@/components/shared/ModuleAccessGuard";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { adminNavItems } from "@/lib/routes";

const ADMIN_ROLES = ["school_admin", "principal", "master_admin", "super_admin"];

export default function PortalAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={ADMIN_ROLES}>
        <GlobalShell navItems={adminNavItems}>
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
