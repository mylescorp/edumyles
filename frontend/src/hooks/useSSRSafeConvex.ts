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
 * When `enabled` is false, the query is skipped.
 * Returns the raw Convex query result while also exposing `data`, `isLoading`,
 * `error`, and `refetch` for newer call sites that expect an object shape.
 *
 * Important: React hooks must not be called inside try/catch blocks because
 * exceptions during render can change hook bookkeeping between renders.
 */
export function useQuery(query: any, args?: any, enabled?: boolean) {
  const shouldSkip = enabled === false;

  // Client components are still pre-rendered on the server in Next.js App Router.
  // During that pass the Convex provider is not mounted yet, so we must not call
  // Convex hooks or React will throw before hydration can recover.
  if (typeof window === "undefined") {
    if (shouldSkip) {
      return undefined as any;
    }

    return {
      data: undefined,
      isLoading: true,
      error: undefined,
      refetch: () => {},
      value: undefined,
    } as any;
  }

  const queryArgs = shouldSkip ? "skip" : (args === "skip" ? "skip" : (args ?? {}));
  const result = useConvexQuery(query, queryArgs);

  if (shouldSkip) {
    return undefined as any;
  }

  if (result !== null && (typeof result === "object" || typeof result === "function")) {
    const target = result as Record<string, any>;
    if (!Object.prototype.hasOwnProperty.call(target, "data")) {
      Object.defineProperties(target, {
        data: {
          value: result,
          enumerable: false,
          configurable: true,
        },
        isLoading: {
          value: false,
          enumerable: false,
          configurable: true,
        },
        error: {
          value: undefined,
          enumerable: false,
          configurable: true,
        },
        refetch: {
          value: () => {},
          enumerable: false,
          configurable: true,
        },
      });
    }
    return result as any;
  }

  return {
    data: result,
    isLoading: false,
    error: undefined,
    refetch: () => {},
    value: result,
  } as any;
}

export function useMutation(mutation: any) {
  return useConvexMutation(mutation);
}

export { useConvexMutation };

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
