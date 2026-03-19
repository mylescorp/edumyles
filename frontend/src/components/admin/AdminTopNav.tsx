"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  MessageSquare,
  Calendar,
  FolderOpen,
  CheckSquare,
  FileText,
  Shield,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Search,
  Grid3x3,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

const APP_ICONS = [
  { name: "Cliq", icon: MessageSquare, href: "/admin/communications", color: "text-blue-600" },
  { name: "Calendar", icon: Calendar, href: "/admin/timetable", color: "text-green-600" },
  { name: "WorkDrive", icon: FolderOpen, href: "/admin/library", color: "text-orange-600" },
  { name: "Tasks", icon: CheckSquare, href: "/admin/tasks", color: "text-purple-600" },
  { name: "Notes", icon: FileText, href: "/admin/notes", color: "text-red-600" },
  { name: "Vault", icon: Shield, href: "/admin/security", color: "text-gray-600" },
];

interface AdminTopNavProps {
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function AdminTopNav({ onMobileMenuToggle, mobileMenuOpen = false }: AdminTopNavProps) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const anyUser = user as any;
  const displayName =
    `${anyUser?.firstName || ""} ${anyUser?.lastName || ""}`.trim() ||
    anyUser?.email ||
    "User";

  const handleHome = () => {
    router.push("/admin");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm">
      {/* Left side — Hamburger (mobile) + Personal dropdown + Home + App icons */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger button — only visible on small screens */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-8 w-8 p-0"
          onClick={onMobileMenuToggle}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Personal dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-8 px-3 hover:bg-gray-100"
            >
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:inline text-sm font-medium">Personal</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="flex items-center gap-2 text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Home button */}
        <Button
          variant="ghost"
          onClick={handleHome}
          className={cn(
            "hidden sm:flex items-center gap-2 h-8 px-3 hover:bg-gray-100",
            pathname === "/admin" && "bg-gray-100"
          )}
        >
          <Home className="h-4 w-4" />
          <span className="text-sm font-medium">Home</span>
        </Button>

        {/* App icons — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-1">
          {APP_ICONS.map((app) => {
            const Icon = app.icon;
            const isActive = pathname?.startsWith(app.href);

            return (
              <Link key={app.name} href={app.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  title={app.name}
                  className={cn(
                    "h-8 w-8 p-0 hover:bg-gray-100",
                    isActive && "bg-gray-100"
                  )}
                >
                  <Icon className={cn("h-4 w-4", app.color)} />
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right side — Search + Tenant info */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
          />
        </div>

        {/* Tenant info */}
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-gray-500 hidden sm:block" />
          <span className="hidden sm:inline text-sm font-medium text-gray-700">
            {tenant?.name || "EduMyles"}
          </span>
          <Badge variant="secondary" className="text-xs">
            Admin
          </Badge>
        </div>
      </div>
    </header>
  );
}
