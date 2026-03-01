"use client";

import { AppShell } from "@/components/layout/AppShell";
import { adminNavItems } from "@/lib/routes";
import { useTenant } from "@/hooks/useTenant";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { installedModules } = useTenant();

  return (
    <AppShell navItems={adminNavItems} installedModules={installedModules}>
      {children}
    </AppShell>
  );
}
