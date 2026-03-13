"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DashboardKPIGrid } from "@/components/platform/DashboardKPI";
import { DashboardCharts } from "@/components/platform/DashboardCharts";
import { ActivityFeed } from "@/components/platform/ActivityFeed";
import { QuickActions } from "@/components/platform/QuickActions";
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
import { cn } from "@/lib/utils";

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
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <PageHeader
            title="Master Admin Dashboard"
            description="Live platform metrics and cross-tenant activity"
            breadcrumbs={[{ label: "Dashboard", href: "/platform" }]}
          />
          <div className="flex items-center gap-2 text-sm text-em-text-secondary">
            <div className="h-2 w-2 rounded-full bg-em-success animate-pulse"></div>
            <span>Live data • Last updated 2 minutes ago</span>
          </div>
        </div>
      </div>

      {/* Toolbar: time range + analytics link */}
      <div className="flex items-center justify-between bg-em-bg-subtle rounded-xl p-4 border border-em-border shadow-sm">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-em-text-secondary">Time Range:</span>
          <div className="flex items-center space-x-1 bg-em-bg-base rounded-lg p-1 border border-em-border">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                onClick={() => { setTimeRange(range); announceToScreenReader(`Showing ${range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"} of data`); }}
                className={cn(
                  "text-xs px-3 py-1.5 transition-all duration-200",
                  timeRange === range 
                    ? "bg-em-primary-light text-white shadow-sm hover:bg-em-primary-light/90" 
                    : "text-em-text-secondary hover:text-em-text-primary hover:bg-em-accent/20"
                )}
              >
                {range === "7d" ? "7D" : range === "30d" ? "30D" : "90D"}
              </Button>
            ))}
          </div>
        </div>

        <Link href="/platform/analytics">
          <Button className="bg-em-primary-light hover:bg-em-primary-light/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
            <FileText className="h-4 w-4 mr-2" />
            Open Analytics
          </Button>
        </Link>
      </div>

      {/* Master Dashboard KPI Widgets */}
      <div className="bg-gradient-to-br from-em-bg-subtle via-em-bg-base to-em-bg-subtle rounded-2xl p-6 border border-em-border shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-em-text-primary">Platform Overview</h2>
          <div className="flex items-center gap-2 text-sm text-em-text-secondary">
            <Activity className="h-4 w-4" />
            <span>Real-time</span>
          </div>
        </div>
        <DashboardKPIGrid kpis={kpis || defaultKPIs} isLoading={kpisLoading} />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-em-primary/5 to-em-accent/5 rounded-2xl p-6 border border-em-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-em-text-primary">Quick Actions</h2>
          <Badge variant="secondary" className="bg-em-accent/10 text-em-accent-dark border-em-accent/20">
            4 available
          </Badge>
        </div>
        <QuickActions variant="grid" />
      </div>

      {/* Dashboard Charts */}
      <div className="bg-em-bg-base rounded-2xl p-6 border border-em-border shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-em-text-primary">Analytics Overview</h2>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-em-success animate-pulse"></div>
            <span className="text-sm text-em-text-secondary">Live charts</span>
          </div>
        </div>
        <DashboardCharts 
          chartsData={chartsData || {
            mrrTrend: [],
            tenantGrowth: [],
            ticketVolume: [],
            revenueByPlan: []
          }} 
          isLoading={chartsLoading} 
        />
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-gradient-to-b from-em-bg-base to-em-bg-subtle rounded-2xl p-6 border border-em-border shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-em-text-primary">Recent Activity</h2>
          <div className="flex items-center gap-2 text-sm text-em-text-secondary">
            <Users className="h-4 w-4" />
            <span>Platform-wide</span>
          </div>
        </div>
        <ActivityFeed 
          events={activityFeed || []} 
          isLoading={activityLoading}
          limit={20}
          showViewAll={true}
          className=""
        />
      </div>
    </div>
  );
}
