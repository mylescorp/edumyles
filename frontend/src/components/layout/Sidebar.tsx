"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Star,
} from "lucide-react";
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
  const { user, logout } = useAuth();
  const { isModuleInstalled, isModuleActive, isLoading } = useInstalledModules();

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

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4"
           style={{ background: "linear-gradient(135deg,#061A12,#0C3020)" }}>
        <Image
          src="/logo-icon.svg"
          alt="EduMyles"
          width={28}
          height={28}
          className="flex-shrink-0"
          priority
        />
        {!collapsed && (
          <span className="text-sm font-bold text-[#D4AF37] tracking-tight transition-all duration-200">EduMyles</span>
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
          <nav className="flex flex-col gap-1 px-2">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              
              // Add notification badges for certain items
              const getBadgeCount = (href: string) => {
                switch (href) {
                  case "/admin/admissions":
                    return 5; // Mock count
                  case "/admin/finance":
                    return 12; // Mock count
                  default:
                    return null;
                }
              };

              const badgeCount = getBadgeCount(item.href);

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={isMobile ? onClose : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 relative",
                    "hover:bg-[rgba(232,160,32,0.1)] hover:translate-x-0.5",
                    isActive
                      ? "bg-[rgba(232,160,32,0.15)] text-white shadow-sm border-l-2 border-[#E8A020]"
                      : "text-sidebar-text hover:text-white"
                  )}
                >
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded transition-all duration-150",
                    isActive ? "text-[#E8A020]" : "text-sidebar-icon group-hover:text-[#E8A020]"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  
                  {/* Module status indicators */}
                  {!collapsed && item.module && (
                    <div className="ml-auto flex items-center gap-1">
                      {/* Core module indicator */}
                      {coreModuleIds.includes(item.module) && (
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-em-amber-500" />
                        </div>
                      )}
                      
                      {/* Active/inactive indicator for optional modules */}
                      {!coreModuleIds.includes(item.module) && (
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          isModuleActive(item.module) ? "bg-em-success" : "bg-gray-400"
                        )} />
                      )}
                      
                      {/* Badge counts */}
                      {badgeCount && (
                        <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs bg-em-danger border-0 shadow-sm">
                          {badgeCount}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Badge counts for collapsed state */}
                  {collapsed && badgeCount && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-[10px]">
                      {badgeCount}
                    </Badge>
                  )}
                </Link>
              );

              if (collapsed && !isMobile) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="flex items-center gap-2">
                        <span>{item.label}</span>
                        <div className="flex items-center gap-1">
                          {/* Core module indicator in tooltip */}
                          {item.module && coreModuleIds.includes(item.module) && (
                            <Star className="h-3 w-3 text-em-amber-500" />
                          )}
                          {/* Badge count */}
                          {badgeCount && (
                            <Badge variant="destructive" className="h-4 w-4 rounded-full p-0 text-[10px]">
                              {badgeCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* User section at bottom */}
      {!isMobile && (
        <div className="border-t border-sidebar-border p-4" style={{ background: "linear-gradient(to top, rgba(6,26,18,0.6), transparent)" }}>
          <div className={cn(
            "flex items-center gap-3 transition-all duration-200",
            collapsed ? "justify-center" : ""
          )}>
            <div className="relative h-8 w-8 rounded-full border border-[rgba(232,160,32,0.35)] bg-[rgba(232,160,32,0.15)] flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-[#E8A020]">
                {(user as any)?.firstName?.[0]?.toUpperCase() ?? (user as any)?.email?.[0]?.toUpperCase() ?? "U"}
              </span>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#26A65B] border-2 border-[#0C3020]"></div>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-text-active truncate">
                  {[(user as any)?.firstName, (user as any)?.lastName].filter(Boolean).join(" ") || (user as any)?.email || "User"}
                </p>
                <p className="text-xs text-sidebar-text truncate">{user?.email ?? ""}</p>
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
          <SidebarContent />
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
      <SidebarContent />
    </aside>
  );
}
