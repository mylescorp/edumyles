"use client";

import { ReactNode } from "react";
import { GlobalShell } from "@/components/layout/GlobalShell";
import type { NavItem } from "@/lib/routes";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  isImpersonating?: boolean;
  navItems?: NavItem[];
  installedModules?: string[];
}

export function DashboardLayout({
  children,
  navItems = [],
}: DashboardLayoutProps) {
  return (
    <GlobalShell navItems={navItems}>{children}</GlobalShell>
  );
}
