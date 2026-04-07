"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "All Users", href: "/platform/users" },
  { label: "Invite Staff", href: "/platform/users/invite" },
  { label: "Roles", href: "/platform/users/roles" },
  { label: "Impersonation", href: "/platform/impersonation" },
  { label: "Staff Performance", href: "/platform/staff-performance" },
];

function isActive(pathname: string, href: string) {
  if (href === "/platform/users") {
    return pathname === href || pathname.startsWith("/platform/users/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UsersAdminRail() {
  const pathname = usePathname();

  return (
    <div className="flex items-center">
      <div className="flex w-fit max-w-full flex-wrap items-center gap-2 rounded-2xl border border-emerald-500/20 bg-white/90 p-2 shadow-sm backdrop-blur-sm">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                  : "border-emerald-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
