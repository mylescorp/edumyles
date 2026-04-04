"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { ModuleAccessGuard } from "@/components/shared/ModuleAccessGuard";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { alumniNavItems } from "@/lib/routes";

const ALUMNI_ROLES = ["alumni"];

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={ALUMNI_ROLES}>
        <GlobalShell navItems={alumniNavItems}>
          <ModuleAccessGuard fallbackHref="/admin/modules">
            <div className="p-4 md:p-6"><div className="mx-auto max-w-[1400px]">{children}</div></div>
          </ModuleAccessGuard>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
