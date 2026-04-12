"use client";

import { ReactNode } from "react";
import { AppShellBase } from "@/components/layout/shells/AppShellBase";
import { platformNavItems } from "@/lib/routes";

const PLATFORM_ROLES = [
  "master_admin",
  "super_admin",
  "platform_manager",
  "support_agent",
  "billing_admin",
  "marketplace_reviewer",
  "content_moderator",
  "analytics_viewer",
];

export function PlatformShell({ children }: { children: ReactNode }) {
  return (
    <AppShellBase allowedRoles={PLATFORM_ROLES} navItems={platformNavItems}>
      {children}
    </AppShellBase>
  );
}
