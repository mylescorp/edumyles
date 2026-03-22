"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { adminNavItems } from "@/lib/routes";

const ADMIN_ROLES = ["school_admin", "principal", "master_admin", "super_admin"];

export default function PortalAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={ADMIN_ROLES}>
        <GlobalShell navItems={adminNavItems}>
          <div className="p-4 md:p-6">
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </div>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
