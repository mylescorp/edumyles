"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { ModuleAccessGuard } from "@/components/shared/ModuleAccessGuard";
import { adminNavItems } from "@/lib/routes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <GlobalShell navItems={adminNavItems}>
        <ModuleAccessGuard fallbackHref="/admin/modules">
          <div className="p-4 md:p-6">
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </div>
        </ModuleAccessGuard>
      </GlobalShell>
    </ConvexAuthProvider>
  );
}
