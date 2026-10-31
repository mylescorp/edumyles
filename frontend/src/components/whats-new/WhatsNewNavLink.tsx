"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

function getWhatNewHref(pathname: string) {
  if (pathname.startsWith("/platform")) return "/platform/whats-new";
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "portal" && segments[1]) return `/portal/${segments[1]}/whats-new`;
  return "/admin/whats-new";
}

export function WhatsNewNavLink({
  collapsed = false,
  mobile = false,
  onClick,
}: {
  collapsed?: boolean;
  mobile?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname() ?? "/admin";
  const href = getWhatNewHref(pathname);
  const { sessionToken } = useAuth();
  const summary = useQuery(
    api.platform.changelog.queries.getWhatsNewUnreadCount,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );
  const unreadCount = summary ?? 0;
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={cn("border-t border-[var(--sidebar-border)]", mobile ? "px-3 py-3" : "p-2")}>
      <Link
        href={href}
        onClick={onClick}
        aria-label={`What’s new${unreadCount ? `, ${unreadCount} unread updates` : ""}`}
        title={collapsed ? "What’s new" : undefined}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          collapsed && "justify-center",
          active
            ? "bg-[var(--sidebar-accent-hover)] text-white"
            : "text-[var(--sidebar-text)] hover:bg-white/8 hover:text-white"
        )}
      >
        <Sparkles className="h-[18px] w-[18px] flex-none text-[var(--platform-highlight)]" />
        {!collapsed && <span className="min-w-0 flex-1">What’s new</span>}
        {unreadCount > 0 && (
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--platform-highlight)] px-1.5 text-[10px] font-bold text-[var(--platform-chrome)]"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    </div>
  );
}
