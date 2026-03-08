"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { PlatformMetricsProvider } from "@/components/platform/PlatformMetrics";
import { InteractiveChart } from "@/components/charts/InteractiveChart";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { AdvancedDateRange } from "@/components/forms/AdvancedDateRange";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Building2, DollarSign, Download, Shield, Users } from "lucide-react";

const PLAN_PRICES_USD: Record<string, number> = {
  starter: 49,
  growth: 129,
  premium: 249,
  enterprise: 499,
};

type PlatformStats = {
  totalTenants: number;
  totalUsers: number;
  planCounts: Record<string, number>;
};

type Subscription = {
  status?: string;
  plan?: string;
  createdAt?: number;
};

type AuditLog = {
  action?: string;
  timestamp?: number;
};

export default function AnalyticsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const isPlatformAdmin = hasRole("master_admin", "super_admin");

  return (
    <PlatformMetricsProvider timeRange={timeRange}>
      <div className="space-y-6">
        <PageHeader
          title="Platform Analytics"
          description="Deep insights into platform performance and usage"
          breadcrumbs={[
            { label: "Dashboard", href: "/platform" }, 
            { label: "Analytics", href: "/platform/analytics" }
          ]}
        />

        <div className="flex items-center justify-between mb-6">
          <AdvancedDateRange
            value={{ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }}
            onChange={(range) => {
              const days = Math.ceil((range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000));
              setTimeRange(days === 7 ? "7d" : days === 30 ? "30d" : days === 90 ? "90d" : "1y");
            }}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <InteractiveChart
            data={Array.from({ length: 30 }, (_, i) => ({
              x: i,
              y: Math.floor(Math.random() * 100) + 50,
              value: { metric: "users", value: Math.floor(Math.random() * 1000) }
            }))}
            title="User Growth Trend"
            type="line"
            onDrillDown={(point) => {
              console.log("Drill down to:", point.value);
            }}
          />
          
          <HeatmapChart
            data={Array.from({ length: 7 }, (_, day) => ({
              day: `Day ${day + 1}`,
              hour: Math.floor(Math.random() * 24),
              value: Math.floor(Math.random() * 100)
            }))}
            title="User Activity Heatmap"
          />
        </div>
      </div>
    </PlatformMetricsProvider>
  );
}
