"use client";

import { AppShell } from "@/components/layout/AppShell";
import { partnerNavItems } from "@/lib/routes";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={partnerNavItems}>
      {children}
    </AppShell>
  );
}
