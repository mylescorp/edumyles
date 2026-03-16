"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { useState } from "react";
import { useEffect } from "react";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { AdminBottomBar } from "@/components/admin/AdminBottomBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopModuleBar } from "@/components/admin/TopModuleBar";
import { adminNavItems } from "@/lib/routes";
import { useTenant } from "@/hooks/useTenant";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { installedModules } = useTenant();

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  // Add body class to ensure CSS overrides work
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 relative z-[500] admin-layout">
      {/* Top Navigation */}
      <AdminTopNav />
      
      {/* Top Module Bar */}
      <TopModuleBar />
      
      <div className="flex min-h-[calc(100vh-8rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar navItems={adminNavItems} installedModules={installedModules} />
        </div>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <Sidebar
            navItems={adminNavItems}
            installedModules={installedModules}
            isMobile={true}
            onClose={handleMobileMenuClose}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 bg-white p-4 md:p-6 pb-20">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>

      {/* Bottom Bar */}
      <AdminBottomBar />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ConvexAuthProvider>
  );
}
