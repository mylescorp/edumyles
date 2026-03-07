"use client";

import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { isSSREnvironment, mockUseQuery, mockUseMutation } from "@/lib/convex-mock";

// Safe wrapper that uses mocks during SSR
export function useQuery(query: any, args: any) {
  if (isSSREnvironment()) {
    return mockUseQuery();
  }
  return useConvexQuery(query, args);
}

// Safe wrapper that uses mocks during SSR  
export function useMutation(mutation: any) {
  if (isSSREnvironment()) {
    return mockUseMutation();
  }
  return useConvexMutation(mutation);
}

// Export useNotifications for components that need it
export function useNotifications() {
  if (isSSREnvironment()) {
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      markAsRead: () => {},
      markAllAsRead: () => {},
    };
  }

  // Return mock data for now to avoid import issues
  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAsRead: () => {},
    markAllAsRead: () => {},
  };
}
