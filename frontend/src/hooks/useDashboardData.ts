"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

export function useDashboardKPIs() {
  return useQuery(api.platform.dashboard.getDashboardKPIs, {});
}

export function useDashboardCharts(timeRange?: "7d" | "30d" | "90d" | "12m") {
  return useQuery(api.platform.dashboard.getDashboardCharts, { timeRange });
}

export function useActivityFeed(limit?: number) {
  return useQuery(api.platform.dashboard.getActivityFeed, { limit });
}
