"use client";

import { ReactNode } from "react";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { affiliateNavItems } from "@/lib/routes";

const AFFILIATE_ROLES = ["affiliate", "master_admin", "super_admin"];

export function AffiliateShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase allowedRoles={AFFILIATE_ROLES} navItems={affiliateNavItems}>
      {children}
    </AppShellBase>
  );
}
