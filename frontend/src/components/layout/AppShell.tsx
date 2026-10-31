"use client";

import { GlobalShell } from "@/components/layout/GlobalShell";
import type { NavItem } from "@/lib/routes";

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  installedModules?: string[];
}

export function AppShell({ children, navItems }: AppShellProps) {
  return (
    <GlobalShell navItems={navItems}>{children}</GlobalShell>
  );
}

export default AppShell;
