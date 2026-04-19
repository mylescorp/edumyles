"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { usePermissionBasedNavItems } from "@/hooks/usePermissionBasedNav";
import { getInitials, formatName } from "@/lib/formatters";
import { getRoleLabel } from "@/lib/routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Bell,
  Search,
  RefreshCw,
  LogOut,
  Settings,
  User,
  Menu,
  ChevronDown,
  X,
  HelpCircle,
  Zap,
  MessageCircle,
  Hash,
  Users2,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ArrowRight,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { ImpersonationBanner } from "./ImpersonationBanner";
import type { NavItem } from "@/lib/routes";

export interface NavGroup {
  label: string;
  href?: string;
  items?: { label: string; href: string }[];
}

function getNavGroups(navItems: NavItem[]): NavGroup[] {
  const groups: NavGroup[] = [];

  for (const item of navItems) {
    if (!item.section) {
      groups.push({ label: item.label, href: item.href });
      continue;
    }

    const existingGroup = groups.find(
      (group) => group.label === item.section && Array.isArray(group.items)
    );

    if (existingGroup?.items) {
      existingGroup.items.push({ label: item.label, href: item.href });
      continue;
    }

    groups.push({
      label: item.section,
      items: [{ label: item.label, href: item.href }],
    });
  }

  return groups;
}

// ─── Role label for workspace pill ───────────────────────────────────────────

function getRoleWorkspaceLabel(role: string, tenantName?: string): string {
  if (role === "master_admin" || role === "super_admin") return "Platform Admin";
  if (tenantName) return tenantName;
  return "My School";
}

function readClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

// ─── Dropdown nav group ───────────────────────────────────────────────────────

function NavGroupDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const isGroupActive = group.items?.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 whitespace-nowrap outline-none",
            isGroupActive
              ? "text-white bg-[var(--topnav-active-bg)]"
              : "text-white/70 hover:text-white hover:bg-white/8"
          )}
        >
          {group.label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          {isGroupActive && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[var(--em-gold)]" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-52 border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-white shadow-xl"
      >
        {group.items?.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 cursor-pointer rounded-md text-sm py-2 px-3",
                  isActive
                    ? "text-[var(--em-gold)] font-semibold bg-[var(--sidebar-accent)]"
                    : "text-white/80 hover:text-white hover:bg-white/8"
                )}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--em-gold)] flex-shrink-0" />
                )}
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Mobile drawer nav ────────────────────────────────────────────────────────

function MobileDrawer({
  groups,
  user,
  tenant,
  logout,
}: {
  groups: NavGroup[];
  user: any;
  tenant: any;
  logout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 p-0 flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]"
      >
        {/* Drawer header */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--sidebar-border)]">
          <Image
            src="/logo-icon.svg"
            alt="EduMyles"
            width={32}
            height={32}
            className="flex-shrink-0"
            priority
          />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--em-gold)" }}>
              EduMyles
            </p>
            <p className="text-xs" style={{ color: "var(--sidebar-text)" }}>
              {tenant?.name ?? "School Management"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 w-7 p-0 text-white/50 hover:text-white hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav items */}
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-0.5 p-3">
            {groups.map((group) => {
              if (group.href && !group.items?.length) {
                const isActive =
                  pathname === group.href ||
                  (group.href !== "/" && pathname.startsWith(group.href + "/"));
                return (
                  <Link
                    key={group.href}
                    href={group.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-[var(--sidebar-accent-hover)] text-[var(--em-gold)] border-l-2 border-[var(--em-gold)]"
                        : "text-white/70 hover:text-white hover:bg-white/8"
                    )}
                  >
                    {group.label}
                  </Link>
                );
              }
              const isGroupActive = group.items?.some(
                (item) => pathname === item.href || pathname.startsWith(item.href + "/")
              );
              return (
                <div key={group.label} className="mb-1">
                  <p
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold uppercase tracking-widest",
                      isGroupActive ? "text-[var(--em-gold)]" : "text-white/35"
                    )}
                  >
                    {group.label}
                  </p>
                  {group.items?.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ml-1",
                          isActive
                            ? "bg-[var(--sidebar-accent)] text-[var(--em-gold)] font-semibold border-l-2 border-[var(--em-gold)]"
                            : "text-white/65 hover:text-white hover:bg-white/8"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User footer */}
        <div className="border-t border-[var(--sidebar-border)] p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="text-xs bg-[var(--sidebar-accent)] text-[var(--em-gold)] font-bold border border-[var(--topnav-active-border)]">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {formatName(user?.firstName, user?.lastName) || user?.email}
              </p>
              <p className="text-xs text-[var(--em-sage-muted)]">
                {getRoleLabel(user?.role ?? "")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/40 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function GlobalSearch({
  navItems,
  pathname,
  notificationsHref,
  settingsHref,
  isPlatformRoute,
}: {
  navItems: NavItem[];
  pathname: string;
  notificationsHref: string;
  settingsHref: string;
  isPlatformRoute: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const quickLinks = useMemo(
    () => [
      {
        label: "Notifications",
        href: notificationsHref,
        description: "Open your latest alerts and updates.",
      },
      {
        label: "Settings",
        href: settingsHref,
        description: "Manage workspace and platform preferences.",
      },
      {
        label: isPlatformRoute ? "AI Support" : "Support Center",
        href: isPlatformRoute ? "/platform/ai-support" : "/support",
        description: "Get support, troubleshooting, and guided help.",
      },
    ],
    [isPlatformRoute, notificationsHref, settingsHref]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredNavItems = useMemo(() => {
    const source = navItems.filter((item) => item.href !== pathname);
    if (!normalizedQuery) return source.slice(0, 8);
    return source
      .filter((item) => {
        const haystack = `${item.label} ${item.section ?? ""} ${item.href}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [navItems, normalizedQuery, pathname]);

  const filteredQuickLinks = useMemo(() => {
    if (!normalizedQuery) return quickLinks;
    return quickLinks.filter((item) =>
      `${item.label} ${item.description} ${item.href}`.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, quickLinks]);

  const handleNavigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex h-8 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm text-white/70 transition-all duration-150 hover:border-[var(--topnav-active-border)] hover:bg-white/[0.09] hover:text-white">
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:block text-xs">Search</span>
          <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] sm:block">
            Ctrl K
          </kbd>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-[380px] border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-0 text-white shadow-2xl"
      >
        <div className="border-b border-[var(--sidebar-border)] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">
            <Search className="h-4 w-4 text-[var(--em-gold)]" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages, tools, and actions"
              className="border-0 bg-transparent px-0 text-sm text-white placeholder:text-white/35 focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-3">
          <div className="space-y-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Navigate
            </p>
            {filteredNavItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-white/45">
                No matching pages found.
              </div>
            ) : (
              filteredNavItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className="flex w-full items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition-all hover:bg-white/[0.07] hover:text-white"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="truncate text-xs text-white/45">
                      {item.section ? `${item.section} • ` : ""}
                      {item.href}
                    </p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                </button>
              ))
            )}
          </div>

          <div className="mt-4 space-y-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Quick Links
            </p>
            {filteredQuickLinks.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition-all hover:bg-white/[0.07] hover:text-white"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-white/45">{item.description}</p>
                </div>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationsMenu({
  notifications,
  unreadCount,
  notificationsHref,
  markAsRead,
  markAllAsRead,
}: {
  notifications: Array<any>;
  unreadCount: number;
  notificationsHref: string;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}) {
  const preview = notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-all duration-150 hover:bg-white/[0.09] hover:text-white"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--topnav-bg)] bg-red-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-[380px] border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-0 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--sidebar-border)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Notifications</p>
            <p className="text-xs text-white/45">{unreadCount} unread items</p>
          </div>
          {unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/70 transition-all hover:bg-white/[0.09] hover:text-white"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-[360px] overflow-y-auto p-3">
          {preview.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-white/45">
              You are all caught up.
            </div>
          ) : (
            <div className="space-y-2">
              {preview.map((notification) => {
                const href = notification.link || notificationsHref;
                return (
                  <Link
                    key={String(notification._id)}
                    href={href}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(String(notification._id));
                      }
                    }}
                    className="block rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 transition-all hover:bg-white/[0.07]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {notification.title ?? "Platform update"}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-white/45">
                          {notification.message ?? "Open to view more details."}
                        </p>
                      </div>
                      {!notification.read ? (
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--sidebar-border)] p-3">
          <Link
            href={notificationsHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75 transition-all hover:bg-white/[0.09] hover:text-white"
          >
            View all notifications
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HelpMenu({
  helpHref,
  knowledgeHref,
  aiSupportHref,
}: {
  helpHref: string;
  knowledgeHref: string;
  aiSupportHref: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-all duration-150 hover:bg-white/[0.09] hover:text-white"
          title="Help & support"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-[280px] border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-3 text-white shadow-2xl"
      >
        <div className="mb-2">
          <p className="text-sm font-semibold">Help & Support</p>
          <p className="text-xs text-white/45">Get help, documentation, and guided assistance.</p>
        </div>
        <div className="space-y-2">
          <Link
            href={helpHref}
            className="block rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 transition-all hover:bg-white/[0.07]"
          >
            <p className="text-sm font-medium text-white">Support tickets</p>
            <p className="text-xs text-white/45">Open or review support requests.</p>
          </Link>
          <Link
            href={knowledgeHref}
            className="block rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 transition-all hover:bg-white/[0.07]"
          >
            <p className="text-sm font-medium text-white">Knowledge base</p>
            <p className="text-xs text-white/45">Browse guides, docs, and platform answers.</p>
          </Link>
          <Link
            href={aiSupportHref}
            className="block rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 transition-all hover:bg-white/[0.07]"
          >
            <p className="text-sm font-medium text-white">AI support</p>
            <p className="text-xs text-white/45">Launch the guided troubleshooting workspace.</p>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Icon button helper ───────────────────────────────────────────────────────

function TopNavIconBtn({
  onClick,
  title,
  children,
  href,
  badge,
  className,
}: {
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  href?: string;
  badge?: number;
  className?: string;
}) {
  const cls = cn(
    "relative h-8 w-8 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--em-gold)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--topnav-bg)]",
    className
  );

  const inner = (
    <>
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-[var(--topnav-bg)]">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls} title={title}>
        {inner}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls} title={title}>
      {inner}
    </button>
  );
}

// ─── Main GlobalShell ─────────────────────────────────────────────────────────

interface GlobalShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────

function LeftSidebar({
  navItems,
  collapsed,
  onToggle,
}: {
  navItems: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const groupedNavItems = useMemo(() => {
    const grouped = navItems.reduce<Array<{ section: string; items: NavItem[] }>>((acc, item) => {
      const section = item.section ?? "__standalone__";
      const existingGroup = acc.find((group) => group.section === section);

      if (existingGroup) {
        existingGroup.items.push(item);
        return acc;
      }

      acc.push({ section, items: [item] });
      return acc;
    }, []);

    return grouped;
  }, [navItems]);

  const activeSection = useMemo(() => {
    const activeGroup = groupedNavItems.find((group) =>
      group.items.some(
        (item) =>
          pathname === item.href || (item.href.length > 1 && pathname?.startsWith(item.href + "/"))
      )
    );
    return activeGroup?.section ?? groupedNavItems[0]?.section ?? "__standalone__";
  }, [groupedNavItems, pathname]);

  const isExpanded = (section: string) => {
    if (collapsed) return true;
    if (expandedSections[section] !== undefined) {
      return expandedSections[section];
    }
    return true;
  };

  const toggleSection = (section: string) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !isExpanded(section),
    }));
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className="hidden md:flex flex-col flex-shrink-0 border-r transition-all duration-200 overflow-hidden"
        style={{
          width: collapsed ? 60 : 286,
          background: "var(--sidebar-bg)",
          borderColor: "var(--sidebar-border)",
        }}
      >
        {/* Scrollable nav items */}
        <ScrollArea className="flex-1 overflow-hidden">
          <nav className="flex flex-col gap-4 p-3">
            {groupedNavItems.map((group, index) => (
              <div
                key={group.section}
                className={cn("space-y-2", index > 0 && "border-t pt-4")}
                style={index > 0 ? { borderColor: "var(--sidebar-border)" } : undefined}
              >
                {!collapsed && group.section !== "__standalone__" ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.section)}
                    className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors hover:bg-white/6"
                    style={{
                      borderColor:
                        group.section === activeSection
                          ? "var(--topnav-active-border)"
                          : "rgba(255,255,255,0.06)",
                      background:
                        group.section === activeSection
                          ? "rgba(217, 119, 6, 0.08)"
                          : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--sidebar-text)]">
                        {group.section}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-white/70 transition-transform duration-200",
                        isExpanded(group.section) && "rotate-90"
                      )}
                    />
                  </button>
                ) : group.section !== "__standalone__" ? (
                  <div className="mx-auto h-px w-8 bg-white/10" />
                ) : null}

                {isExpanded(group.section) &&
                  group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href.length > 1 && pathname?.startsWith(item.href + "/"));
                    const Icon = item.icon;

                    const navBtn = (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 min-w-0",
                          collapsed ? "justify-center" : "",
                          isActive
                            ? "bg-[var(--sidebar-accent-hover)] text-white shadow-sm ring-1 ring-[var(--topnav-active-border)]"
                            : "text-[var(--sidebar-text)] hover:text-white hover:bg-white/8"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] flex-shrink-0",
                            isActive
                              ? "text-[var(--em-gold)]"
                              : "text-white/50 group-hover:text-[var(--em-gold)]"
                          )}
                        />
                        {!collapsed && (
                          <div className="min-w-0 flex-1">
                            <span className="block truncate leading-none">{item.label}</span>
                          </div>
                        )}
                        {!collapsed && isActive && (
                          <span className="h-2 w-2 rounded-full bg-[var(--em-gold)]" />
                        )}
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{navBtn}</TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-xs text-white"
                          >
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">
                                {group.section === "__standalone__" ? "Navigation" : group.section}
                              </p>
                              <p>{item.label}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return navBtn;
                  })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Collapse toggle */}
        <div className="border-t p-2" style={{ borderColor: "var(--sidebar-border)" }}>
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs text-white/55 hover:text-[var(--em-gold)] hover:bg-white/8 transition-all duration-150",
              collapsed ? "justify-center" : ""
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

// ─── Main GlobalShell ─────────────────────────────────────────────────────────

export function GlobalShell({ children, navItems }: GlobalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout, sessionToken } = useAuth();
  const { tenant } = useTenant();
  const { isModuleInstalled } = useInstalledModules();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [footerPanel, setFooterPanel] = useState<"chats" | "channels" | "contacts" | null>(null);
  const [healthRefreshNonce, setHealthRefreshNonce] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toggleFooterPanel = (panel: "chats" | "channels" | "contacts") =>
    setFooterPanel((prev) => (prev === panel ? null : panel));
  const coreModuleIds = ["sis", "communications", "users"];
  const isPlatformRoute = pathname?.startsWith("/platform");

  // Use permission-based navigation for platform routes
  const permissionBasedNavItems = usePermissionBasedNavItems();

  useEffect(() => {
    if (!isPlatformRoute) return;

    const interval = window.setInterval(() => {
      setHealthRefreshNonce((current) => current + 1);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [isPlatformRoute]);

  const shellHealth = useQuery(
    api.modules.platform.ops.getPlatformShellStatus,
    {
      sessionToken: sessionToken ?? "",
      refreshNonce: healthRefreshNonce,
    },
    isPlatformRoute && !!sessionToken
  );

  // For platform routes, use permission-based navigation; for others, use original navItems
  const visibleNavItems = isPlatformRoute
    ? permissionBasedNavItems
    : navItems.filter((item) => {
        if (!item.module) return true;
        if (coreModuleIds.includes(item.module)) return true;
        if (!isModuleInstalled(item.module)) return false;
        return true;
      });

  const anyUser = user as any;
  const displayName = formatName(anyUser?.firstName, anyUser?.lastName);
  const initials = getInitials(anyUser?.firstName, anyUser?.lastName);
  const groups = getNavGroups(visibleNavItems);
  const workspaceLabel = getRoleWorkspaceLabel(role ?? "", tenant?.name);
  const isAdminWorkspaceMode = false;
  const adminWorkspaceTenants: Array<{ tenantId: string; name: string; subdomain?: string }> = [];
  const adminWorkspaceTenantId = "";
  const isSwitchingTenant = false;
  const handleAdminWorkspaceTenantSwitch = (_tenantId: string) => {};

  // Derive notification / profile hrefs from current section
  const sectionHref = (suffix: string) => {
    if (pathname?.startsWith("/platform")) return `/platform/${suffix}`;
    if (pathname?.startsWith("/portal/student")) return `/portal/student/${suffix}`;
    if (pathname?.startsWith("/portal/teacher")) return `/portal/teacher/${suffix}`;
    if (pathname?.startsWith("/portal/parent")) return `/portal/parent/${suffix}`;
    if (pathname?.startsWith("/portal/alumni")) return `/portal/alumni/${suffix}`;
    if (pathname?.startsWith("/portal/partner")) return `/portal/partner/${suffix}`;
    return `/admin/${suffix}`;
  };

  const notificationsHref = sectionHref("notifications");
  const profileHref = sectionHref("profile");
  const settingsHref = pathname?.startsWith("/platform") ? "/platform/settings" : "/admin/settings";
  const supportHref = pathname?.startsWith("/platform")
    ? "/platform/support"
    : sectionHref("tickets");
  const knowledgeHref = pathname?.startsWith("/platform") ? "/platform/knowledge-base" : "/support";
  const aiSupportHref = pathname?.startsWith("/platform") ? "/platform/ai-support" : "/support";
  const shellHealthTone =
    shellHealth?.status === "healthy"
      ? "bg-emerald-500"
      : shellHealth?.status === "watch"
        ? "bg-amber-500"
        : "bg-rose-500";
  const shellHealthLabel =
    shellHealth?.status === "healthy"
      ? "Platform healthy"
      : shellHealth?.status === "watch"
        ? "Platform needs attention"
        : "Platform critical";
  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    window.setTimeout(() => setIsRefreshing(false), 900);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="flex h-screen flex-col overflow-hidden"
        style={{ background: "var(--em-off-white)" }}
      >
        {/* ══ Top navigation bar — platform shell ══════════ */}
        <header
          className="flex-shrink-0 z-[2000]"
          style={{ background: "var(--topnav-bg)", borderBottom: "1px solid var(--topnav-border)" }}
        >
          <div className="flex min-h-[60px] items-center gap-2 px-3 md:px-4">
            {/* Mobile menu */}
            <div className="flex md:hidden">
              <MobileDrawer groups={groups} user={anyUser} tenant={tenant} logout={logout} />
            </div>

            {/* ── Logo mark (Zoho-style: "E" monogram + name) ── */}
            <Link
              href={
                role === "master_admin" || role === "super_admin"
                  ? "/platform"
                  : role === "school_admin" || role === "principal"
                    ? "/admin"
                    : "/"
              }
              className="flex items-center gap-2 shrink-0 mr-1"
            >
              <Image
                src="/logo-icon.svg"
                alt="EduMyles"
                width={28}
                height={28}
                className="flex-shrink-0"
                priority
              />
              <span
                className="hidden sm:block text-sm font-bold tracking-tight"
                style={{ color: "var(--em-gold)" }}
              >
                EduMyles
              </span>
            </Link>

            {/* ── Workspace / school selector pill (like Zoho "Personal ▾") ── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-1 rounded-md border border-white/12 bg-white/6 px-2.5 h-[28px] text-xs font-medium text-white/75 hover:text-white hover:bg-white/10 hover:border-[var(--topnav-active-border)] transition-all duration-150 mr-1 max-w-[160px]">
                  <span className="truncate">{workspaceLabel}</span>
                  <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-white shadow-xl"
              >
                <DropdownMenuLabel className="text-[var(--em-sage-muted)] text-xs font-bold uppercase tracking-wider">
                  Workspace
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[var(--sidebar-accent)]" />
                <DropdownMenuItem className="text-white/80 hover:text-white hover:bg-white/8 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--em-gold)]" />
                    <span className="font-medium">{workspaceLabel}</span>
                  </div>
                </DropdownMenuItem>
                {isAdminWorkspaceMode && adminWorkspaceTenants.length > 0 ? (
                  <>
                    <DropdownMenuSeparator className="bg-[var(--sidebar-accent)]" />
                    <DropdownMenuLabel className="text-[var(--em-sage-muted)] text-[10px] font-bold uppercase tracking-wider">
                      Master Admin Test Tenant
                    </DropdownMenuLabel>
                    {adminWorkspaceTenants.slice(0, 12).map((tenantOption) => {
                      const isActiveTenant = tenantOption.tenantId === adminWorkspaceTenantId;

                      return (
                        <DropdownMenuItem
                          key={tenantOption.tenantId}
                          onClick={() => handleAdminWorkspaceTenantSwitch(tenantOption.tenantId)}
                          className="cursor-pointer text-white/80 hover:bg-white/8 hover:text-white"
                          disabled={isSwitchingTenant}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full",
                                isActiveTenant ? "bg-[var(--em-gold)]" : "bg-white/20"
                              )}
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{tenantOption.name}</div>
                              <div className="truncate text-[11px] text-white/45">
                                {tenantOption.subdomain || tenantOption.tenantId}
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator className="bg-[var(--sidebar-accent)]" />
                    <DropdownMenuItem asChild className="cursor-pointer text-white/80 hover:bg-white/8 hover:text-white">
                      <Link href="/platform/tenants">Open tenant manager</Link>
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            {isPlatformRoute ? (
              <div className="hidden min-w-0 flex-1 items-center justify-between gap-4 px-2 lg:flex">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      Master Admin Command Center
                    </p>
                    <Badge className="h-5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 text-[10px] font-semibold text-emerald-300 shadow-none">
                      Live
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <div className="flex items-center gap-2 text-[11px] text-white/55">
                      <span className={cn("h-2.5 w-2.5 rounded-full", shellHealthTone)} />
                      <span className="uppercase tracking-[0.18em]">Platform status</span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-white/85">
                      <span className="font-semibold">{shellHealthLabel}</span>
                      <span>{shellHealth?.responseTime ?? 0}ms avg</span>
                      <span>{shellHealth?.errorRate?.toFixed?.(1) ?? "0.0"}% errors</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Queue</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-white/80">
                      <span>{shellHealth?.pendingReviews ?? 0} reviews</span>
                      <span>{shellHealth?.activeFlags ?? 0} flags</span>
                      <span>{unreadCount ?? 0} unread</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="hidden md:block w-px h-5 bg-white/10 mx-0.5" />
                <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none mx-1">
                  {groups.map((group) => {
                    if (group.href && !group.items?.length) {
                      const isActive =
                        pathname === group.href ||
                        (group.href.length > 1 && pathname.startsWith(group.href + "/"));
                      return (
                        <Link
                          key={group.href}
                          href={group.href}
                          className={cn(
                            "relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 whitespace-nowrap",
                            isActive
                              ? "text-white bg-[var(--topnav-active-bg)]"
                              : "text-white/56 hover:text-white/88 hover:bg-white/8"
                          )}
                        >
                          {group.label}
                          {isActive && (
                            <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[var(--em-gold)]" />
                          )}
                        </Link>
                      );
                    }
                    return (
                      <NavGroupDropdown key={group.label} group={group} pathname={pathname ?? ""} />
                    );
                  })}
                </nav>
              </>
            )}

            {/* ── Right controls ── */}
            <div className="ml-auto flex items-center gap-1.5">
              <GlobalSearch
                navItems={visibleNavItems}
                pathname={pathname ?? ""}
                notificationsHref={notificationsHref}
                settingsHref={settingsHref}
                isPlatformRoute={!!isPlatformRoute}
              />

              <TopNavIconBtn
                onClick={handleRefresh}
                title="Refresh"
                className={cn(isPlatformRoute && "border border-white/10 bg-white/[0.04]")}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </TopNavIconBtn>

              <NotificationsMenu
                notifications={notifications}
                unreadCount={unreadCount}
                notificationsHref={notificationsHref}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
              />

              {isPlatformRoute && (
                <TopNavIconBtn
                  href={settingsHref}
                  title="Platform settings"
                  className="border border-white/10 bg-white/[0.04]"
                >
                  <Settings className="h-4 w-4" />
                </TopNavIconBtn>
              )}

              <HelpMenu
                helpHref={supportHref}
                knowledgeHref={knowledgeHref}
                aiSupportHref={aiSupportHref}
              />

              {/* Divider */}
              <div className="mx-0.5 h-6 w-px bg-white/10" />

              {/* ── User dropdown ── */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-0.5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] pl-1.5 pr-2.5 py-1.5 text-white transition-all duration-150 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--em-gold)]">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={anyUser?.avatarUrl ?? undefined} alt={displayName} />
                      <AvatarFallback className="text-[10px] bg-[var(--sidebar-accent)] text-[var(--em-gold)] font-bold border border-[var(--em-gold-35)]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start leading-tight">
                      <span className="text-xs font-semibold text-white">
                        {displayName || anyUser?.email}
                      </span>
                      <span className="text-[10px] text-[var(--em-sage-muted)]">
                        {getRoleLabel(role ?? "")}
                      </span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-white/40 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-60 border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-white shadow-xl"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-white">
                        {displayName || anyUser?.email}
                      </span>
                      <span className="text-xs text-[var(--em-sage-muted)]">{user?.email}</span>
                      <Badge
                        variant="secondary"
                        className="mt-0.5 w-fit text-[10px] bg-[var(--sidebar-accent-hover)] text-[var(--em-gold)] border border-[var(--topnav-active-border)] font-semibold"
                      >
                        {getRoleLabel(role ?? "")}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--sidebar-accent)]" />
                  <DropdownMenuItem asChild>
                    <Link
                      href={profileHref}
                      className="flex items-center gap-2.5 cursor-pointer text-white/80 hover:text-white hover:bg-white/8 py-2"
                    >
                      <User className="h-4 w-4 text-[var(--em-sage-muted)]" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={settingsHref}
                      className="flex items-center gap-2.5 cursor-pointer text-white/80 hover:text-white hover:bg-white/8 py-2"
                    >
                      <Settings className="h-4 w-4 text-[var(--em-sage-muted)]" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={notificationsHref}
                      className="flex items-center gap-2.5 cursor-pointer text-white/80 hover:text-white hover:bg-white/8 py-2"
                    >
                      <Zap className="h-4 w-4 text-[var(--em-sage-muted)]" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge className="ml-auto h-5 min-w-[20px] px-1.5 bg-red-500 text-white border-0 text-[10px] font-bold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[var(--sidebar-accent)]" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center gap-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer py-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* ── Impersonation banner (below nav) ──────────────────────────── */}
        <ImpersonationBanner />

        {/* ── Body: sidebar + content ───────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left module sidebar */}
          <LeftSidebar
            navItems={visibleNavItems}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((v) => !v)}
          />

          {/* Page content */}
          <main
            className={cn("flex-1 overflow-y-auto", isPlatformRoute && "pb-24")}
            style={{
              background: isPlatformRoute
                ? "radial-gradient(circle at top right, rgba(216, 169, 72, 0.08), transparent 22%), radial-gradient(circle at top left, rgba(15, 76, 42, 0.08), transparent 24%), linear-gradient(180deg, rgba(240,248,244,0.96) 0%, rgba(245,249,246,1) 220px)"
                : "linear-gradient(180deg, rgba(240,248,244,0.9) 0%, rgba(245,249,246,1) 220px)",
            }}
          >
            {children}
          </main>
        </div>

        {/* ══ Footer popups (legacy non-platform panels) ════════════════════ */}
        {!isPlatformRoute && footerPanel && (
          <div
            className="fixed bottom-[44px] left-0 z-[3000] flex gap-2 px-3 pb-1 pointer-events-none"
            style={{ width: "auto" }}
          >
            {footerPanel === "chats" && (
              <div
                className="pointer-events-auto w-80 rounded-t-xl shadow-2xl border overflow-hidden flex flex-col"
                style={{
                  background: "var(--sidebar-bg)",
                  borderColor: "var(--sidebar-border)",
                  maxHeight: 420,
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: "var(--sidebar-border)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--em-gold)" }}>
                    Chats
                  </span>
                  <button
                    onClick={() => setFooterPanel(null)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 flex flex-col items-center justify-center h-40 text-center gap-2">
                    <MessageCircle className="h-8 w-8 text-white/20" />
                    <p className="text-xs text-white/40">No active chats</p>
                    <Link
                      href={sectionHref("communications")}
                      onClick={() => setFooterPanel(null)}
                      className="text-xs px-3 py-1.5 rounded-md transition-all"
                      style={{ background: "var(--sidebar-accent-hover)", color: "var(--em-gold)" }}
                    >
                      Open Communications
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {footerPanel === "channels" && (
              <div
                className="pointer-events-auto w-80 rounded-t-xl shadow-2xl border overflow-hidden flex flex-col"
                style={{
                  background: "var(--sidebar-bg)",
                  borderColor: "var(--sidebar-border)",
                  maxHeight: 420,
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: "var(--sidebar-border)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--em-gold)" }}>
                    Channels
                  </span>
                  <button
                    onClick={() => setFooterPanel(null)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 flex flex-col items-center justify-center h-40 text-center gap-2">
                    <Hash className="h-8 w-8 text-white/20" />
                    <p className="text-xs text-white/40">No channels yet</p>
                    <Link
                      href={sectionHref("communications")}
                      onClick={() => setFooterPanel(null)}
                      className="text-xs px-3 py-1.5 rounded-md transition-all"
                      style={{ background: "var(--sidebar-accent-hover)", color: "var(--em-gold)" }}
                    >
                      Open Channels
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {footerPanel === "contacts" && (
              <div
                className="pointer-events-auto w-80 rounded-t-xl shadow-2xl border overflow-hidden flex flex-col"
                style={{
                  background: "var(--sidebar-bg)",
                  borderColor: "var(--sidebar-border)",
                  maxHeight: 420,
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: "var(--sidebar-border)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--em-gold)" }}>
                    Contacts
                  </span>
                  <button
                    onClick={() => setFooterPanel(null)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 flex flex-col items-center justify-center h-40 text-center gap-2">
                    <Users2 className="h-8 w-8 text-white/20" />
                    <p className="text-xs text-white/40">No contacts found</p>
                    <Link
                      href={sectionHref("communications")}
                      onClick={() => setFooterPanel(null)}
                      className="text-xs px-3 py-1.5 rounded-md transition-all"
                      style={{ background: "var(--sidebar-accent-hover)", color: "var(--em-gold)" }}
                    >
                      Manage Contacts
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ Footer ══════════════════════════════ */}
        {isPlatformRoute ? (
          <footer
            className="sticky bottom-0 z-40 flex-shrink-0 border-t border-white/12 bg-[var(--topnav-bg)] px-4 py-2.5 shadow-[0_-16px_40px_rgba(3,12,8,0.38)]"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09), 0 -16px 40px rgba(3,12,8,0.38)",
            }}
          >
            <div className="flex min-h-[44px] items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
              <div className="flex items-center gap-2 text-[11px] text-white shrink-0">
                <Link
                  href={settingsHref}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white transition-all duration-150 hover:bg-white/[0.09]"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Platform settings
                </Link>
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-[11px] text-white/55">
                <span className="inline-flex h-8 items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  Powered by{" "}
                  <a
                    href="https://mylesoft.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 font-semibold text-[var(--em-gold)] hover:underline"
                  >
                    MylesCorp Technologies
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-white shrink-0">
                <Link
                  href={supportHref}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white transition-all duration-150 hover:bg-white/[0.09]"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Support
                </Link>
                <span className="inline-flex h-8 items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-[var(--em-gold)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  EduMyles 2026
                </span>
              </div>
            </div>
          </footer>
        ) : (
          <footer
            className="flex-shrink-0 flex items-center justify-between px-3 h-[44px] text-xs border-t gap-2"
            style={{
              background: "var(--topnav-bg)",
              borderColor: "var(--topnav-border)",
            }}
          >
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => toggleFooterPanel("chats")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150",
                  footerPanel === "chats"
                    ? "text-[var(--em-gold)] bg-[var(--sidebar-accent-hover)]"
                    : "text-white/55 hover:text-[var(--em-gold)] hover:bg-white/8"
                )}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Chats</span>
              </button>
              <button
                onClick={() => toggleFooterPanel("channels")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150",
                  footerPanel === "channels"
                    ? "text-[var(--em-gold)] bg-[var(--sidebar-accent-hover)]"
                    : "text-white/55 hover:text-[var(--em-gold)] hover:bg-white/8"
                )}
              >
                <Hash className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Channels</span>
              </button>
              <button
                onClick={() => toggleFooterPanel("contacts")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150",
                  footerPanel === "contacts"
                    ? "text-[var(--em-gold)] bg-[var(--sidebar-accent-hover)]"
                    : "text-white/55 hover:text-[var(--em-gold)] hover:bg-white/8"
                )}
              >
                <Users2 className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Contacts</span>
              </button>
            </div>

            <button
              className="mx-2 flex h-7 max-w-[360px] flex-1 items-center gap-2 rounded-md border border-white/12 bg-white/8 px-3 text-white/40 transition-all duration-150 hover:border-[var(--sidebar-border)] hover:bg-white/10 hover:text-white/70"
              title="Smart Chat (Ctrl+Space)"
            >
              <Zap className="h-3.5 w-3.5 shrink-0 text-[var(--em-gold)]" />
              <span className="truncate text-left text-[11px]">Here is your Smart Chat</span>
              <kbd className="ml-auto hidden shrink-0 rounded bg-white/8 px-1 font-mono text-[9px] sm:block">
                Ctrl+Space
              </kbd>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <Link
                href={notificationsHref}
                className="relative flex h-7 w-7 items-center justify-center rounded-md text-white/55 transition-all duration-150 hover:bg-white/8 hover:text-[var(--em-gold)]"
                title="Notifications"
              >
                <Bell className="h-3.5 w-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-[var(--topnav-bg)]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="h-3.5 w-px bg-white/10" />

              <Link
                href={sectionHref("tickets")}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-white/55 transition-all duration-150 hover:bg-white/8 hover:text-[var(--em-gold)]"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Need Support?</span>
              </Link>

              <span className="hidden md:flex items-center h-5 px-1.5 rounded text-[9px] font-mono font-semibold bg-[var(--sidebar-accent)] text-[var(--em-gold)] border border-[var(--sidebar-border)]">
                EduMyles 2026
              </span>

              <Link
                href={settingsHref}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition-all duration-150 hover:bg-white/8 hover:text-[var(--em-gold)]"
                title="Settings"
              >
                <Lock className="h-3.5 w-3.5" />
              </Link>
            </div>
          </footer>
        )}
      </div>
    </TooltipProvider>
  );
}

export default GlobalShell;
