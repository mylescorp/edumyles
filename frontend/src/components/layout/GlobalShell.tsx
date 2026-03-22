"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
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
  GraduationCap,
  ChevronDown,
  X,
} from "lucide-react";
import { ImpersonationBanner } from "./ImpersonationBanner";
import type { NavItem } from "@/lib/routes";

// ─── Nav group definitions ────────────────────────────────────────────────────

export interface NavGroup {
  label: string;
  href?: string; // direct link (no dropdown)
  items?: { label: string; href: string }[];
}

// Platform-admin nav groups matching the screenshot layout
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

// Flat-item nav for simpler roles (shown as horizontal tabs)
function navItemsToGroups(items: NavItem[]): NavGroup[] {
  return items.map((item) => ({ label: item.label, href: item.href }));
}

function getNavGroups(role: string, navItems: NavItem[]): NavGroup[] {
  if (role === "master_admin" || role === "super_admin") return PLATFORM_NAV_GROUPS;
  if (
    role === "school_admin" ||
    role === "principal" ||
    role === "bursar" ||
    role === "hr_manager" ||
    role === "librarian" ||
    role === "transport_manager"
  )
    return ADMIN_NAV_GROUPS;
  // Teachers, students, parents, alumni, partners — simple horizontal tabs
  return navItemsToGroups(navItems);
}

// ─── Role accent colour ───────────────────────────────────────────────────────

function getRoleAccent(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "bg-[#1A4731]";
    case "school_admin":
    case "principal":
    case "bursar":
    case "hr_manager":
    case "librarian":
    case "transport_manager":
      return "bg-blue-900";
    case "teacher":
      return "bg-teal-900";
    case "student":
      return "bg-purple-900";
    case "parent":
      return "bg-orange-900";
    case "alumni":
      return "bg-rose-900";
    case "partner":
      return "bg-indigo-900";
    default:
      return "bg-[#1A4731]";
  }
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
            "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap",
            isGroupActive
              ? "bg-white/20 text-white"
              : "text-white/75 hover:text-white hover:bg-white/10"
          )}
        >
          {group.label}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {group.items?.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  isActive && "font-medium text-primary"
                )}
              >
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
  role,
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
  const accent = getRoleAccent(role);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        {/* Drawer header */}
        <div className={cn("flex items-center gap-3 p-4", accent)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">EduMyles</p>
            <p className="text-xs text-white/60">{tenant?.name ?? "Platform"}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
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
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    {group.label}
                  </Link>
                );
              }
              // Group with sub-items
              const isGroupActive = group.items?.some(
                (item) =>
                  pathname === item.href || pathname.startsWith(item.href + "/")
              );
              return (
                <div key={group.label} className="mb-1">
                  <p
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold uppercase tracking-wider",
                      isGroupActive ? "text-primary" : "text-muted-foreground"
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
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ml-1",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-accent"
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
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="text-xs bg-primary text-white">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {formatName(user?.firstName, user?.lastName) || user?.email}
              </p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => { setOpen(false); logout(); }}
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
        <div className="flex items-center gap-1 rounded-md bg-white/15 border border-white/20 pl-2 pr-1 h-8">
          <Search className="h-3.5 w-3.5 text-white/60 shrink-0" />
          <Input
            ref={inputRef}
            autoFocus
            placeholder="Search..."
            className="h-7 w-40 border-0 bg-transparent text-white text-sm placeholder:text-white/50 focus-visible:ring-0 p-0"
            onBlur={() => setOpen(false)}
          />
          <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white p-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="flex items-center gap-2 rounded-md bg-white/10 border border-white/15 px-2.5 h-8 text-white/70 hover:text-white hover:bg-white/15 transition-colors text-sm"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Search</span>
          <kbd className="hidden sm:block text-[10px] bg-white/10 px-1 rounded">⌘K</kbd>
        </button>
      )}
    </div>
  );
}

// ─── Main GlobalShell ─────────────────────────────────────────────────────────

interface GlobalShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
}

export function GlobalShell({ children, navItems }: GlobalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const { tenant } = useTenant();
  const { unreadCount } = useNotifications();

  const anyUser = user as any;
  const displayName = formatName(anyUser?.firstName, anyUser?.lastName);
  const initials = getInitials(anyUser?.firstName, anyUser?.lastName);
  const accent = getRoleAccent(role ?? "");
  const groups = getNavGroups(role ?? "", navItems);

  const notificationsHref = pathname?.startsWith("/platform")
    ? "/platform/notifications"
    : pathname?.startsWith("/portal/student")
    ? "/portal/student/notifications"
    : pathname?.startsWith("/portal/teacher")
    ? "/portal/teacher/notifications"
    : pathname?.startsWith("/portal/parent")
    ? "/portal/parent/notifications"
    : pathname?.startsWith("/portal/alumni")
    ? "/portal/alumni/notifications"
    : pathname?.startsWith("/portal/partner")
    ? "/portal/partner/notifications"
    : "/admin/notifications";

  const profileHref = pathname?.startsWith("/platform")
    ? "/platform/profile"
    : pathname?.startsWith("/portal/student")
    ? "/portal/student/profile"
    : pathname?.startsWith("/portal/teacher")
    ? "/portal/teacher/profile"
    : pathname?.startsWith("/portal/parent")
    ? "/portal/parent/profile"
    : pathname?.startsWith("/portal/alumni")
    ? "/portal/alumni/profile"
    : pathname?.startsWith("/portal/partner")
    ? "/portal/partner/profile"
    : "/admin/profile";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
      {/* ── Top navigation bar ─────────────────────────────────────────────── */}
      <header className={cn("flex-shrink-0 z-[2000]", accent)}>
        <div className="flex h-14 items-center gap-2 px-3 md:px-4">
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

          {/* Logo + org switcher */}
          <Link
            href={role === "master_admin" || role === "super_admin" ? "/platform" : role === "school_admin" ? "/admin" : "/"}
            className="flex items-center gap-2 shrink-0 mr-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="hidden sm:block text-sm font-bold text-white">EduMyles</span>
          </Link>

          {/* Org context pill */}
          {tenant?.name && (
            <div className="hidden md:flex items-center gap-1 bg-white/10 border border-white/15 rounded-md px-2 h-7 text-xs text-white/80">
              <span>{tenant.name}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </div>
          )}

          {/* ── Horizontal navigation (desktop) ── */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none mx-2">
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
                      "px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/75 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {group.label}
                  </Link>
                );
              }
              return (
                <NavGroupDropdown key={group.label} group={group} pathname={pathname ?? ""} />
              );
            })}
          </nav>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-1.5 ml-auto">
            <GlobalSearch />

            {/* Refresh */}
            <button
              onClick={() => router.refresh()}
              className="h-8 w-8 flex items-center justify-center rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Notifications */}
            <Link
              href={notificationsHref}
              className="relative h-8 w-8 flex items-center justify-center rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-white/20">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md pl-1 pr-2 py-1 text-white hover:bg-white/10 transition-colors ml-1">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={anyUser?.avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback className="text-[10px] bg-white/20 text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-xs font-medium">{displayName || anyUser?.email}</span>
                    <span className="text-[10px] text-white/60">{getRoleLabel(role ?? "")}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-white/60 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{displayName || anyUser?.email}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                    <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                      {getRoleLabel(role ?? "")}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={profileHref} className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={profileHref} className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── Impersonation banner (below nav) ────────────────────────────────── */}
      <ImpersonationBanner />

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default GlobalShell;
