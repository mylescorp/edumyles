"use client";

import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ImpersonationBanner } from "./ImpersonationBanner";
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
  title,
  subtitle,
  isImpersonating = false,
  navItems = [],
  installedModules = [],
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar navItems={navItems} installedModules={installedModules} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ImpersonationBanner />
        <div className="flex items-center md:hidden">
          <MobileNav navItems={navItems} installedModules={installedModules} />
        </div>
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}
