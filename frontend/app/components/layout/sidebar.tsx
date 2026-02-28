"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <p className="text-blue-400 font-bold text-lg">EduMyles</p>
        <p className="text-gray-400 text-xs mt-1 truncate">{schoolName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">Admin</p>
            <p className="text-xs text-gray-400 truncate capitalize">{role.replace("_", " ")}</p>
          </div>
          <Link href="/auth/logout" className="text-gray-400 hover:text-red-400 text-xs">
            Exit
          </Link>
        </div>
      </div>
    </aside>
  );
}
