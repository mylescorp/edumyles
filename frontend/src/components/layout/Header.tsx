"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, User, Settings, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useNotifications } from "@/hooks/useNotifications";
import { usePathname } from "next/navigation";
import { getInitials, formatName } from "@/lib/formatters";
import { getRoleLabel } from "@/lib/routes";
import Link from "next/link";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, role, logout } = useAuth();
  const { tenant } = useTenant();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();

  const anyUser = user as any;
  const displayName = formatName(anyUser?.firstName, anyUser?.lastName);
  const initials = getInitials(anyUser?.firstName, anyUser?.lastName);
  const notificationsHref = pathname?.startsWith("/platform")
    ? "/platform/audit"
    : "/admin/notifications";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6 z-[2000] relative">
      {/* Left: Mobile menu toggle + tenant name */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-8 w-8 p-0"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">
          {tenant?.name ?? "EduMyles"}
        </h2>
        {role && (
          <Badge variant="secondary" className="text-xs">
            {getRoleLabel(role)}
          </Badge>
        )}
      </div>

      {/* Right: notifications + user dropdown */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link
          href={notificationsHref}
          className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 hover:bg-accent">
            <Avatar className="h-8 w-8">
              <AvatarImage src={anyUser?.avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/platform/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/platform/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
