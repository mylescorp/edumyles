"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { alumniNavItems } from "@/lib/routes";

const ALUMNI_ROLES = ["alumni", "master_admin", "super_admin", "school_admin"];

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={ALUMNI_ROLES}>
        <GlobalShell navItems={alumniNavItems}>
          <div className="p-4 md:p-6">{children}</div>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
