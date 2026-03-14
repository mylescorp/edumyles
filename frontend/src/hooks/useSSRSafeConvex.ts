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
 *
 * If the Convex query throws (e.g. server error, missing function), this hook
 * catches the error and returns undefined instead of crashing the component.
 */
export function useQuery(query: any, args?: any, enabled?: boolean) {
  // If enabled is explicitly false, pass "skip" to prevent query execution
  const shouldSkip = enabled === false;
  const queryArgs = shouldSkip ? "skip" : (args === "skip" ? "skip" : (args ?? {}));

  try {
    const result = useConvexQuery(query, queryArgs);
    return result;
  } catch (error) {
    // Convex useQuery throws during render on server errors.
    // Catch and return undefined so the component can render gracefully.
    console.warn("[useQuery] Convex query error caught:", (error as Error)?.message);
    return undefined;
  }
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
