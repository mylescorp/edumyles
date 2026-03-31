"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DashboardKPIGrid } from "@/components/platform/DashboardKPI";
import { DashboardCharts } from "@/components/platform/DashboardCharts";
import { ActivityFeed } from "@/components/platform/ActivityFeed";
import { QuickActions } from "@/components/platform/QuickActions";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useDashboardKPIs, useActivityFeed, useDashboardCharts } from "@/hooks/useDashboardData";
import {
  Activity,
  FileText,
  Users,
  Zap,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIME_RANGES = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
] as const;

type TimeRange = typeof TIME_RANGES[number]["value"];

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();
  const { hasRole } = usePermissions();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
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

  const defaultChartsData = {
    mrrTrend: [],
    tenantGrowth: [],
    ticketVolume: [],
    revenueByPlan: [],
  };

  if (isLoading || kpisLoading) return <LoadingSkeleton variant="page" />;

  if (!isPlatformAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Platform Dashboard"
          description="Platform-wide operations and controls"
          breadcrumbs={[{ label: "Dashboard" }]}
        />
        <Card className="shadow-sm">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              You do not have permission to view platform-wide metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title="Platform Dashboard"
          description="Live platform metrics and cross-tenant activity"
          breadcrumbs={[{ label: "Dashboard" }]}
          badge={
            <Badge className="gap-1.5 text-xs border-[#26A65B]/40 text-[#26A65B] bg-[rgba(38,166,91,0.07)] border">
              <span className="w-1.5 h-1.5 rounded-full bg-[#26A65B] animate-pulse inline-block" />
              Live
            </Badge>
          }
          className="mb-0 flex-1"
        />
        <Link href="/platform/analytics" className="sm:mt-0.5 flex-shrink-0">
          <Button size="sm" className="bg-[#0F4C2A] hover:bg-[#1A7A4A] text-white shadow-sm h-8">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Open Analytics
          </Button>
        </Link>
      </div>

      {/* Time range selector */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time Range</span>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {TIME_RANGES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setTimeRange(value);
                announceToScreenReader(`Showing ${label} of data`);
              }}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all duration-150",
                timeRange === value
                  ? "bg-[#0F4C2A] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Widgets */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-[#0F4C2A]" />
            Platform Overview
          </CardTitle>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#26A65B] animate-pulse inline-block" />
            Real-time
          </span>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <DashboardKPIGrid kpis={kpis || defaultKPIs} isLoading={kpisLoading} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-[#E8A020]" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <QuickActions variant="grid" />
        </CardContent>
      </Card>

      {/* Charts */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-[#1565C0]" />
            Analytics Overview
          </CardTitle>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#26A65B] animate-pulse inline-block" />
            Live charts
          </span>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <DashboardCharts
            chartsData={chartsData || defaultChartsData}
            isLoading={chartsLoading}
          />
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-[#0F4C2A]" />
            Recent Activity
          </CardTitle>
          <span className="text-xs text-muted-foreground">Platform-wide</span>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <ActivityFeed
            events={activityFeed || []}
            isLoading={activityLoading}
            limit={20}
            showViewAll={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
