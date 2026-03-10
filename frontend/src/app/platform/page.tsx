"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DashboardKPIGrid } from "@/components/platform/DashboardKPI";
import { DashboardCharts } from "@/components/platform/DashboardCharts";
import { ActivityFeed } from "@/components/platform/ActivityFeed";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useDashboardKPIs, useActivityFeed, useDashboardCharts } from "@/hooks/useDashboardData";
import { InteractiveChart } from "@/components/charts/InteractiveChart";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import {
  Activity,
  AlertTriangle,
  Building2,
  DollarSign,
  FileText,
  Shield,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/formatters";

const PLAN_PRICES_USD: Record<string, number> = {
  starter: 49,
  growth: 129,
  premium: 249,
  enterprise: 499,
};

function getActionBadgeClass(action: string) {
  if (action.includes("suspended") || action.includes("deleted")) return "bg-danger-bg text-danger";
  if (action.includes("created") || action.includes("installed")) return "bg-success-bg text-success";
  if (action.includes("updated")) return "bg-warning-bg text-em-accent-dark";
  if (action.includes("impersonation")) return "bg-em-accent/10 text-em-accent-dark";
  return "bg-muted text-muted-foreground";
}

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();
  const { hasRole } = usePermissions();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const isPlatformAdmin = hasRole("master_admin", "super_admin");

  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: chartsData, isLoading: chartsLoading } = useDashboardCharts("12m");
  const { data: activityFeed, isLoading: activityLoading } = useActivityFeed(20);
  const { announceToScreenReader } = useAccessibility();

  const defaultKPIs = {
    activeTenants: 0,
    mrr: 0,
    arr: 0,
    openTickets: 0,
    pipelineValue: 0,
    systemHealth: 0,
    trialsActive: 0,
    newThisMonth: 0,
  };

  if (isLoading || kpisLoading) return <LoadingSkeleton variant="page" />;

  if (!isPlatformAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Master Admin Dashboard" description="Platform-wide operations and controls" breadcrumbs={[{ label: "Dashboard", href: "/platform" }]} />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">You do not have permission to view platform-wide metrics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Admin Dashboard"
        description="Live platform metrics and cross-tenant activity"
        breadcrumbs={[{ label: "Dashboard", href: "/platform" }]}
      />

      {/* Toolbar: time range + analytics link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => { setTimeRange(range); announceToScreenReader(`Showing ${range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"} of data`); }}
                className="text-xs"
              >
                {range === "7d" ? "7D" : range === "30d" ? "30D" : "90D"}
              </Button>
            ))}
          </div>
        </div>

        <Link href="/platform/analytics">
          <Button className="bg-primary hover:bg-primary-dark">
            <FileText className="h-4 w-4 mr-2" />
            Open Analytics
          </Button>
        </Link>
      </div>

      {/* Master Dashboard KPI Widgets */}
      <DashboardKPIGrid kpis={kpis || defaultKPIs} isLoading={kpisLoading} />

      {/* Dashboard Charts */}
      <DashboardCharts 
        chartsData={chartsData || {
          mrrTrend: [],
          tenantGrowth: [],
          ticketVolume: [],
          revenueByPlan: []
        }} 
        isLoading={chartsLoading} 
      />

      {/* Recent Activity Feed */}
      <ActivityFeed 
        events={activityFeed || []} 
        isLoading={activityLoading}
        limit={20}
        showViewAll={true}
        className=""
      />
    </div>
  );
}
