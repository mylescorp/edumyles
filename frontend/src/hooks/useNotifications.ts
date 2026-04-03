"use client";

import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";
import { useQuery, useMutation } from "./useSSRSafeConvex";

export function useNotifications() {
  const { sessionToken } = useAuth();

  const notifications = useQuery(
    api.notifications.getNotifications,
    sessionToken ? { sessionToken, limit: 20 } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    sessionToken ? { sessionToken } : "skip"
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
    isLoading: notifications === undefined,
    markAsRead: (notificationId: string) => {
      if (!sessionToken) return;
      markAsRead({ sessionToken, notificationId: notificationId as any });
    },
    markAllAsRead: () => {
      if (sessionToken) markAllAsRead({ sessionToken });
    },
  };
}
