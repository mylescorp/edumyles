"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { adminNavItems } from "@/lib/routes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <GlobalShell navItems={adminNavItems}>
        <div className="p-4 md:p-6">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </div>
      </GlobalShell>
    </ConvexAuthProvider>
  );
}
