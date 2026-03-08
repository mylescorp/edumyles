"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "./useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

interface RealTimeStats {
  totalTenants: number;
  totalUsers: number;
  activeTenants: number;
  recentActivity: any[];
}

export function useRealTimeStats(sessionToken: string | null) {
  const [stats, setStats] = useState<RealTimeStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Simulate real-time updates (in production, this would connect to WebSocket/SSE)
  useEffect(() => {
    if (!sessionToken) return;

    // For now, we'll simulate with polling
    const interval = setInterval(() => {
      setStats(prev => {
        const baseStats = prev || {
          totalTenants: 0,
          totalUsers: 0,
          activeTenants: 0,
          recentActivity: []
        };
        
        return {
          ...baseStats,
          totalTenants: Math.floor(Math.random() * 100) + 50,
          totalUsers: Math.floor(Math.random() * 1000) + 500,
          activeTenants: Math.floor(Math.random() * 80) + 20,
          recentActivity: [
            {
              _id: Date.now().toString(),
              action: "tenant_created",
              tenantName: `Tenant ${Math.floor(Math.random() * 100)}`,
              timestamp: Date.now(),
              actorEmail: "system@edumyles.com"
            }
          ]
        };
      });
    }, 5000); // Update every 5 seconds

    setIsConnected(true);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [sessionToken]);

  const addActivity = useCallback((activity: any) => {
    setStats(prev => prev ? {
      ...prev,
      recentActivity: [activity, ...prev.recentActivity.slice(0, 9)]
    } : null);
  }, []);

  return { stats, isConnected, addActivity };
}
