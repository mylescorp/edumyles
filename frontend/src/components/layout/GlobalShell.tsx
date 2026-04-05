"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useNotifications } from "@/hooks/useNotifications";
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
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { ImpersonationBanner } from "./ImpersonationBanner";
import type { NavItem } from "@/lib/routes";

// ─── Nav group definitions ────────────────────────────────────────────────────

export interface NavGroup {
  label: string;
  href?: string;
  items?: { label: string; href: string }[];
}

export const PLATFORM_NAV_GROUPS: NavGroup[] = [
  { label: "Home", href: "/platform" },
  {
    label: "Tenants",
    items: [
      { label: "All Tenants", href: "/platform/tenants" },
      { label: "CRM Pipeline", href: "/platform/crm" },
      { label: "Proposals", href: "/platform/crm/proposals" },
      { label: "Tenant Success", href: "/platform/tenant-success" },
      { label: "Onboarding", href: "/platform/onboarding" },
    ],
  },
  {
    label: "Users",
    items: [
      { label: "All Users", href: "/platform/users" },
      { label: "Impersonation", href: "/platform/impersonation" },
      { label: "Role Builder", href: "/platform/role-builder" },
      { label: "Staff Performance", href: "/platform/staff-performance" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Analytics Dashboard", href: "/platform/analytics" },
      { label: "Scheduled Reports", href: "/platform/scheduled-reports" },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Tickets", href: "/platform/tickets" },
      { label: "Knowledge Base", href: "/platform/knowledge-base" },
      { label: "AI Support", href: "/platform/ai-support" },
    ],
  },
  {
    label: "Comms",
    items: [
      { label: "Communications", href: "/platform/communications" },
      { label: "Changelog", href: "/platform/changelog" },
    ],
  },
  {
    label: "Health",
    items: [
      { label: "System Health", href: "/platform/health" },
      { label: "Operations Center", href: "/platform/operations" },
      { label: "SLA Management", href: "/platform/sla" },
    ],
  },
  {
    label: "Security",
    items: [
      { label: "Security Operations", href: "/platform/security" },
      { label: "API Keys", href: "/platform/api-keys" },
      { label: "Webhooks", href: "/platform/webhooks" },
      { label: "Audit Log", href: "/platform/audit" },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Marketplace", href: "/platform/marketplace" },
      { label: "Billing", href: "/platform/billing" },
      { label: "Feature Flags", href: "/platform/feature-flags" },
      { label: "Automation Center", href: "/platform/automation" },
      { label: "Data Export", href: "/platform/data-export" },
      { label: "White-Label", href: "/platform/white-label" },
      { label: "Project Management", href: "/platform/pm" },
      { label: "Settings", href: "/platform/settings" },
    ],
  },
];

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  { label: "Home", href: "/admin" },
  {
    label: "Students",
    items: [
      { label: "All Students", href: "/admin/students" },
      { label: "Admissions", href: "/admin/admissions" },
      { label: "Classes", href: "/admin/classes" },
      { label: "Academics", href: "/admin/academics" },
    ],
  },
  {
    label: "Staff",
    items: [
      { label: "Staff Directory", href: "/admin/staff" },
      { label: "HR & Payroll", href: "/admin/hr" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Finance Overview", href: "/admin/finance" },
      { label: "eWallet", href: "/admin/ewallet" },
      { label: "eCommerce", href: "/admin/ecommerce" },
    ],
  },
  { label: "Comms", href: "/admin/communications" },
  {
    label: "More",
    items: [
      { label: "Timetable", href: "/admin/timetable" },
      { label: "Library", href: "/admin/library" },
      { label: "Transport", href: "/admin/transport" },
      { label: "Support Tickets", href: "/admin/tickets" },
      { label: "Users", href: "/admin/users" },
      { label: "Modules", href: "/admin/modules" },
      { label: "Marketplace", href: "/admin/marketplace" },
      { label: "Audit Log", href: "/admin/audit" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
];

function navItemsToGroups(items: NavItem[]): NavGroup[] {
  return items.map((item) => ({ label: item.label, href: item.href }));
}

function filterGroupsByVisibleNavItems(groups: NavGroup[], visibleNavItems: NavItem[]): NavGroup[] {
  const visibleHrefs = new Set(visibleNavItems.map((item) => item.href));

  return groups
    .map((group) => {
      if (group.href) {
        return visibleHrefs.has(group.href) ? group : null;
      }

      const items = group.items?.filter((item) => visibleHrefs.has(item.href)) ?? [];
      return items.length > 0 ? { ...group, items } : null;
    })
    .filter((group): group is NavGroup => !!group);
}

function getNavGroups(role: string, navItems: NavItem[]): NavGroup[] {
  if (role === "master_admin" || role === "super_admin") {
    return filterGroupsByVisibleNavItems(PLATFORM_NAV_GROUPS, navItems);
  }
  if (
    role === "school_admin" ||
    role === "principal" ||
    role === "bursar" ||
    role === "hr_manager" ||
    role === "librarian" ||
    role === "transport_manager"
  )
    return filterGroupsByVisibleNavItems(ADMIN_NAV_GROUPS, navItems);
  return navItemsToGroups(navItems);
}

// ─── Role label for workspace pill ───────────────────────────────────────────

function getRoleWorkspaceLabel(role: string, tenantName?: string): string {
  if (role === "master_admin" || role === "super_admin") return "Platform Admin";
  if (tenantName) return tenantName;
  return "My School";
}

// ─── Dropdown nav group ───────────────────────────────────────────────────────

function NavGroupDropdown({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
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
              ? "text-white bg-[rgba(232,160,32,0.18)]"
              : "text-white/70 hover:text-white hover:bg-white/8"
          )}
        >
          {group.label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          {isGroupActive && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#E8A020]" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-52 border-[rgba(232,160,32,0.2)] bg-[#0C3020] text-white shadow-xl"
      >
        {group.items?.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 cursor-pointer rounded-md text-sm py-2 px-3",
                  isActive
                    ? "text-[#E8A020] font-semibold bg-[rgba(232,160,32,0.1)]"
                    : "text-white/80 hover:text-white hover:bg-white/8"
                )}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8A020] flex-shrink-0" />
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
  role: string;
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
      <SheetContent side="left" className="w-72 p-0 flex flex-col border-r border-[rgba(232,160,32,0.15)] bg-[#0C3020]">
        {/* Drawer header */}
        <div className="flex items-center gap-3 p-4 border-b border-[rgba(232,160,32,0.15)]">
          <Image src="/logo-icon.svg" alt="EduMyles" width={32} height={32} className="flex-shrink-0" priority />
          <div>
            <p className="text-sm font-bold" style={{ color: "#D4AF37" }}>EduMyles</p>
            <p className="text-xs text-[#E8A020]/80">{tenant?.name ?? "School Management"}</p>
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
                        ? "bg-[rgba(232,160,32,0.15)] text-[#E8A020] border-l-2 border-[#E8A020]"
                        : "text-white/70 hover:text-white hover:bg-white/8"
                    )}
                  >
                    {group.label}
                  </Link>
                );
              }
              const isGroupActive = group.items?.some(
                (item) =>
                  pathname === item.href || pathname.startsWith(item.href + "/")
              );
              return (
                <div key={group.label} className="mb-1">
                  <p
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold uppercase tracking-widest",
                      isGroupActive ? "text-[#E8A020]" : "text-white/35"
                    )}
                  >
                    {group.label}
                  </p>
                  {group.items?.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ml-1",
                          isActive
                            ? "bg-[rgba(232,160,32,0.12)] text-[#E8A020] font-semibold border-l-2 border-[#E8A020]"
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
        <div className="border-t border-[rgba(232,160,32,0.15)] p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="text-xs bg-[rgba(232,160,32,0.2)] text-[#E8A020] font-bold border border-[rgba(232,160,32,0.3)]">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {formatName(user?.firstName, user?.lastName) || user?.email}
              </p>
              <p className="text-xs text-[#6B9E83]">
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

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="relative">
      {open ? (
        <div className="flex items-center gap-1.5 rounded-md bg-white/12 border border-[rgba(232,160,32,0.3)] pl-2.5 pr-1 h-8 focus-within:border-[#E8A020] transition-colors">
          <Search className="h-3.5 w-3.5 text-[#E8A020] shrink-0" />
          <Input
            ref={inputRef}
            autoFocus
            placeholder="Search..."
            className="h-7 w-44 border-0 bg-transparent text-white text-sm placeholder:text-white/40 focus-visible:ring-0 p-0"
            onBlur={() => setOpen(false)}
          />
          <button
            onClick={() => setOpen(false)}
            className="text-white/50 hover:text-white p-0.5 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="flex items-center gap-2 rounded-md bg-white/8 border border-white/12 px-2.5 h-8 text-white/60 hover:text-white hover:bg-white/12 hover:border-[rgba(232,160,32,0.3)] transition-all duration-150 text-sm"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:block text-xs">Search</span>
          <kbd className="hidden sm:block text-[9px] bg-white/10 px-1 rounded font-mono">⌘K</kbd>
        </button>
      )}
    </div>
  );
}

// ─── Icon button helper ───────────────────────────────────────────────────────

function TopNavIconBtn({
  onClick,
  title,
  children,
  href,
  badge,
}: {
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  href?: string;
  badge?: number;
}) {
  const cls =
    "relative h-8 w-8 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A020] focus-visible:ring-offset-1 focus-visible:ring-offset-[#061A12]";

  const inner = (
    <>
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-[#061A12]">
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

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className="hidden md:flex flex-col flex-shrink-0 border-r transition-all duration-200 overflow-hidden"
        style={{
          width: collapsed ? 52 : 220,
          background: "#0C3020",
          borderColor: "rgba(232,160,32,0.15)",
        }}
      >
        {/* Scrollable nav items */}
        <ScrollArea className="flex-1 overflow-hidden">
          <nav className="flex flex-col gap-0.5 p-1.5 pt-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href.length > 1 && pathname?.startsWith(item.href + "/"));
              const Icon = item.icon;

              const navBtn = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-all duration-150 min-w-0",
                    collapsed ? "justify-center" : "",
                    isActive
                      ? "bg-[rgba(232,160,32,0.15)] text-white border-l-2 border-[#E8A020]"
                      : "text-white/65 hover:text-white hover:bg-white/8 border-l-2 border-transparent"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] flex-shrink-0",
                      isActive ? "text-[#E8A020]" : "text-white/50 group-hover:text-[#E8A020]"
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate leading-none">{item.label}</span>
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{navBtn}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="bg-[#0C3020] border border-[rgba(232,160,32,0.2)] text-white text-xs"
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return navBtn;
            })}
          </nav>
        </ScrollArea>

        {/* Collapse toggle */}
        <div
          className="border-t p-1.5"
          style={{ borderColor: "rgba(232,160,32,0.15)" }}
        >
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center gap-2 w-full rounded-md px-2 py-2 text-xs text-white/40 hover:text-[#E8A020] hover:bg-white/8 transition-all duration-150",
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
  const { user, role, logout } = useAuth();
  const { tenant } = useTenant();
  const { isModuleInstalled } = useInstalledModules();
  const { unreadCount } = useNotifications();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [footerPanel, setFooterPanel] = useState<"chats" | "channels" | "contacts" | null>(null);
  const toggleFooterPanel = (panel: "chats" | "channels" | "contacts") =>
    setFooterPanel((prev) => (prev === panel ? null : panel));
  const coreModuleIds = ["sis", "communications", "users"];

  const visibleNavItems = navItems.filter((item) => {
    if (!item.module) return true;
    if (coreModuleIds.includes(item.module)) return true;
    return isModuleInstalled(item.module);
  });

  const anyUser = user as any;
  const displayName = formatName(anyUser?.firstName, anyUser?.lastName);
  const initials = getInitials(anyUser?.firstName, anyUser?.lastName);
  const groups = getNavGroups(role ?? "", visibleNavItems);
  const workspaceLabel = getRoleWorkspaceLabel(role ?? "", tenant?.name);

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
  const settingsHref = pathname?.startsWith("/platform")
    ? "/platform/settings"
    : "/admin/settings";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F3FBF6]">

      {/* ══ Top navigation bar — Zoho-style, EduMyles 2026 brand ══════════ */}
      <header
        className="flex-shrink-0 z-[2000]"
        style={{ background: "#061A12", borderBottom: "1px solid rgba(232,160,32,0.13)" }}
      >
        <div className="flex h-[52px] items-center gap-1.5 px-3 md:px-4">

          {/* Mobile menu */}
          <div className="flex md:hidden">
            <MobileDrawer
              groups={groups}
              role={role ?? ""}
              user={anyUser}
              tenant={tenant}
              logout={logout}
            />
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
            <Image src="/logo-icon.svg" alt="EduMyles" width={28} height={28} className="flex-shrink-0" priority />
            <span className="hidden sm:block text-sm font-bold tracking-tight" style={{ color: "#D4AF37" }}>
              EduMyles
            </span>
          </Link>

          {/* ── Workspace / school selector pill (like Zoho "Personal ▾") ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-1 rounded-md border border-white/12 bg-white/6 px-2.5 h-[28px] text-xs font-medium text-white/75 hover:text-white hover:bg-white/10 hover:border-[rgba(232,160,32,0.3)] transition-all duration-150 mr-1 max-w-[160px]">
                <span className="truncate">{workspaceLabel}</span>
                <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 border-[rgba(232,160,32,0.2)] bg-[#0C3020] text-white shadow-xl"
            >
              <DropdownMenuLabel className="text-[#6B9E83] text-xs font-bold uppercase tracking-wider">
                Workspace
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[rgba(232,160,32,0.12)]" />
              <DropdownMenuItem className="text-white/80 hover:text-white hover:bg-white/8 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E8A020]" />
                  <span className="font-medium">{workspaceLabel}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Separator */}
          <div className="hidden md:block w-px h-5 bg-white/10 mx-0.5" />

          {/* ── Horizontal navigation tabs (desktop) ── */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none mx-1">
            {groups.map((group) => {
              if (group.href && !group.items?.length) {
                const isActive =
                  pathname === group.href ||
                  (group.href.length > 1 &&
                    pathname.startsWith(group.href + "/"));
                return (
                  <Link
                    key={group.href}
                    href={group.href}
                    className={cn(
                      "relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 whitespace-nowrap",
                      isActive
                        ? "text-white bg-[rgba(232,160,32,0.18)]"
                        : "text-white/70 hover:text-white hover:bg-white/8"
                    )}
                  >
                    {group.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#E8A020]" />
                    )}
                  </Link>
                );
              }
              return (
                <NavGroupDropdown
                  key={group.label}
                  group={group}
                  pathname={pathname ?? ""}
                />
              );
            })}
          </nav>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-1 ml-auto">
            <GlobalSearch />

            <TopNavIconBtn
              onClick={() => router.refresh()}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </TopNavIconBtn>

            <TopNavIconBtn
              href={notificationsHref}
              title="Notifications"
              badge={unreadCount}
            >
              <Bell className="h-4 w-4" />
            </TopNavIconBtn>

            {/* Help icon */}
            <TopNavIconBtn title="Help & Support">
              <HelpCircle className="h-4 w-4" />
            </TopNavIconBtn>

            {/* Divider */}
            <div className="w-px h-5 bg-white/10 mx-0.5" />

            {/* ── User dropdown ── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg pl-1.5 pr-2 py-1 text-white hover:bg-white/8 transition-all duration-150 ml-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A020]">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={anyUser?.avatarUrl ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback className="text-[10px] bg-[rgba(232,160,32,0.2)] text-[#E8A020] font-bold border border-[rgba(232,160,32,0.35)]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-xs font-semibold text-white">
                      {displayName || anyUser?.email}
                    </span>
                    <span className="text-[10px] text-[#6B9E83]">
                      {getRoleLabel(role ?? "")}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-white/40 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-60 border-[rgba(232,160,32,0.2)] bg-[#0C3020] text-white shadow-xl"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-white">
                      {displayName || anyUser?.email}
                    </span>
                    <span className="text-xs text-[#6B9E83]">
                      {user?.email}
                    </span>
                    <Badge
                      variant="secondary"
                      className="mt-0.5 w-fit text-[10px] bg-[rgba(232,160,32,0.15)] text-[#E8A020] border border-[rgba(232,160,32,0.3)] font-semibold"
                    >
                      {getRoleLabel(role ?? "")}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[rgba(232,160,32,0.12)]" />
                <DropdownMenuItem asChild>
                  <Link
                    href={profileHref}
                    className="flex items-center gap-2.5 cursor-pointer text-white/80 hover:text-white hover:bg-white/8 py-2"
                  >
                    <User className="h-4 w-4 text-[#6B9E83]" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={settingsHref}
                    className="flex items-center gap-2.5 cursor-pointer text-white/80 hover:text-white hover:bg-white/8 py-2"
                  >
                    <Settings className="h-4 w-4 text-[#6B9E83]" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={notificationsHref}
                    className="flex items-center gap-2.5 cursor-pointer text-white/80 hover:text-white hover:bg-white/8 py-2"
                  >
                    <Zap className="h-4 w-4 text-[#6B9E83]" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge className="ml-auto h-5 min-w-[20px] px-1.5 bg-red-500 text-white border-0 text-[10px] font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[rgba(232,160,32,0.12)]" />
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
        <main className="flex-1 overflow-y-auto" style={{ background: "#F0F7F4" }}>
          {children}
        </main>
      </div>

      {/* ══ Footer popups (Zoho-style card panels) ════════════════════ */}
      {footerPanel && (
        <div
          className="fixed bottom-[44px] left-0 z-[3000] flex gap-2 px-3 pb-1 pointer-events-none"
          style={{ width: "auto" }}
        >
          {footerPanel === "chats" && (
            <div
              className="pointer-events-auto w-80 rounded-t-xl shadow-2xl border overflow-hidden flex flex-col"
              style={{ background: "#0C3020", borderColor: "rgba(232,160,32,0.2)", maxHeight: 420 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(232,160,32,0.15)" }}>
                <span className="text-sm font-semibold" style={{ color: "#D4AF37" }}>Chats</span>
                <button onClick={() => setFooterPanel(null)} className="text-white/40 hover:text-white transition-colors">
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
                    style={{ background: "rgba(232,160,32,0.15)", color: "#E8A020" }}
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
              style={{ background: "#0C3020", borderColor: "rgba(232,160,32,0.2)", maxHeight: 420 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(232,160,32,0.15)" }}>
                <span className="text-sm font-semibold" style={{ color: "#D4AF37" }}>Channels</span>
                <button onClick={() => setFooterPanel(null)} className="text-white/40 hover:text-white transition-colors">
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
                    style={{ background: "rgba(232,160,32,0.15)", color: "#E8A020" }}
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
              style={{ background: "#0C3020", borderColor: "rgba(232,160,32,0.2)", maxHeight: 420 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(232,160,32,0.15)" }}>
                <span className="text-sm font-semibold" style={{ color: "#D4AF37" }}>Contacts</span>
                <button onClick={() => setFooterPanel(null)} className="text-white/40 hover:text-white transition-colors">
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
                    style={{ background: "rgba(232,160,32,0.15)", color: "#E8A020" }}
                  >
                    Manage Contacts
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Bottom bar — full Zoho-style ══════════════════════════════ */}
      <footer
        className="flex-shrink-0 flex items-center justify-between px-3 h-[44px] text-xs border-t gap-2"
        style={{
          background: "#061A12",
          borderColor: "rgba(232,160,32,0.13)",
        }}
      >
        {/* ── Left: Chats / Channels / Contacts ── */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => toggleFooterPanel("chats")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150",
              footerPanel === "chats"
                ? "text-[#E8A020] bg-[rgba(232,160,32,0.15)]"
                : "text-white/55 hover:text-[#E8A020] hover:bg-white/8"
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
                ? "text-[#E8A020] bg-[rgba(232,160,32,0.15)]"
                : "text-white/55 hover:text-[#E8A020] hover:bg-white/8"
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
                ? "text-[#E8A020] bg-[rgba(232,160,32,0.15)]"
                : "text-white/55 hover:text-[#E8A020] hover:bg-white/8"
            )}
          >
            <Users2 className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Contacts</span>
          </button>
        </div>

        {/* ── Center: Smart Chat input ── */}
        <button
          className="flex-1 max-w-[360px] flex items-center gap-2 h-7 rounded-md bg-white/8 border border-white/12 px-3 text-white/40 hover:text-white/70 hover:bg-white/10 hover:border-[rgba(232,160,32,0.25)] transition-all duration-150 mx-2"
          title="Smart Chat (Ctrl+Space)"
        >
          <Zap className="h-3.5 w-3.5 text-[#E8A020] shrink-0" />
          <span className="text-[11px] truncate text-left">
            Here is your Smart Chat
          </span>
          <kbd className="ml-auto text-[9px] bg-white/8 px-1 rounded font-mono shrink-0 hidden sm:block">
            Ctrl+Space
          </kbd>
        </button>

        {/* ── Right: Bell + Support + Version + Lock ── */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Notifications */}
          <Link
            href={notificationsHref}
            className="relative h-7 w-7 flex items-center justify-center rounded-md text-white/55 hover:text-[#E8A020] hover:bg-white/8 transition-all duration-150"
            title="Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-[#061A12]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <div className="h-3.5 w-px bg-white/10" />

          {/* Need Support */}
          <Link
            href={sectionHref("tickets")}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-white/55 hover:text-[#E8A020] hover:bg-white/8 transition-all duration-150"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Need Support?</span>
          </Link>

          {/* Version badge */}
          <span className="hidden md:flex items-center h-5 px-1.5 rounded text-[9px] font-mono font-semibold bg-[rgba(232,160,32,0.12)] text-[#E8A020] border border-[rgba(232,160,32,0.2)]">
            EduMyles 2026
          </span>

          {/* Settings / lock */}
          <Link
            href={settingsHref}
            className="h-7 w-7 flex items-center justify-center rounded-md text-white/30 hover:text-[#E8A020] hover:bg-white/8 transition-all duration-150"
            title="Settings"
          >
            <Lock className="h-3.5 w-3.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default GlobalShell;
