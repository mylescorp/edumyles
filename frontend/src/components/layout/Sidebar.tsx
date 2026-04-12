"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, X, Star, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NavItem } from "@/lib/routes";

interface SidebarProps {
  navItems: NavItem[];
  installedModules?: string[];
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ navItems, isMobile = false, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout, sessionToken } = useAuth();
  const { can, isLoaded: platformPermissionsLoaded } = usePlatformPermissions();
  const { isModuleInstalled, isModuleActive } = useInstalledModules();
  const isPlatformSidebar = navItems.some((item) => item.href.startsWith("/platform"));
  const pendingAdmissionsResult = useQuery(
    api.modules.admissions.queries.listApplications,
    sessionToken ? { sessionToken, status: "pending" } : "skip"
  );
  const pendingInvoicesResult = useQuery(
    api.modules.finance.queries.listInvoices,
    sessionToken ? { sessionToken, status: "pending" } : "skip"
  );

  const pendingAdmissions = pendingAdmissionsResult?.data;
  const pendingInvoices = pendingInvoicesResult?.data;

  // Core module IDs that should always be visible
  const coreModuleIds = ["sis", "communications", "users"];

  // Filter and sort navigation items based on module installation status
  const filteredItems = navItems
    .filter((item) => {
      // Always show items without module association (Dashboard, Settings, etc.)
      if (!item.module) return true;

      // Always show core modules
      if (coreModuleIds.includes(item.module)) return true;

      // Show optional modules only if installed
      return isModuleInstalled(item.module);
    })
    .sort((a, b) => {
      // Core modules first
      const aIsCore = a.module ? coreModuleIds.includes(a.module) : false;
      const bIsCore = b.module ? coreModuleIds.includes(b.module) : false;

      if (aIsCore && !bIsCore) return -1;
      if (!aIsCore && bIsCore) return 1;

      // Maintain original order for same category
      return 0;
    });

  const groupedItems = filteredItems.reduce<Array<{ section: string; items: NavItem[] }>>((groups, item) => {
    const section = item.section ?? "__standalone__";
    const existingGroup = groups.find((group) => group.section === section);
    if (existingGroup) {
      existingGroup.items.push(item);
      return groups;
    }

    groups.push({ section, items: [item] });
    return groups;
  }, []);

  const activeSection = useMemo(() => {
    const activeGroup = groupedItems.find((group) =>
      group.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    );
    return activeGroup?.section ?? groupedItems[0]?.section ?? "__standalone__";
  }, [groupedItems, pathname]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const isSectionExpanded = (section: string) => {
    if (collapsed) return true;
    if (expandedSections[section] !== undefined) {
      return expandedSections[section];
    }
    return section === "__standalone__" || section === activeSection;
  };

  const toggleSection = (section: string) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !isSectionExpanded(section),
    }));
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4"
        style={{ background: "linear-gradient(135deg,#061A12,#0C3020)" }}
      >
        <Image
          src="/logo-icon.svg"
          alt="EduMyles"
          width={28}
          height={28}
          className="flex-shrink-0"
          priority
        />
        {!collapsed && (
          <span className="text-sm font-bold text-[#D4AF37] tracking-tight transition-all duration-200">
            EduMyles
          </span>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 w-8 p-0 text-sidebar-icon hover:text-sidebar-text-active hover:bg-sidebar-accent/50 transition-all duration-200"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 w-8 p-0 text-sidebar-icon hover:text-sidebar-text-active hover:bg-sidebar-accent/50 transition-all duration-200"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col gap-4 px-2 py-1">
            {groupedItems.map((group, groupIndex) => (
              <div
                key={group.section}
                className={cn(
                  "space-y-1.5",
                  groupIndex > 0 && "border-t border-sidebar-border/70 pt-3"
                )}
              >
                {!collapsed && group.section !== "__standalone__" ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.section)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors",
                      "hover:bg-sidebar-accent/40"
                    )}
                  >
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-text/70">
                        {group.section}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-sidebar-text/60 transition-transform duration-200",
                        isSectionExpanded(group.section) ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>
                ) : group.section !== "__standalone__" ? (
                  <div className="mx-auto h-px w-8 bg-sidebar-border/70" />
                ) : null}
                {isSectionExpanded(group.section) &&
                  group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              // Add notification badges for certain items
              const getBadgeCount = (href: string) => {
                switch (href) {
                  case "/admin/admissions":
                    return pendingAdmissions?.length ?? null;
                  case "/admin/finance":
                    return pendingInvoices?.length ?? null;
                  default:
                    return null;
                }
              };

              const badgeCount = getBadgeCount(item.href);

              const disabledByPermission =
                Boolean(isPlatformSidebar && item.permission) &&
                platformPermissionsLoaded &&
                !can(item.permission as string);

              const itemContent = (
                <>
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded transition-all duration-150",
                      disabledByPermission
                        ? "text-white/25"
                        : isActive
                          ? "text-[#E8A020]"
                          : "text-sidebar-icon group-hover:text-[#E8A020]"
                    )}
                  >
                    {disabledByPermission ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  {!collapsed && (
                    <span className={cn("truncate", disabledByPermission && "text-white/35")}>
                      {item.label}
                    </span>
                  )}

                  {/* Module status indicators */}
                  {!collapsed && item.module && !disabledByPermission && (
                    <div className="ml-auto flex items-center gap-1">
                      {/* Core module indicator */}
                      {coreModuleIds.includes(item.module) && (
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-em-amber-500" />
                        </div>
                      )}

                      {/* Active/inactive indicator for optional modules */}
                      {!coreModuleIds.includes(item.module) && (
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            isModuleActive(item.module) ? "bg-em-success" : "bg-gray-400"
                          )}
                        />
                      )}

                      {/* Badge counts */}
                      {badgeCount && (
                        <Badge
                          variant="destructive"
                          className="h-5 w-5 rounded-full p-0 text-xs bg-em-danger border-0 shadow-sm"
                        >
                          {badgeCount}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Badge counts for collapsed state */}
                  {collapsed && badgeCount && !disabledByPermission && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-[10px]"
                    >
                      {badgeCount}
                    </Badge>
                  )}
                </>
              );

              const sharedClassName = cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                disabledByPermission
                  ? "cursor-not-allowed opacity-80"
                  : "hover:bg-[rgba(232,160,32,0.1)] hover:translate-x-0.5",
                isActive && !disabledByPermission
                  ? "bg-[rgba(232,160,32,0.15)] text-white shadow-sm border-l-2 border-[#E8A020]"
                  : disabledByPermission
                    ? "text-white/40"
                    : "text-sidebar-text hover:text-white"
              );

              const link = disabledByPermission ? (
                <div key={item.href} className={sharedClassName} aria-disabled="true">
                  {itemContent}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={isMobile ? onClose : undefined}
                  className={sharedClassName}
                >
                  {itemContent}
                </Link>
              );

                  if (collapsed && !isMobile) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {group.section}
                            </p>
                            <div className="flex items-center gap-2">
                              <span>{item.label}</span>
                              {disabledByPermission && (
                                <span className="text-[10px] text-white/60">
                                  Requires {item.permission}
                                </span>
                              )}
                              <div className="flex items-center gap-1">
                                {item.module && coreModuleIds.includes(item.module) && (
                                  <Star className="h-3 w-3 text-em-amber-500" />
                                )}
                                {badgeCount && (
                                  <Badge
                                    variant="destructive"
                                    className="h-4 w-4 rounded-full p-0 text-[10px]"
                                  >
                                    {badgeCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  if (disabledByPermission && !collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">
                          Requires {item.permission}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return link;
                })}
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* User section at bottom */}
      {!isMobile && (
        <div className="border-t border-sidebar-border bg-[linear-gradient(to_top,rgba(6,26,18,0.8),rgba(6,26,18,0.2))] p-4">
          <div
            className={cn(
              "flex items-center gap-3 transition-all duration-200",
              collapsed ? "justify-center" : ""
            )}
          >
            <div className="relative h-8 w-8 rounded-full border border-[rgba(232,160,32,0.35)] bg-[rgba(232,160,32,0.15)] flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-[#E8A020]">
                {(user as any)?.firstName?.[0]?.toUpperCase() ??
                  (user as any)?.email?.[0]?.toUpperCase() ??
                  "U"}
              </span>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#26A65B] border-2 border-[#0C3020]"></div>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-text-active truncate">
                  {[(user as any)?.firstName, (user as any)?.lastName].filter(Boolean).join(" ") ||
                    (user as any)?.email ||
                    "User"}
                </p>
                <p className="text-xs text-sidebar-text truncate">{user?.email ?? ""}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-sidebar-text/60">
                  Workspace access
                </p>
              </div>
            )}
            {!collapsed && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-sidebar-text hover:text-red-500 hover:bg-red-50/10"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign out</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-y-0 left-0 z-[10000] w-64 bg-sidebar">
          {sidebarContent}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-sidebar-border bg-sidebar-bg transition-all duration-300 z-[1000]",
        "shadow-lg",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
