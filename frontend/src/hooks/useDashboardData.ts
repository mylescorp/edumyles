"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { useAuth } from "./useAuth";

type TimeRange = "7d" | "30d" | "90d" | "12m";

export function usePlatformDashboardOverview(timeRange: TimeRange) {
  const { sessionToken, isLoading: authLoading } = useAuth();

  const data = useQuery(
    api.platform.dashboard.queries.getDashboardOverview,
    { sessionToken: sessionToken || "", timeRange },
    !!sessionToken
  );

  return {
    data,
    isLoading: authLoading || (!!sessionToken && data === undefined),
    error: null,
  };
}

export function useActivityFeed(limit = 20) {
  return useActivityFeedByType(limit);
}

export function useActivityFeedByType(
  limit = 20,
  eventType?:
    | "school"
    | "payment"
    | "ticket"
    | "done"
    | "alert"
    | "red"
    | "up"
    | "exit"
    | "user"
    | "billing"
    | "document"
    | "system"
    | "security"
    | "scheduled"
) {
  const { sessionToken, isLoading: authLoading } = useAuth();

  const events = useQuery(
    api.platform.dashboard.queries.getActivityFeed,
    { sessionToken: sessionToken || "", limit, eventType },
    !!sessionToken
  );

  return {
    data: events,
    isLoading: authLoading || (!!sessionToken && events === undefined),
    error: null,
  };
}
