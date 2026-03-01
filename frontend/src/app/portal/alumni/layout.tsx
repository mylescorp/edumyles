"use client";

import { AppShell } from "@/components/layout/AppShell";
import { alumniNavItems } from "@/lib/routes";

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={alumniNavItems}>
      {children}
    </AppShell>
  );
}
