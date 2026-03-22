"use client";

import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function getNotificationIcon(type: string) {
  switch (type) {
    case "warning":
    case "alert":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "info":
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
}

export default function AdminNotificationsPage() {
  const { isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

  if (authLoading || isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="View and manage your school notifications and alerts."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Notifications" },
        ]}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {unreadCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{unreadCount} unread</Badge>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-foreground mb-1">
              No notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up. New notifications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {notifications.map((notification: any, index: number) => (
              <div key={notification._id}>
                <div
                  className={cn(
                    "flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-muted/50",
                    !notification.read && "bg-muted/30"
                  )}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(String(notification._id));
                    }
                  }}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !notification.read
                            ? "font-semibold text-foreground"
                            : "font-medium text-foreground"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="mt-1 shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
