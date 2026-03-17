"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useAuth } from "@/hooks/useAuth";
import {
  GraduationCap,
  MessageSquare,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  UserCog,
  Library,
  Bus,
  Headphones,
  Wallet,
  ShoppingCart,
  Star,
  Search,
  Plus,
  Settings,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CORE_MODULE_ICONS = {
  sis: GraduationCap,
  communications: MessageSquare,
  users: Users,
};

const OPTIONAL_MODULE_ICONS = {
  admissions: BookOpen,
  academics: BookOpen,
  finance: DollarSign,
  timetable: Calendar,
  hr: UserCog,
  library: Library,
  transport: Bus,
  tickets: Headphones,
  ewallet: Wallet,
  ecommerce: ShoppingCart,
};

const CORE_MODULES_ORDER = ["sis", "communications", "users"];
const OPTIONAL_MODULES_ORDER = ["admissions", "academics", "finance", "hr", "timetable"];

export function TopModuleBar() {
  const { sessionToken, user } = useAuth();
  const { isModuleInstalled, isModuleActive, installedModuleIds } = useInstalledModules();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort modules for top bar
  const topBarModules = [
    // Core modules (always visible)
    ...CORE_MODULES_ORDER
      .filter(moduleId => isModuleInstalled(moduleId))
      .map(moduleId => ({
        moduleId,
        name: moduleId === "sis" ? "Students" : moduleId === "communications" ? "Messages" : "Users",
        href: moduleId === "sis" ? "/admin/students" : moduleId === "communications" ? "/admin/communications" : "/admin/users",
        icon: CORE_MODULE_ICONS[moduleId as keyof typeof CORE_MODULE_ICONS],
        isCore: true,
        isActive: isModuleActive(moduleId),
      })),
    
    // Top optional modules (most used)
    ...OPTIONAL_MODULES_ORDER
      .filter(moduleId => isModuleInstalled(moduleId))
      .slice(0, 4)
      .map(moduleId => ({
        moduleId,
        name: moduleId.charAt(0).toUpperCase() + moduleId.slice(1),
        href: `/admin/${moduleId}`,
        icon: OPTIONAL_MODULE_ICONS[moduleId as keyof typeof OPTIONAL_MODULE_ICONS],
        isCore: false,
        isActive: isModuleActive(moduleId),
      })),
  ];

  // Additional modules for dropdown
  const additionalModules = installedModuleIds
    .filter(id => !topBarModules.some(m => m.moduleId === id))
    .map(moduleId => ({
      moduleId,
      name: moduleId.charAt(0).toUpperCase() + moduleId.slice(1),
      href: `/admin/${moduleId}`,
      icon: OPTIONAL_MODULE_ICONS[moduleId as keyof typeof OPTIONAL_MODULE_ICONS] || Settings,
      isCore: CORE_MODULES_ORDER.includes(moduleId),
      isActive: isModuleActive(moduleId),
    }))
    .slice(0, 5);

  const filteredModules = topBarModules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        {/* Left side - Core modules */}
        <div className="flex items-center gap-1 flex-1">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            const isActive = pathname === module.href || pathname.startsWith(module.href + "/");
            
            return (
              <Link key={module.moduleId} href={module.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 h-9",
                    isActive && "bg-em-primary text-em-primary-foreground hover:bg-em-primary/90"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{module.name}</span>
                  
                  {/* Core module indicator */}
                  {module.isCore && (
                    <Star className="h-3 w-3 text-amber-500" />
                  )}
                  
                  {/* Active/inactive indicator */}
                  {!module.isCore && (
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      module.isActive ? "bg-em-success" : "bg-gray-400"
                    )} />
                  )}
                </Button>
              </Link>
            );
          })}

          {/* More modules dropdown */}
          {additionalModules.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 h-9">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">More</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>More Modules</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {additionalModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <DropdownMenuItem key={module.moduleId} asChild>
                      <Link href={module.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div className="flex-1">
                          {module.name}
                          <div className="flex items-center gap-1">
                            {module.isCore && (
                              <Star className="h-3 w-3 text-amber-500" />
                            )}
                            {!module.isCore && (
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                module.isActive ? "bg-em-success" : "bg-gray-400"
                              )} />
                            )}
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/modules" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Manage Modules</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right side - Search and actions */}
        <div className="flex items-center gap-2">
          {/* Quick search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Quick search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-64 h-9"
            />
          </div>

          {/* Module management button */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/modules" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Modules</span>
            </Link>
          </Button>

          {/* Notification badges */}
          <Badge variant="secondary" className="hidden sm:flex">
            {installedModuleIds.length} modules
          </Badge>
        </div>
      </div>
    </div>
  );
}
