"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  X,
  Info,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  message: <MessageSquare className="h-4 w-4 text-purple-500" />,
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationCenter() {
  const { sessionToken } = useAuth();
  const [open, setOpen] = useState(false);

  const unreadCount = usePlatformQuery(
    api.platform.notifications.queries.getUnreadCount,
    { sessionToken },
    !!sessionToken
  ) as number | undefined;

  const notifications = usePlatformQuery(
    api.platform.notifications.queries.listNotifications,
    { sessionToken, limit: 20 },
    !!sessionToken && open
  ) as any[] | undefined;

  const markAsRead = useMutation(api.platform.notifications.mutations.markAsRead);
  const markAllAsRead = useMutation(api.platform.notifications.mutations.markAllAsRead);
  const dismissNotification = useMutation(api.platform.notifications.mutations.dismissNotification);

  const handleMarkRead = async (notificationId: any) => {
    if (!sessionToken) return;
    try {
      await markAsRead({ sessionToken, notificationId });
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    if (!sessionToken) return;
    try {
      await markAllAsRead({ sessionToken });
    } catch {
      // silently fail
    }
  };

  const handleDismiss = async (notificationId: any) => {
    if (!sessionToken) return;
    try {
      await dismissNotification({ sessionToken, notificationId });
    } catch {
      // silently fail
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {(unreadCount ?? 0) > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs bg-red-500 text-white border-0">
              {unreadCount! > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {(unreadCount ?? 0) > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkAllRead}>
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {!notifications ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n: any) => (
              <div
                key={n._id}
                className={`flex items-start gap-3 p-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                  !n.read ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="mt-0.5">
                  {TYPE_ICONS[n.type] ?? TYPE_ICONS.info}
                </div>
                <div className="flex-1 min-w-0">
                  {n.actionUrl ? (
                    <Link
                      href={n.actionUrl}
                      className="text-sm font-medium hover:underline"
                      onClick={() => {
                        if (!n.read) handleMarkRead(n._id);
                        setOpen(false);
                      }}
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{n.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMarkRead(n._id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground"
                    onClick={() => handleDismiss(n._id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
