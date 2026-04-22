"use client";

import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";
import { useQuery, useMutation } from "./useSSRSafeConvex";
import { usePathname } from "next/navigation";

function unwrapQueryValue<T>(result: any): T | undefined {
  if (result === undefined || result === null) return undefined;
  if (typeof result === "object") {
    if ("value" in result && result.value !== undefined) return result.value as T;
    if ("data" in result && result.data !== undefined) return result.data as T;
  }
  return result as T;
}

export function useNotifications() {
  const { sessionToken, isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isPlatformRoute = pathname?.startsWith("/platform");
  const hasLiveTenantSession =
    !!sessionToken && sessionToken !== "dev_session_token";
  const isLocalBootstrapSession =
    !!sessionToken && sessionToken.startsWith("dev-");
  const canQueryNotifications =
    !isLoading &&
    isAuthenticated &&
    hasLiveTenantSession &&
    !isLocalBootstrapSession;

  const notificationsResult = useQuery(
    isPlatformRoute
      ? api.platform.notifications.queries.listNotifications
      : api.notifications.getNotifications,
    canQueryNotifications ? { sessionToken, limit: 20 } : "skip"
  );

  const unreadCountResult = useQuery(
    isPlatformRoute
      ? api.platform.notifications.queries.getUnreadCount
      : api.notifications.getUnreadCount,
    canQueryNotifications ? { sessionToken } : "skip"
  );

  const markAsRead = useMutation(
    isPlatformRoute
      ? api.platform.notifications.mutations.markAsRead
      : api.notifications.markAsRead
  );
  const markAllAsRead = useMutation(
    isPlatformRoute
      ? api.platform.notifications.mutations.markAllAsRead
      : api.notifications.markAllAsRead
  );

  const notifications = unwrapQueryValue<any[]>(notificationsResult);
  const unreadCount = unwrapQueryValue<number>(unreadCountResult);

  const normalizedNotifications = (notifications && Array.isArray(notifications) ? notifications : []).map(
    (notification: any) => ({
      ...notification,
      message: notification.message ?? notification.body,
      link: notification.link ?? notification.actionUrl,
      read: notification.read ?? notification.isRead,
    })
  );

  return {
    notifications: normalizedNotifications,
    unreadCount: unreadCount ?? 0,
    isLoading: canQueryNotifications && notifications === undefined,
    markAsRead: (notificationId: string) => {
      if (!canQueryNotifications) return;
      markAsRead({ sessionToken, notificationId: notificationId as any });
    },
    markAllAsRead: () => {
      if (canQueryNotifications) markAllAsRead({ sessionToken });
    },
  };
}
