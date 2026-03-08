"use client";

import { createContext, useContext, ReactNode } from "react";
import { useRealTimeStats } from "@/hooks/useRealTimeStats";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";

interface PlatformMetricsContextType {
  data: any;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  refreshData: () => void;
  isConnected: boolean;
  addActivity: (activity: any) => void;
}

export const PlatformMetricsContext = createContext<PlatformMetricsContextType | null>(null);

export function PlatformMetricsProvider({ 
  children, 
  timeRange = '30d' 
}: { 
  children: ReactNode; 
  timeRange?: string;
}) {
  const { sessionToken } = useAuth();
  const { stats, isConnected, addActivity } = useRealTimeStats(sessionToken);
  
  const { data: platformStats } = usePlatformQuery(
    api.platform.tenants.queries.getPlatformStats,
    { sessionToken },
    !!sessionToken
  );

  const contextValue: PlatformMetricsContextType = {
    data: platformStats || stats,
    timeRange: timeRange || '30d',
    onTimeRangeChange: (range: string) => {},
    refreshData: () => {
      // Trigger refresh of real-time stats
      addActivity({
        _id: Date.now().toString(),
        action: 'manual_refresh',
        tenantName: 'System',
        timestamp: Date.now(),
        actorEmail: 'system@edumyles.com'
      });
    },
    isConnected,
    addActivity
  };

  return (
    <PlatformMetricsContext.Provider value={contextValue}>
      {children}
    </PlatformMetricsContext.Provider>
  );
}

export function usePlatformMetrics() {
  const context = useContext(PlatformMetricsContext);
  if (!context) {
    throw new Error('usePlatformMetrics must be used within a PlatformMetricsProvider');
  }
  return context;
}
