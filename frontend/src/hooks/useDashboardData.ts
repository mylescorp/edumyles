"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";

export function useDashboardKPIs() {
  const { sessionToken, isLoading: authLoading } = useAuth();
  
  // For now, use platform stats to get basic KPI data
  const platformStats = useQuery(
    api.platform.tenants.queries.getPlatformStats,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const isLoading = authLoading || (!!sessionToken && platformStats === undefined);

  // Transform the data to match expected KPI format
  if (platformStats) {
    return {
      data: {
        activeTenants: platformStats.activeTenants || 0,
        mrr: platformStats.mrr || 0,
        arr: platformStats.arr || 0,
        openTickets: platformStats.openTickets || 0,
        pipelineValue: platformStats.pipelineValue || 0,
        systemHealth: platformStats.systemHealth || 100,
        trialsActive: platformStats.trialTenants || 0,
        newThisMonth: platformStats.newThisMonth || 0,
      },
      isLoading,
      error: null,
    };
  }

  return {
    data: {
      activeTenants: 0,
      mrr: 0,
      arr: 0,
      openTickets: 0,
      pipelineValue: 0,
      systemHealth: 100,
      trialsActive: 0,
      newThisMonth: 0,
    },
    isLoading,
    error: null,
  };
}

export function useDashboardCharts(timeRange?: "7d" | "30d" | "90d" | "12m") {
  const { sessionToken } = useAuth();
  
  // Return mock chart data for now
  return {
    data: {
      mrrTrend: [
        { month: "Jan", mrr: 50000, newTenants: 2 },
        { month: "Feb", mrr: 55000, newTenants: 3 },
        { month: "Mar", mrr: 60000, newTenants: 4 },
      ],
      tenantGrowth: [
        { month: "Jan", starter: 2, growth: 3, pro: 1, enterprise: 0, total: 6 },
        { month: "Feb", starter: 3, growth: 4, pro: 2, enterprise: 1, total: 10 },
        { month: "Mar", starter: 4, growth: 5, pro: 3, enterprise: 1, total: 13 },
      ],
      ticketVolume: [
        { week: "Week 1", created: 20, resolved: 18 },
        { week: "Week 2", created: 25, resolved: 22 },
        { week: "Week 3", created: 30, resolved: 28 },
        { week: "Week 4", created: 22, resolved: 25 },
      ],
      revenueByPlan: [
        { plan: "Starter", mrr: 50000, tenants: 10 },
        { plan: "Growth", mrr: 150000, tenants: 15 },
        { plan: "Pro", mrr: 100000, tenants: 8 },
        { plan: "Enterprise", mrr: 25000, tenants: 2 },
      ],
    },
    isLoading: false,
    error: null,
  };
}

export function useActivityFeed(limit?: number) {
  const { sessionToken, isLoading: authLoading } = useAuth();

  const events = useQuery(
    api.platform.tenants.queries.getRecentActivity,
    { sessionToken: sessionToken || "", limit: limit || 20 },
    !!sessionToken
  );

  return {
    data: events || [],
    isLoading: authLoading || (!!sessionToken && events === undefined),
    error: null,
  };
}
