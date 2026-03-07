"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { adminNavItems } from "@/lib/routes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMobileMenuToggle={handleMobileMenuToggle} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar navItems={adminNavItems} />
        </div>
        
        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <Sidebar 
            navItems={adminNavItems} 
            isMobile={true} 
            onClose={handleMobileMenuClose}
          />
        )}
        
        {/* Main Content */}
        <main className="flex-1 bg-muted/20 p-4 md:p-6">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
