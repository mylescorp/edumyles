"use client";

import {
  ConvexProvider as ReactConvexProvider,
  useAction as useConvexAction,
  useMutation as useConvexMutation,
  useQuery as useConvexQuery,
} from "convex/react";

export const ConvexProvider = ReactConvexProvider;

/**
 * SSR-safe useQuery wrapper that supports an optional `enabled` parameter.
 * When `enabled` is false, the query is skipped (returns undefined).
 * Returns the raw Convex query result (not wrapped in {data, isLoading, error}).
 */
export function useQuery(query: any, args?: any, enabled?: boolean) {
  // If enabled is explicitly false, pass "skip" to prevent query execution
  const shouldSkip = enabled === false;
  const result = useConvexQuery(query, shouldSkip ? "skip" : (args ?? {}));
  return result;
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
