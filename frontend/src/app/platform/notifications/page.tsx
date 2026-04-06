"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, AlertTriangle, CheckCircle, ExternalLink, Info, Loader2, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NotificationType = "all" | "alert" | "warning" | "success" | "info" | "system";

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

export default function PlatformNotificationsPage() {
  const router = useRouter();
  const { isLoading: authLoading, sessionToken } = useAuth();
  const [view, setView] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType>("all");
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);
  const [pendingBulkAction, setPendingBulkAction] = useState<"read-all" | null>(null);
  const [isRefreshing, startRefreshing] = useTransition();

  const notifications = usePlatformQuery(
    api.platform.notifications.queries.listNotifications,
    {
      sessionToken: sessionToken || "",
      unreadOnly: view === "unread",
      limit: 100,
    },
    !!sessionToken
  );

  const unreadCount = usePlatformQuery(
    api.platform.notifications.queries.getUnreadCount,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const markAsRead = useMutation(api.platform.notifications.mutations.markAsRead);
  const markAllAsRead = useMutation(api.platform.notifications.mutations.markAllAsRead);
  const dismissNotification = useMutation(api.platform.notifications.mutations.dismissNotification);

  const filteredNotifications = useMemo(() => {
    const list = notifications ?? [];
    if (typeFilter === "all") return list;
    return list.filter((notification: any) => notification.type === typeFilter);
  }, [notifications, typeFilter]);

  const availableTypes = useMemo(() => {
    const values = new Set<string>();
    for (const notification of notifications ?? []) {
      if (notification.type) values.add(notification.type);
    }
    return Array.from(values).sort();
  }, [notifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!sessionToken) return;
    setPendingNotificationId(notificationId);
    try {
      await markAsRead({
        sessionToken,
        notificationId: notificationId as any,
      });
    } catch (error: any) {
      console.error("Failed to mark notification as read:", error);
      toast.error(error?.message || "Failed to mark notification as read.");
    } finally {
      setPendingNotificationId(null);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    if (!sessionToken) return;
    setPendingNotificationId(notificationId);
    try {
      await dismissNotification({
        sessionToken,
        notificationId: notificationId as any,
      });
      toast.success("Notification dismissed.");
    } catch (error: any) {
      console.error("Failed to dismiss notification:", error);
      toast.error(error?.message || "Failed to dismiss notification.");
    } finally {
      setPendingNotificationId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!sessionToken) return;
    setPendingBulkAction("read-all");
    try {
      await markAllAsRead({ sessionToken });
      toast.success("All notifications marked as read.");
    } catch (error: any) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error(error?.message || "Failed to mark all notifications as read.");
    } finally {
      setPendingBulkAction(null);
    }
  };

  if (authLoading || notifications === undefined || unreadCount === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Platform-specific alerts, updates, and follow-up items for your admin session."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Notifications", href: "/platform/notifications" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startRefreshing(() => router.refresh())}
              disabled={isRefreshing}
            >
              {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Refresh
            </Button>
            {unreadCount > 0 ? (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={pendingBulkAction === "read-all"}>
                {pendingBulkAction === "read-all" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Mark all as read
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{unreadCount} unread</Badge>
          <Badge variant="outline">{filteredNotifications.length} visible</Badge>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Tabs value={view} onValueChange={(value) => setView(value as "all" | "unread")}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as NotificationType)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Bell}
              title="No notifications"
              description={
                view === "unread"
                  ? "You have no unread platform notifications for this filter."
                  : "You're all caught up. New platform notifications will appear here."
              }
              className="py-16"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredNotifications.map((notification: any, index: number) => {
              const isPending = pendingNotificationId === String(notification._id);
              const isUnread = !notification.isRead;

              return (
                <div key={notification._id}>
                  <div
                    className={cn(
                      "flex flex-col gap-4 p-4 transition-colors hover:bg-muted/30 md:flex-row md:items-start md:justify-between",
                      isUnread && "bg-muted/20"
                    )}
                  >
                    <div
                      className="flex min-w-0 flex-1 cursor-pointer items-start gap-4"
                      onClick={() => {
                        if (isUnread && !isPending) {
                          void handleMarkAsRead(String(notification._id));
                        }
                      }}
                    >
                      <div className="mt-0.5 shrink-0">{getNotificationIcon(notification.type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={cn(
                                "text-sm leading-snug text-foreground",
                                isUnread ? "font-semibold" : "font-medium"
                              )}
                            >
                              {notification.title}
                            </p>
                            <Badge variant="outline" className="capitalize">
                              {notification.type || "system"}
                            </Badge>
                          </div>
                          {isUnread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" /> : null}
                        </div>

                        {notification.message ? (
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          {notification.link ? <span>Action available</span> : null}
                          {isUnread ? <span>Unread</span> : <span>Read</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:ml-4">
                      {notification.link ? (
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (isUnread && !isPending) {
                                void handleMarkAsRead(String(notification._id));
                              }
                            }}
                          >
                            <ExternalLink className="mr-1 h-4 w-4" />
                            Open
                          </Link>
                        </Button>
                      ) : null}

                      {isUnread ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleMarkAsRead(String(notification._id))}
                          disabled={isPending}
                        >
                          {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                          Read
                        </Button>
                      ) : null}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDismiss(String(notification._id))}
                        disabled={isPending}
                      >
                        {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  {index < filteredNotifications.length - 1 ? <Separator /> : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
