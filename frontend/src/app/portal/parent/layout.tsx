"use client";

import { AppShell } from "@/components/layout/AppShell";
import { parentNavItems } from "@/lib/routes";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={parentNavItems}>
      {children}
    </AppShell>
  );
}
