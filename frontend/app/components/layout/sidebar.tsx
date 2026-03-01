"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const MASTER_ADMIN_NAV: NavItem[] = [
  { label: "Platform Control", href: "/platform", icon: "⚙️" },
  { label: "All Schools", href: "/platform/schools", icon: "🏫" },
  { label: "Audit Logs", href: "/platform/audit", icon: "📋" },
  { label: "Billing", href: "/platform/billing", icon: "💳" },
];

const SCHOOL_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "🏠" },
  { label: "Students", href: "/admin/students", icon: "👨‍🎓" },
  { label: "Staff", href: "/admin/staff", icon: "👨‍🏫" },
  { label: "Finance", href: "/admin/finance", icon: "💰" },
  { label: "Academics", href: "/admin/academics", icon: "📚" },
  { label: "Timetable", href: "/admin/timetable", icon: "🗓️" },
  { label: "Library", href: "/admin/library", icon: "📖" },
  { label: "Transport", href: "/admin/transport", icon: "🚌" },
  { label: "Communications", href: "/admin/communications", icon: "📢" },
  { label: "eWallet", href: "/admin/wallet", icon: "👛" },
  { label: "Settings", href: "/admin/settings", icon: "⚙️" },
];

interface SidebarProps {
  role?: string;
  schoolName?: string;
}

export function Sidebar({ role = "school_admin", schoolName = "EduMyles" }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "master_admin" ? MASTER_ADMIN_NAV : SCHOOL_ADMIN_NAV;
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-forest-700/50 flex items-center justify-between">
        <div>
          <p className="text-amber-500 font-bold text-lg tracking-tight">EduMyles</p>
          <p className="text-forest-200/60 text-xs mt-1 truncate">{schoolName}</p>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-forest-200/60 hover:text-white transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-forest-500 text-white shadow-sm"
                  : "text-forest-100/70 hover:bg-forest-700/50 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-forest-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-forest-500 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">Admin</p>
            <p className="text-xs text-forest-200/50 truncate capitalize">{role.replace("_", " ")}</p>
          </div>
          <Link href="/auth/logout" className="text-forest-200/50 hover:text-crimson-400 text-xs transition-colors">
            Exit
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-forest-800 text-white p-2 rounded-lg shadow-lg"
        aria-label="Open sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-out sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-forest-800 flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-forest-800 flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
