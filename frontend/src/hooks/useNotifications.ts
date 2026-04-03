"use client";

import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";
import { useQuery, useMutation } from "./useSSRSafeConvex";

export function useNotifications() {
  const { sessionToken, isLoading, isAuthenticated } = useAuth();
  const hasLiveTenantSession =
    !!sessionToken && sessionToken !== "dev_session_token";
  const isLocalBootstrapSession =
    !!sessionToken && sessionToken.startsWith("dev-");
  const canQueryNotifications =
    !isLoading &&
    isAuthenticated &&
    hasLiveTenantSession &&
    !isLocalBootstrapSession;

  const notifications = useQuery(
    api.notifications.getNotifications,
    canQueryNotifications ? { sessionToken, limit: 20 } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    canQueryNotifications ? { sessionToken } : "skip"
  );

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const normalizedNotifications = (notifications ?? []).map((notification: any) => ({
    ...notification,
    read: notification.isRead,
  }));

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
