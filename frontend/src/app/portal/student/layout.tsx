"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { ModuleAccessGuard } from "@/components/shared/ModuleAccessGuard";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { studentNavItems } from "@/lib/routes";

const STUDENT_ROLES = ["student", "master_admin", "super_admin"];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={STUDENT_ROLES}>
        <GlobalShell navItems={studentNavItems}>
          <ModuleAccessGuard fallbackHref="/admin/modules">
            <div className="p-4 md:p-6"><div className="mx-auto max-w-[1400px]">{children}</div></div>
          </ModuleAccessGuard>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
