"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { parentNavItems } from "@/lib/routes";

const PARENT_ROLES = ["parent", "master_admin", "super_admin", "school_admin", "principal"];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={PARENT_ROLES}>
        <GlobalShell navItems={parentNavItems}>
          <div className="p-4 md:p-6">{children}</div>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
