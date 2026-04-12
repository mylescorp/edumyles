"use client";

import { ReactNode } from "react";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { resellerNavItems } from "@/lib/routes";

const RESELLER_ROLES = ["reseller", "master_admin", "super_admin"];

export function ResellerShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase allowedRoles={RESELLER_ROLES} navItems={resellerNavItems}>
      {children}
    </AppShellBase>
  );
}
