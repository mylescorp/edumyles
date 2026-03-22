"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { studentNavItems } from "@/lib/routes";

const STUDENT_ROLES = ["student", "master_admin", "super_admin", "school_admin", "principal", "teacher"];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <RoleGuard allowedRoles={STUDENT_ROLES}>
        <GlobalShell navItems={studentNavItems}>
          <div className="p-4 md:p-6">{children}</div>
        </GlobalShell>
      </RoleGuard>
    </ConvexAuthProvider>
  );
}
