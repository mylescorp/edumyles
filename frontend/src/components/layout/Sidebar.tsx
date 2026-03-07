"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap,
  Menu,
  X,
  Home
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

export function Sidebar({ navItems, installedModules, isMobile = false, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => {
    if (!item.module) return true;
    if (!installedModules) return true;
    return installedModules.includes(item.module);
  });

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <GraduationCap className="h-7 w-7 shrink-0 text-sidebar-primary" />
        {!collapsed && (
          <span className="text-lg font-bold text-sidebar-foreground">EduMyles</span>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 w-8 p-0"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 w-8 p-0"
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
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && badgeCount && (
                    <Badge variant="destructive" className="ml-auto h-5 w-5 rounded-full p-0 text-xs">
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
                        {badgeCount && (
                          <Badge variant="destructive" className="h-4 w-4 rounded-full p-0 text-[10px]">
                            {badgeCount}
                          </Badge>
                        )}
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
        <div className="border-t p-4">
          <div className={cn(
            "flex items-center gap-3",
            collapsed ? "justify-center" : ""
          )}>
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-xs font-medium">A</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">admin@edumyles.com</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar">
          <SidebarContent />
        </div>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
