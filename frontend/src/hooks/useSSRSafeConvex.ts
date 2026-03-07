"use client";

import {
  ConvexProvider as ReactConvexProvider,
  useAction as useConvexAction,
  useMutation as useConvexMutation,
  useQuery as useConvexQuery,
} from "convex/react";

export const ConvexProvider = ReactConvexProvider;

export function useQuery(query: any, args?: any) {
  return args === undefined ? useConvexQuery(query) : useConvexQuery(query, args);
}

export function useMutation(mutation: any) {
  return useConvexMutation(mutation);
}

export function useAction(action: any) {
  return useConvexAction(action);
}

export function useNotifications() {
  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAsRead: async () => {},
    markAllAsRead: async () => {},
  };
}
