"use client";

import { AppShell } from "@/components/layout/AppShell";
import { studentNavItems } from "@/lib/routes";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={studentNavItems}>
      {children}
    </AppShell>
  );
}
