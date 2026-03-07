"use client";

import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";
import { useQuery, useMutation } from "./useSSRSafeConvex";

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?._id ? String(user._id) : null;

  const notifications = useQuery(
    api.notifications.getNotifications,
    userId ? { userId, limit: 20 } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    userId ? { userId } : "skip"
  );

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  return {
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    isLoading: notifications === undefined,
    markAsRead: (notificationId: string) => {
      markAsRead({ notificationId: notificationId as any });
    },
    markAllAsRead: () => {
      if (userId) markAllAsRead({ userId });
    },
  };
}
