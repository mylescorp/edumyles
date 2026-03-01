"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { MobileNav } from "./MobileNav";
import type { NavItem } from "@/lib/routes";

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  installedModules?: string[];
}

export function AppShell({ children, navItems, installedModules }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar navItems={navItems} installedModules={installedModules} />
      </div>

      {/* Main content area */}
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
