"use client";

import { AppShell } from "@/components/layout/AppShell";
import { platformNavItems } from "@/lib/routes";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={platformNavItems}>
      {children}
    </AppShell>
  );
}
