"use client";

import { useState, useRef, useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/hooks/useTheme";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { usePermissionBasedNavItems } from "@/hooks/usePermissionBasedNav";
import { getInitials, formatName } from "@/lib/formatters";
import { getRoleLabel } from "@/lib/routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Logo from "@/components/shared/Logo";
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
  LogOut,
  Settings,
  User,
  Menu,
  ChevronDown,
  X,
  HelpCircle,
  Headphones,
  Zap,
  MessageCircle,
  Hash,
  Users2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ArrowRight,
  CheckCheck,
  ExternalLink,
  Sun,
  Moon,
  Sparkles,
  Monitor,
  Copyright,
  CreditCard,
  History,
  LayoutDashboard,
  School,
  ShieldCheck,
  UserRoundSearch,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { CampusSwitcher } from "./CampusSwitcher";
import type { NavItem } from "@/lib/routes";
import { WhatsNewNavLink } from "@/components/whats-new/WhatsNewNavLink";

export interface NavGroup {
  label: string;
  href?: string;
  items?: { label: string; href: string }[];
}

function getPlatformSidebarItems(items: NavItem[]): NavItem[] {
  const byHref = new Map(items.map((item) => [item.href, item]));
  const item = (href: string, label: string, section: string) => {
    const found = byHref.get(href);
    return found ? { ...found, label, section, children: undefined } : null;
  };
  const parent = (
    href: string,
    label: string,
    section: string,
    childHrefs: string[]
  ) => {
    const base = byHref.get(href) ?? childHrefs.map((childHref) => byHref.get(childHref)).find(Boolean);
    const children = childHrefs
      .filter((childHref) => childHref !== href)
      .map((childHref) => byHref.get(childHref))
      .filter((child): child is NavItem => Boolean(child));

    if (!base || (!byHref.has(href) && children.length === 0)) return null;
    return { ...base, label, section, children };
  };

  const sidebarItems = ([
    item("/platform", "Dashboard", "Overview"),
    item("/platform/analytics", "Analytics", "Overview"),
    parent("/platform/tenants", "Tenants", "Schools", [
      "/platform/tenants",
      "/platform/networks",
      "/platform/tenants/create",
      "/platform/tenant-success",
      "/platform/waitlist",
      "/platform/demo-requests",
      "/platform/onboarding",
    ]),
    item("/platform/users", "Users & staff", "Schools"),
    item("/platform/crm", "CRM", "Schools"),
    parent("/platform/marketplace", "Marketplace", "Growth", [
      "/platform/marketplace",
      "/platform/marketplace/module",
      "/platform/marketplace/modules",
      "/platform/marketplace/billing",
      "/platform/marketplace/admin",
      "/platform/marketplace/pricing",
      "/platform/marketplace/flags",
      "/platform/marketplace/reviews",
      "/platform/marketplace/pilot-grants",
      "/platform/marketplace/publishers",
    ]),
    item("/admin/resellers", "Resellers", "Growth"),
    item("/platform/marketplace/developer", "Developers", "Growth"),
    item("/platform/social", "Social media", "Growth"),
    item("/platform/pm", "Project management", "Operations"),
    parent("/platform/billing", "Billing", "Operations", [
      "/platform/billing/plans",
      "/platform/billing/invoices",
      "/platform/billing/subscriptions",
      "/platform/billing/reports",
    ]),
    item("/platform/security", "Security", "Operations"),
    item("/platform/support", "Support", "Operations"),
  ].filter(Boolean) as NavItem[]);
  const changelog = byHref.get("/platform/changelog");
  const settings = byHref.get("/platform/settings");
  if (changelog) sidebarItems.push({ ...changelog, label: "What's new", section: "Footer" });
  if (settings) sidebarItems.push({ ...settings, label: "Platform settings", section: "Footer" });
  return sidebarItems;
}

function isRenderableNavHref(href: string) {
  return !href.includes("[") && !href.includes("]");
}

function subscribeToWorkspaceCookie(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getAdminWorkspaceModeSnapshot() {
  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim() === "edumyles_admin_workspace_mode=true");
}

function getAdminWorkspaceModeServerSnapshot() {
  return false;
}

function unwrapRenderValue<T = unknown>(value: any): T | undefined {
  let current = value;
  const seen = new Set<any>();

  while (current !== undefined && current !== null) {
    if (typeof current !== "object") {
      return current as T;
    }

    if (seen.has(current)) {
      return undefined;
    }
    seen.add(current);

    const nextValue =
      "value" in current && current.value !== undefined && current.value !== current
        ? current.value
        : "data" in current && current.data !== undefined && current.data !== current
          ? current.data
          : undefined;

    if (nextValue === undefined) {
      return current as T;
    }

    current = nextValue;
  }

  return undefined;
}

function safeRenderText(value: any, fallback = ""): string {
  const resolved = unwrapRenderValue(value);
  if (typeof resolved === "string") return resolved;
  if (typeof resolved === "number") return String(resolved);
  return fallback;
}

function safeRenderNumber(value: any, fallback = 0): number {
  const resolved = unwrapRenderValue(value);
  if (typeof resolved === "number" && Number.isFinite(resolved)) return resolved;
  if (typeof resolved === "string") {
    const parsed = Number(resolved);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function getNavGroups(navItems: NavItem[]): NavGroup[] {
  const groups: NavGroup[] = [];

  for (const item of navItems) {
    if (!isRenderableNavHref(item.href)) {
      continue;
    }

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
            <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[var(--platform-highlight)]" />
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
                    ? "text-[var(--platform-highlight)] font-semibold bg-[var(--sidebar-accent)]"
                    : "text-white/80 hover:text-white hover:bg-white/8"
                )}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--platform-highlight)] flex-shrink-0" />
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
  const [openSection, setOpenSection] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const activeGroup = groups.find((group) =>
      group.items?.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    );
    setOpenSection(activeGroup?.label ?? null);
  }, [groups, pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Open navigation menu"
          className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="shell-mobile-panel w-72 p-0 flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]"
      >
        {/* Drawer header */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--sidebar-border)]">
          <Logo variant="icon" width={32} height={32} priority appearance="dark" className="flex-shrink-0" href={null} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--platform-highlight)" }}>
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

        <div className="shell-mobile-campus">
          <CampusSwitcher />
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
                        ? "bg-[var(--sidebar-accent-hover)] text-[var(--platform-highlight)] border-l-2 border-[var(--topnav-active-border)]"
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
              const isOpen = openSection === group.label;
              return (
                <div key={group.label} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setOpenSection((current) => (current === group.label ? null : group.label))}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all duration-150",
                      isGroupActive
                        ? "border-[var(--topnav-active-border)] bg-[var(--sidebar-accent)] text-[var(--platform-highlight)]"
                        : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">{group.label}</span>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
                  </button>
                  {isOpen ? (
                    <div className="mt-2 space-y-1">
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
                                ? "bg-[var(--sidebar-accent)] text-[var(--platform-highlight)] font-semibold border-l-2 border-[var(--topnav-active-border)]"
                                : "text-white/65 hover:text-white hover:bg-white/8"
                            )}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        <WhatsNewNavLink mobile onClick={() => setOpen(false)} />

        {/* User footer */}
        <div className="border-t border-[var(--sidebar-border)] p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="text-xs bg-[var(--sidebar-accent)] text-[var(--platform-highlight)] font-bold border border-[var(--topnav-active-border)]">
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
        <button className="shell-search-trigger flex h-8 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm text-white/70 transition-all duration-150 hover:border-[var(--topnav-active-border)] hover:bg-white/[0.09] hover:text-white">
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
        className="shell-popover w-[380px] border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-0 text-white shadow-2xl"
      >
        <div className="border-b border-[var(--sidebar-border)] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">
            <Search className="h-4 w-4 text-[var(--platform-highlight)]" />
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
        className="shell-popover w-[380px] border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-0 text-white shadow-2xl"
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
          className="shell-support-trigger flex h-8 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-white/60 transition-all duration-150 hover:bg-white/[0.09] hover:text-white"
          title="Help & support"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Support</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="shell-popover w-[280px] border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-3 text-white shadow-2xl"
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
    "relative h-8 w-8 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--topnav-bg)]",
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
      <Link href={href} className={cls} title={title} aria-label={title}>
        {inner}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls} title={title} aria-label={title}>
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
  isPlatformRoute,
  role,
}: {
  navItems: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
  isPlatformRoute: boolean;
  role: string | null;
}) {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const [openPlatformItem, setOpenPlatformItem] = useState<string | null | undefined>(undefined);
  const [collapsedFlyoutItem, setCollapsedFlyoutItem] = useState<string | null>(null);
  const collapsedFlyoutCloseTimer = useRef<number | null>(null);
  const clearCollapsedFlyoutClose = () => {
    if (collapsedFlyoutCloseTimer.current !== null) {
      window.clearTimeout(collapsedFlyoutCloseTimer.current);
      collapsedFlyoutCloseTimer.current = null;
    }
  };
  const queueCollapsedFlyoutClose = () => {
    clearCollapsedFlyoutClose();
    collapsedFlyoutCloseTimer.current = window.setTimeout(() => {
      setCollapsedFlyoutItem(null);
      collapsedFlyoutCloseTimer.current = null;
    }, 180);
  };
  const isAdminWorkspaceMode = useSyncExternalStore(
    subscribeToWorkspaceCookie,
    getAdminWorkspaceModeSnapshot,
    getAdminWorkspaceModeServerSnapshot
  );
  const [savedWorkspaceAccess, setSavedWorkspaceAccess] = useState({
    canAccessPlatform: false,
    canImpersonate: false,
    hasSavedPlatformSession: false,
  });
  useEffect(() => {
    let active = true;
    fetch("/api/auth/session?workspace=platform-access-check", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (active) {
          setSavedWorkspaceAccess({
            canAccessPlatform: result?.canAccessPlatform === true,
            canImpersonate: result?.canImpersonate === true,
            hasSavedPlatformSession: result?.hasSavedPlatformSession === true,
          });
        }
      })
      .catch(() => {
        if (active) {
          setSavedWorkspaceAccess({
            canAccessPlatform: false,
            canImpersonate: false,
            hasSavedPlatformSession: false,
          });
        }
      });
    return () => { active = false; };
  }, [isAdminWorkspaceMode]);
  const footerNavItems = useMemo(() => {
    const dashboardItem = navItems.find((item) => /dashboard/i.test(item.label)) ?? navItems[0];
    const supportItem = navItems.find((item) => /help|support|ticket/i.test(item.label));
    const updatesItem = navItems.find((item) => /what'?s new|changelog|announcement|notification|updates?/i.test(item.label));
    const settingsItem = navItems.find((item) => /^(platform |school |my )?settings$/i.test(item.label))
      ?? navItems.find((item) => /^profile$/i.test(item.label));

    return [
      {
        label: "Help centre",
        href: supportItem?.href ?? (isPlatformRoute ? "/platform/ai-support" : "/support/tickets"),
        icon: Headphones,
      },
      {
        label: "What's new",
        href: updatesItem?.href ?? dashboardItem?.href ?? "/dashboard",
        icon: Sparkles,
      },
      {
        label: isPlatformRoute ? "Platform settings" : "Settings",
        href: settingsItem?.href ?? dashboardItem?.href ?? "/dashboard",
        icon: Settings,
      },
    ];
  }, [isPlatformRoute, navItems]);
  const footerNavHrefs = useMemo(
    () => {
      const dashboardHref = navItems.find((item) => /dashboard/i.test(item.label))?.href ?? navItems[0]?.href;
      return new Set(footerNavItems.slice(1).map((item) => item.href).filter((href) => href !== dashboardHref));
    },
    [footerNavItems, navItems]
  );
  const groupedNavItems = useMemo(() => {
    const grouped = navItems
      .filter((item) =>
        !footerNavHrefs.has(item.href) &&
        !/^(help centre|help center|what'?s new|platform settings|school settings|my settings)$/i.test(item.label)
      )
      .reduce<Array<{ section: string; items: NavItem[] }>>((acc, item) => {
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
  }, [footerNavHrefs, navItems]);

  const activePlatformParent = isPlatformRoute
    ? navItems.find((item) =>
        item.children?.some(
          (child) => pathname === child.href || pathname?.startsWith(`${child.href}/`)
        )
      )?.href
    : null;

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn("shell-sidebar hidden md:flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden", collapsed && "is-collapsed")}
        style={{
          width: collapsed
            ? "var(--layout-sidebarCollapsed)"
            : "var(--layout-sidebar)",
          background: "var(--sidebar-bg)",
          borderColor: "var(--sidebar-border)",
        }}
      >
        <div className="shell-sidebar-brand flex h-14 shrink-0 items-center justify-between gap-2 px-3">
          <Logo
            variant={collapsed ? "icon" : "full"}
            width={collapsed ? 28 : 112}
            height={collapsed ? 28 : 31}
            priority
            appearance="auto"
            href={null}
          />
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn("shell-sidebar-collapse", collapsed && "mx-auto")}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        {!collapsed && (() => {
          const canOpenPlatform = savedWorkspaceAccess.canAccessPlatform || [
            "master_admin", "super_admin", "platform_manager", "support_agent",
            "billing_admin", "marketplace_reviewer", "content_moderator", "analytics_viewer",
          ].includes(role ?? "");
          const canOpenSchoolAdmin = [
            "master_admin", "super_admin", "school_admin", "principal", "bursar",
            "hr_manager", "librarian", "transport_manager",
          ].includes(role ?? "");
          const impersonationAvailable =
            savedWorkspaceAccess.canImpersonate ||
            role === "master_admin" ||
            role === "super_admin" ||
            navItems.some((item) => item.href === "/platform/impersonation");
          const currentWorkspace = isPlatformRoute
            ? "Platform admin"
            : pathname?.startsWith("/admin")
              ? "School admin"
              : safeRenderText(tenant?.name, "My workspace");
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="shell-platform-workspace group w-full text-left" aria-label="Switch workspace">
                  <span className="shell-platform-workspace-title">{currentWorkspace}</span>
                  <small className="shell-platform-workspace-subtitle">
                    <span>{isPlatformRoute ? "Master workspace" : safeRenderText(tenant?.name, "School workspace")}</span>
                    <ChevronDown className="h-3 w-3 shrink-0 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
                  </small>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom" className="shell-sidebar-flyout w-60 shadow-lg">
                <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Switch workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canOpenPlatform && (
                  <DropdownMenuItem asChild>
                    <a
                      href={savedWorkspaceAccess.hasSavedPlatformSession
                        ? "/api/auth/session?workspace=platform&redirect=platform"
                        : "/platform"}
                      className="flex items-center gap-2.5 text-foreground"
                    >
                      <ShieldCheck className="h-4 w-4" /> Platform admin
                      {isPlatformRoute ? <span className="ml-auto text-xs text-muted-foreground">Current</span> : null}
                    </a>
                  </DropdownMenuItem>
                )}
                {canOpenSchoolAdmin && (
                  <DropdownMenuItem asChild>
                    <a href="/admin" className="flex items-center gap-2.5 text-foreground">
                      <School className="h-4 w-4" /> School admin
                      {!isPlatformRoute && pathname?.startsWith("/admin") ? <span className="ml-auto text-xs text-muted-foreground">Current</span> : null}
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2.5 text-foreground">
                    <LayoutDashboard className="h-4 w-4" /> My dashboard
                  </Link>
                </DropdownMenuItem>
                {impersonationAvailable && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/platform/impersonation" className="flex items-center gap-2.5 text-foreground">
                        <UserRoundSearch className="h-4 w-4" /> Impersonate a user…
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })()}
        {collapsed && (() => {
          const canOpenPlatform = savedWorkspaceAccess.canAccessPlatform || [
            "master_admin", "super_admin", "platform_manager", "support_agent",
            "billing_admin", "marketplace_reviewer", "content_moderator", "analytics_viewer",
          ].includes(role ?? "");
          const canOpenSchoolAdmin = [
            "master_admin", "super_admin", "school_admin", "principal", "bursar",
            "hr_manager", "librarian", "transport_manager",
          ].includes(role ?? "");
          const impersonationAvailable = savedWorkspaceAccess.canImpersonate ||
            role === "master_admin" || role === "super_admin" ||
            navItems.some((item) => item.href === "/platform/impersonation");
          return (
            <div className="flex shrink-0 justify-center px-1 pb-1">
              <DropdownMenu
                open={collapsedFlyoutItem === "__workspace__"}
                onOpenChange={(open) => setCollapsedFlyoutItem(open ? "__workspace__" : null)}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Switch workspace"
                    aria-label="Switch workspace"
                    className="shell-sidebar-item flex h-10 w-10 items-center justify-center rounded-lg"
                    onMouseEnter={() => {
                      clearCollapsedFlyoutClose();
                      setCollapsedFlyoutItem("__workspace__");
                    }}
                    onMouseLeave={queueCollapsedFlyoutClose}
                    onFocus={() => setCollapsedFlyoutItem("__workspace__")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  sideOffset={8}
                  className="shell-sidebar-flyout w-60"
                  onMouseEnter={clearCollapsedFlyoutClose}
                  onMouseLeave={queueCollapsedFlyoutClose}
                >
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Switch workspace
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canOpenPlatform && (
                    <DropdownMenuItem asChild>
                      <a href={savedWorkspaceAccess.hasSavedPlatformSession ? "/api/auth/session?workspace=platform&redirect=platform" : "/platform"} className="flex items-center gap-2.5 text-foreground">
                        <ShieldCheck className="h-4 w-4" /> Platform admin
                        {isPlatformRoute ? <span className="ml-auto text-xs text-muted-foreground">Current</span> : null}
                      </a>
                    </DropdownMenuItem>
                  )}
                  {canOpenSchoolAdmin && (
                    <DropdownMenuItem asChild>
                      <a href="/admin" className="flex items-center gap-2.5 text-foreground">
                        <School className="h-4 w-4" /> School admin
                        {pathname?.startsWith("/admin") ? <span className="ml-auto text-xs text-muted-foreground">Current</span> : null}
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2.5 text-foreground">
                      <LayoutDashboard className="h-4 w-4" /> My dashboard
                    </Link>
                  </DropdownMenuItem>
                  {impersonationAvailable && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/platform/impersonation" className="flex items-center gap-2.5 text-foreground">
                          <UserRoundSearch className="h-4 w-4" /> Impersonate a user…
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })()}
        {!isPlatformRoute && <div className="shell-campus-container"><CampusSwitcher /></div>}
        {/* Scrollable nav items */}
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <nav className="shell-sidebar-nav flex flex-col gap-3 px-2 pb-2 pt-1">
            {groupedNavItems.map((group, index) => (
              <div
                key={group.section}
                className={cn("space-y-1", index > 0 && "border-t pt-2")}
                style={index > 0 ? { borderColor: "var(--sidebar-border)" } : undefined}
              >
                {!collapsed && group.section !== "__standalone__" ? (
                  <p className="shell-sidebar-section px-2.5 py-1.5">{group.section}</p>
                    ) : group.section !== "__standalone__" ? (
                  <div className="mx-auto h-px w-8 bg-border" />
                ) : null}

                {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href.length > 1 && pathname?.startsWith(item.href + "/")) ||
                      Boolean(item.children?.some((child) => pathname === child.href || pathname?.startsWith(`${child.href}/`)));
                    const Icon = item.icon;
                    const hasChildren = isPlatformRoute && Boolean(item.children?.length);
                    const childrenOpen =
                      hasChildren &&
                      (openPlatformItem === item.href ||
                        (openPlatformItem === undefined &&
                          (activePlatformParent === item.href || pathname === item.href)));

                    const navBtn = (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={hasChildren ? () => setOpenPlatformItem(undefined) : undefined}
                        onMouseEnter={collapsed && hasChildren ? () => {
                          clearCollapsedFlyoutClose();
                          setCollapsedFlyoutItem(item.href);
                        } : undefined}
                        onMouseLeave={collapsed && hasChildren ? queueCollapsedFlyoutClose : undefined}
                        onFocus={collapsed && hasChildren ? () => {
                          clearCollapsedFlyoutClose();
                          setCollapsedFlyoutItem(item.href);
                        } : undefined}
                        title={collapsed && !hasChildren ? item.label : undefined}
                        className={cn(
                          "shell-sidebar-item group flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150 min-w-0",
                          collapsed ? "justify-center" : "",
                          isActive
                            ? "bg-[var(--sidebar-accent-hover)] text-[var(--foreground)] shadow-sm ring-1 ring-[var(--topnav-active-border)]"
                            : "text-[var(--sidebar-text)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            isActive
                              ? "text-[var(--platform-highlight)]"
                              : "text-[var(--sidebar-icon)] group-hover:text-[var(--platform-highlight)]"
                          )}
                        />
                        {!collapsed && (
                          <div className="min-w-0 flex-1">
                            <span className="block truncate leading-none">{item.label}</span>
                          </div>
                        )}
                        {!collapsed && isActive && (
                          <span className="h-2 w-2 rounded-full bg-[var(--platform-highlight)]" />
                        )}
                        {!collapsed && hasChildren && (
                          <ChevronRight className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", childrenOpen && "rotate-90")} />
                        )}
                      </Link>
                    );

                    if (collapsed) {
                      if (hasChildren) {
                        return (
                          <DropdownMenu
                            key={item.href}
                            open={collapsedFlyoutItem === item.href}
                            onOpenChange={(open) => {
                              if (open) {
                                clearCollapsedFlyoutClose();
                                setCollapsedFlyoutItem(item.href);
                              } else {
                                setCollapsedFlyoutItem(null);
                              }
                            }}
                          >
                            <DropdownMenuTrigger asChild>{navBtn}</DropdownMenuTrigger>
                            <DropdownMenuContent
                              side="right"
                              align="start"
                              sideOffset={8}
                              className="shell-sidebar-flyout w-60"
                              onMouseEnter={clearCollapsedFlyoutClose}
                              onMouseLeave={queueCollapsedFlyoutClose}
                            >
                              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {item.label}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const childActive = pathname === child.href || pathname?.startsWith(`${child.href}/`);
                                return (
                                  <DropdownMenuItem key={child.href} asChild>
                                    <Link href={child.href} className="flex items-center gap-2.5 text-foreground">
                                      <ChildIcon className="h-4 w-4 text-muted-foreground" />
                                      {child.label}
                                      {childActive ? <span className="ml-auto text-xs text-muted-foreground">Current</span> : null}
                                    </Link>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      }
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{navBtn}</TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="shell-popover border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-xs text-white"
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

                    return (
                      <div key={item.href} className="space-y-1">
                        {hasChildren ? (
                          <div className="relative">
                            {navBtn}
                            <button
                              type="button"
                              aria-label={`${childrenOpen ? "Collapse" : "Expand"} ${item.label}`}
                              aria-expanded={Boolean(childrenOpen)}
                              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground"
                              onClick={() => setOpenPlatformItem(childrenOpen ? null : item.href)}
                            />
                          </div>
                        ) : navBtn}
                        {childrenOpen && !collapsed && (
                          <div className="ml-5 space-y-0.5 border-l border-border pl-2">
                            {item.children?.map((child) => {
                              const ChildIcon = child.icon;
                              const childActive = pathname === child.href || pathname?.startsWith(`${child.href}/`);
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  aria-current={childActive ? "page" : undefined}
                                  className={cn("flex min-h-8 items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", childActive && "bg-muted font-semibold text-foreground")}
                                >
                                  <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{child.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="shell-sidebar-footer shrink-0 border-t p-2">
          {footerNavItems.filter((item) => !/^what'?s new$/i.test(item.label)).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={pathname === item.href || pathname?.startsWith(`${item.href}/`) ? "page" : undefined}
                className={cn(
                  "shell-sidebar-item flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]",
                  (pathname === item.href || pathname?.startsWith(`${item.href}/`)) && "bg-muted text-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && /help centre|help center/i.test(item.label) && <ExternalLink className="ml-auto h-3 w-3" />}
              </Link>
            );
          })}
          <WhatsNewNavLink collapsed={collapsed} />
          <button
            type="button"
            onClick={onToggle}
            className={cn("shell-sidebar-item flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]", collapsed && "justify-center px-0")}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4 shrink-0" /> : <PanelLeftClose className="h-4 w-4 shrink-0" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

// ─── Main GlobalShell ─────────────────────────────────────────────────────────

export function GlobalShell({ children, navItems }: GlobalShellProps) {
  const pathname = usePathname();
  const { user, role, logout, sessionToken } = useAuth();
  const { tenant } = useTenant();
  const { isModuleInstalled, installedModules } = useInstalledModules();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [footerPanel, setFooterPanel] = useState<"chats" | "channels" | "contacts" | null>(null);
  const [healthRefreshNonce, setHealthRefreshNonce] = useState(0);
  const toggleFooterPanel = (panel: "chats" | "channels" | "contacts") =>
    setFooterPanel((prev) => (prev === panel ? null : panel));
  const coreModuleIds = ["sis", "communications", "users"];
  const isPlatformRoute = pathname?.startsWith("/platform");
  const isAdminRoute = pathname?.startsWith("/admin");
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const isFamilyMobileShell = pathname?.startsWith("/portal/parent") || pathname?.startsWith("/portal/student");

  useEffect(() => {
    const updateConnection = () => setIsOnline(window.navigator.onLine);
    const initialSync = window.setTimeout(updateConnection, 0);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

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
    ? permissionBasedNavItems.filter((item) => isRenderableNavHref(item.href))
    : navItems.filter((item) => {
        if (!isRenderableNavHref(item.href)) return false;
        if (!item.module) return true;
        if (coreModuleIds.includes(item.module)) return true;
        if (!isModuleInstalled(item.module)) return false;
        return true;
      });
  const sidebarNavItems = isPlatformRoute
    ? getPlatformSidebarItems(visibleNavItems)
    : visibleNavItems;

  const anyUser = user as any;
  const normalizedShellHealth = unwrapRenderValue<any>(shellHealth) ?? {};
  const safeRole = safeRenderText(role, "");
  const safeTenantName = safeRenderText(tenant?.name, "My School");
  const safeUserEmail = safeRenderText(anyUser?.email, "");
  const safeFirstName = safeRenderText(anyUser?.firstName, "");
  const safeLastName = safeRenderText(anyUser?.lastName, "");
  const displayName = formatName(safeFirstName, safeLastName);
  const initials = getInitials(safeFirstName, safeLastName);
  const groups = getNavGroups(visibleNavItems);
  const workspaceLabel = getRoleWorkspaceLabel(safeRole, safeTenantName);
  const normalizedUnreadCount = safeRenderNumber(unreadCount, 0);
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
  const staffHref = visibleNavItems.find((item) => /staff|users/i.test(item.label))?.href;
  const billingHref = visibleNavItems.find((item) => /billing|plans/i.test(item.label))?.href;
  const auditHref = visibleNavItems.find((item) => /audit/i.test(item.label))?.href;
  const settingsHref = pathname?.startsWith("/platform") ? "/platform/settings" : "/admin/settings";
  const supportHref = pathname?.startsWith("/platform")
    ? "/platform/support"
    : sectionHref("tickets");
  const knowledgeHref = pathname?.startsWith("/platform") ? "/platform/knowledge-base" : "/support";
  const aiSupportHref = pathname?.startsWith("/platform") ? "/platform/ai-support" : "/support";
  const shellHealthTone =
    normalizedShellHealth?.status === "healthy"
      ? "bg-emerald-500"
      : normalizedShellHealth?.status === "watch"
        ? "bg-warning-muted"
        : "bg-rose-500";
  const shellHealthLabel =
    normalizedShellHealth?.status === "healthy"
      ? "Platform healthy"
      : normalizedShellHealth?.status === "watch"
        ? "Platform needs attention"
        : "Platform critical";
  const tenantStatus = safeRenderText(tenant?.status, "active");
  const tenantPlan = safeRenderText(tenant?.plan, "starter");
  const tenantSubdomain = safeRenderText(tenant?.subdomain, "");
  const tenantTrialEndsAt = Number(tenant?.trialEndsAt ?? 0);
  const hasActiveTrial = tenantStatus === "trial" && tenantTrialEndsAt > Date.now();
  const trialDaysLeft = hasActiveTrial
    ? Math.max(0, Math.ceil((tenantTrialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const visibleModuleCount = installedModules.length;
  const workspaceHealthTone =
    tenantStatus === "active"
      ? "bg-emerald-500"
      : tenantStatus === "trial"
        ? "bg-warning-muted"
        : "bg-rose-500";
  const workspaceHealthLabel =
    tenantStatus === "active"
      ? "Workspace active"
      : tenantStatus === "trial"
        ? "Trial in progress"
        : "Needs review";
  const workspaceTitle = isPlatformRoute ? "Master Admin Command Center" : "School Admin Command Center";
  const workspaceBadgeLabel = isPlatformRoute
    ? "Live"
    : hasActiveTrial
      ? `${trialDaysLeft}d trial`
      : tenantPlan;
  const workspaceDescriptor = isPlatformRoute
    ? "Platform-wide operations, oversight, and queue health."
    : tenantSubdomain
      ? `${safeTenantName} on ${tenantSubdomain}.edumyles.com`
      : `${safeTenantName} workspace operations and school controls.`;
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "panel-shell-layout app-shell flex h-dvh min-h-[420px] flex-col overflow-hidden",
          sidebarCollapsed && "is-sidebar-collapsed",
          isPlatformRoute
            ? "platform-app-shell"
            : cn(
                "tenant-app-shell",
                isAdminRoute && "admin-app-shell",
                isDashboardRoute && "dashboard-app-shell"
              )
        )}
        style={{ background: "var(--background)" }}
      >
        {/* ══ Top navigation bar — platform shell ══════════ */}
        <header
          className="shell-header flex-shrink-0 z-[2000]"
          style={{ background: "var(--topnav-bg)", borderBottom: "1px solid var(--topnav-border)" }}
        >
          <div className="shell-header-content flex h-[var(--layout-headerMobile)] items-center gap-2 px-4 md:h-header md:px-4">
            {/* Mobile menu */}
            <div className="shell-mobile-menu flex md:hidden">
              <MobileDrawer groups={groups} user={anyUser} tenant={{ ...tenant, name: safeTenantName }} logout={logout} />
            </div>

            <span className="shell-overview-label">Overview</span>

            {/* ── Logo mark (Zoho-style: "E" monogram + name) ── */}
            <Link
              href={
                role === "master_admin" || role === "super_admin"
                  ? "/platform"
                  : role === "school_admin" || role === "principal"
                    ? "/admin"
                    : "/"
              }
              className="shell-brand-link flex items-center gap-2 shrink-0 mr-1"
            >
              <Logo variant="icon" width={28} height={28} priority appearance="dark" className="flex-shrink-0" href={null} />
              <span
                className="hidden sm:block text-sm font-bold tracking-tight"
                style={{ color: "var(--platform-highlight)" }}
              >
                EduMyles
              </span>
            </Link>

            {/* ── Workspace / school selector pill (like Zoho "Personal ▾") ── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="shell-workspace-switch hidden md:flex items-center gap-1 rounded-md border border-white/12 bg-white/6 px-2.5 h-[28px] text-xs font-medium text-white/75 hover:text-white hover:bg-white/10 hover:border-[var(--topnav-active-border)] transition-all duration-150 mr-1 max-w-[160px]">
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
                    <div className="w-2 h-2 rounded-full bg-[var(--platform-highlight)]" />
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
                                isActiveTenant ? "bg-[var(--platform-highlight)]" : "bg-white/20"
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

            <div className="shell-context-info hidden min-w-0 flex-1 items-center justify-between gap-4 px-2 lg:flex">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{workspaceTitle}</p>
                  <Badge
                    className={cn(
                      "h-5 rounded-full px-2 text-[10px] font-semibold shadow-none",
                      isPlatformRoute
                        ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        : hasActiveTrial
                          ? "border border-warning/25 bg-warning-muted text-warning-muted-foreground"
                          : "border border-white/12 bg-white/8 text-white/80"
                    )}
                  >
                    {workspaceBadgeLabel}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-white/45">{workspaceDescriptor}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <div className="flex items-center gap-2 text-[11px] text-white/55">
                    <span className={cn("h-2.5 w-2.5 rounded-full", isPlatformRoute ? shellHealthTone : workspaceHealthTone)} />
                    <span className="uppercase tracking-[0.18em]">
                      {isPlatformRoute ? "Platform status" : "Workspace status"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-white/85">
                    <span className="font-semibold">
                      {isPlatformRoute ? shellHealthLabel : workspaceHealthLabel}
                    </span>
                    <span>
                      {isPlatformRoute
                        ? `${safeRenderNumber(normalizedShellHealth?.responseTime, 0)}ms avg`
                        : `${visibleModuleCount} modules live`}
                    </span>
                    <span>
                      {isPlatformRoute
                        ? `${safeRenderNumber(normalizedShellHealth?.errorRate, 0).toFixed(1)}% errors`
                        : hasActiveTrial
                          ? `${trialDaysLeft} days left`
                          : tenantPlan}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                    {isPlatformRoute ? "Queue" : "Readiness"}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-white/80">
                    {isPlatformRoute ? (
                      <>
                        <span>{safeRenderNumber(normalizedShellHealth?.pendingReviews, 0)} reviews</span>
                        <span>{safeRenderNumber(normalizedShellHealth?.activeFlags, 0)} flags</span>
                        <span>{normalizedUnreadCount} unread</span>
                      </>
                    ) : (
                      <>
                        <span>{visibleModuleCount} modules</span>
                        <span>{normalizedUnreadCount} unread</span>
                        <span className="capitalize">{tenantStatus}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right controls ── */}
            <div className="shell-toolbar-actions ml-auto flex items-center gap-1.5">
              <GlobalSearch
                navItems={visibleNavItems}
                pathname={pathname ?? ""}
                notificationsHref={notificationsHref}
                settingsHref={settingsHref}
                isPlatformRoute={!!isPlatformRoute}
              />

              <Link href={aiSupportHref} className="shell-ai-link">
                <Sparkles className="h-3.5 w-3.5" />
                Ask AI
              </Link>

              <span className={cn("shell-connection-chip", !isOnline && "is-offline")} role="status">
                <span aria-hidden="true" />
                {isOnline ? "Connected" : "Offline"}
              </span>

              <NotificationsMenu
                notifications={notifications}
                unreadCount={normalizedUnreadCount}
                notificationsHref={notificationsHref}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
              />

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
                  <button aria-label="Open account menu" className="shell-account-trigger ml-0.5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] pl-1.5 pr-2.5 py-1.5 text-white transition-all duration-150 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={safeRenderText(anyUser?.avatarUrl, "") || undefined} alt={displayName} />
                      <AvatarFallback className="text-[10px] bg-[var(--sidebar-accent)] text-[var(--platform-highlight)] font-bold border border-[var(--topnav-active-border)]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 text-white/40" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="shell-popover shell-account-menu shell-platform-account-menu w-72 border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-white shadow-xl"
                >
                  <DropdownMenuLabel className="px-3 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={safeRenderText(anyUser?.avatarUrl, "") || undefined} alt={displayName} />
                        <AvatarFallback className="border border-[var(--topnav-active-border)] bg-[var(--sidebar-accent)] text-xs font-bold text-[var(--platform-highlight)]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold text-white">
                          {displayName || safeUserEmail}
                        </span>
                        <span className="truncate text-xs text-[var(--em-sage-muted)]">{safeUserEmail}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[9px] bg-[var(--sidebar-accent-hover)] text-[var(--platform-highlight)] border border-[var(--topnav-active-border)] font-semibold"
                      >
                        {getRoleLabel(safeRole)}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--sidebar-accent)]" />
                  <div className="shell-theme-switcher px-2 py-1">
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { value: "light", label: "Light", Icon: Sun },
                        { value: "dark", label: "Dark", Icon: Moon },
                        { value: "system", label: "System", Icon: Monitor },
                      ] as const).map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={theme === value}
                          onClick={() => setTheme(value)}
                          className={cn("flex items-center justify-center gap-1.5 rounded-md px-1 py-1.5 text-[10px]", theme === value && "shell-theme-selected")}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-[var(--sidebar-accent)]" />
                  <DropdownMenuLabel className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">Account</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link
                      href={profileHref}
                      className="flex items-center gap-2.5 cursor-pointer text-white/80 hover:text-white hover:bg-white/8 py-2"
                    >
                      <User className="h-4 w-4 text-[var(--em-sage-muted)]" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[var(--sidebar-accent)]" />
                  <DropdownMenuLabel className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">Workspace</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link
                      href={settingsHref}
                      className="flex items-center gap-2.5 cursor-pointer text-white/80 hover:text-white hover:bg-white/8 py-2"
                    >
                      <Settings className="h-4 w-4 text-[var(--em-sage-muted)]" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {staffHref && (
                    <DropdownMenuItem asChild>
                      <Link href={staffHref} className="shell-menu-item">
                        <Users2 className="h-4 w-4" />
                        Staff
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {billingHref && (
                    <DropdownMenuItem asChild>
                      <Link href={billingHref} className="shell-menu-item">
                        <CreditCard className="h-4 w-4" />
                        Plan & billing
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {auditHref && (
                    <DropdownMenuItem asChild>
                      <Link href={auditHref} className="shell-menu-item">
                        <History className="h-4 w-4" />
                        Audit log
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={supportHref} className="shell-menu-item">
                      <HelpCircle className="h-4 w-4" />
                      Feedback & help
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={notificationsHref}
                      className="flex items-center gap-2.5 cursor-pointer text-white/80 hover:text-white hover:bg-white/8 py-2"
                    >
                      <Zap className="h-4 w-4 text-[var(--em-sage-muted)]" />
                      Notifications
                        {normalizedUnreadCount > 0 && (
                          <Badge className="ml-auto h-5 min-w-[20px] px-1.5 bg-red-500 text-white border-0 text-[10px] font-bold">
                            {normalizedUnreadCount > 9 ? "9+" : normalizedUnreadCount}
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
        <div className="shell-body-slot flex flex-1 overflow-hidden">
          {/* Left module sidebar */}
          <LeftSidebar
            navItems={sidebarNavItems}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((v) => !v)}
            isPlatformRoute={!!isPlatformRoute}
            role={safeRole}
          />

          {/* Page content */}
          <main
            className={cn("shell-page-main flex-1 overflow-y-auto", isFamilyMobileShell && "pb-20 md:pb-0")}
            style={{
              background: "var(--background)",
            }}
          >
            {children}
          </main>
        </div>

        {isFamilyMobileShell && (
          <nav className="shell-mobile-tabs md:hidden" aria-label="Primary navigation">
            {visibleNavItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn("shell-mobile-tab", isActive && "is-active")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

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
                  <span className="text-sm font-semibold" style={{ color: "var(--platform-highlight)" }}>
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
                      style={{ background: "var(--sidebar-accent-hover)", color: "var(--platform-highlight)" }}
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
                  <span className="text-sm font-semibold" style={{ color: "var(--platform-highlight)" }}>
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
                      style={{ background: "var(--sidebar-accent-hover)", color: "var(--platform-highlight)" }}
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
                  <span className="text-sm font-semibold" style={{ color: "var(--platform-highlight)" }}>
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
                      style={{ background: "var(--sidebar-accent-hover)", color: "var(--platform-highlight)" }}
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
        <footer className="shell-footer">
          <div className="shell-footer-credit">
            <span>Powered by</span>
            <a href="https://mylesoft.vercel.app" target="_blank" rel="noreferrer">Mylesoft Technologies</a>
            <span className="shell-footer-divider" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1"><Copyright className="h-3.5 w-3.5" /> 2026</span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

export default GlobalShell;
