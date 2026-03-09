"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAccessibility } from "@/hooks/useAccessibility";
import { usePlatformMetrics } from "@/components/platform/PlatformMetrics";
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

  const { data: stats, isConnected, addActivity } = usePlatformMetrics();
  const { announceToScreenReader } = useAccessibility();

  const rangeStart = useMemo(() => {
    const now = Date.now();
    const ms = timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 : timeRange === "30d" ? 30 * 24 * 60 * 60 * 1000 : 90 * 24 * 60 * 60 * 1000;
    return now - ms;
  }, [timeRange]);

  const derived = useMemo(() => {
    if (!stats) {
      return {
        newUsers: 0,
        estimatedMrr: 0,
        recentActivity: [],
        securityEvents: 0,
      };
    }

    const activeSubscriptions = (stats?.subscriptions ?? []).filter((s) => s.status === "active" || s.status === "trial");
    const estimatedRevenue = activeSubscriptions.reduce((sum, s) => {
      const key = String(s.plan || "").toLowerCase();
      return sum + (PLAN_PRICES_USD[key] ?? 0);
    }, 0);

    const recentActivity = (stats?.recentActivity ?? []).filter((a) => (a.timestamp ?? 0) >= rangeStart);
    const securityEvents = recentActivity.filter((a) => /(suspend|deleted|unauthorized|failed|impersonation)/i.test(String(a.action)));
    const newUsers = recentActivity.filter((a) => /created/i.test(String(a.action)));

    return {
      newUsers: newUsers.length,
      estimatedMrr: estimatedRevenue,
      recentActivity,
      securityEvents: securityEvents.length,
    };
  }, [stats, timeRange, rangeStart]);

  if (isLoading) return <LoadingSkeleton variant="page" />;

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

      {/* Toolbar: time range + connection status + analytics link */}
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

          {/* Connection status pill */}
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            isConnected
              ? "bg-success-bg text-success border-success"
              : "bg-warning-bg text-em-accent-dark border-warning"
          }`}>
            {isConnected ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <Wifi className="h-3 w-3" />
                <span>Live</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-em-accent" />
                <WifiOff className="h-3 w-3" />
                <span>Reconnecting…</span>
              </>
            )}
          </div>
        </div>

        <Link href="/platform/analytics">
          <Button className="bg-primary hover:bg-primary-dark">
            <FileText className="h-4 w-4 mr-2" />
            Open Analytics
          </Button>
        </Link>
      </div>

      {/* 4 key stat cards (consolidated from 8) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tenants" value={stats?.totalTenants ?? 0} icon={Building2} />
        <StatCard label="Estimated MRR (USD)" value={`$${derived.estimatedMrr.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Security Events" value={derived.securityEvents} icon={Shield} />
        <StatCard label="New Users (Range)" value={derived.newUsers.toLocaleString()} icon={UserCheck} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <InteractiveChart
          data={derived.recentActivity.map((item, index) => ({
            x: index,
            y: item.action.includes('created') ? 1 : item.action.includes('updated') ? 0.5 : 0.2,
            value: item
          }))}
          title="Activity Trend"
          type="line"
          onDrillDown={(point) => {
            console.log('Drill down to:', point.value);
          }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Time Range:</span>
            <div className="flex space-x-1">
              {(["7d", "30d", "90d"] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setTimeRange(range); announceToScreenReader(`Showing ${range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"} of data`); }}
                  className="text-xs"
                >
                  {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Tenants" value={stats?.totalTenants ?? 0} icon={Building2} />
          <StatCard label="Total Users" value={(stats?.totalUsers ?? 0).toLocaleString()} icon={Users} />
          <StatCard label="New Users (Range)" value={derived.newUsers.toLocaleString()} icon={UserCheck} />
          <StatCard label="Estimated MRR (USD)" value={`$${derived.estimatedMrr.toLocaleString()}`} icon={DollarSign} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active Tenants" value={stats?.activeTenants ?? 0} icon={Building2} />
          <StatCard label="Suspended Tenants" value={stats?.suspendedTenants ?? 0} icon={AlertTriangle} />
          <StatCard label="Security Events" value={derived.securityEvents} icon={Shield} />
          <StatCard label="Activity Records" value={derived.recentActivity.length} icon={Activity} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <InteractiveChart
            data={derived.recentActivity.map((item, index) => ({
              x: index,
              y: item.action.includes('created') ? 1 : item.action.includes('updated') ? 0.5 : 0.2,
              value: item
            }))}
            title="Activity Trend"
            type="line"
            onDrillDown={(point) => {
              console.log('Drill down to:', point.value);
            }}
          />
          
          <HeatmapChart
            data={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => {
              const count = derived.recentActivity.filter((a) => {
                const d = new Date(a.timestamp ?? 0);
                return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()] === dayName;
              }).length;
              return { day: dayName, hour: 12, value: count };
            })}
            title="User Activity Heatmap"
          />
        </div>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Recent Activity</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {derived.recentActivity.length} events
                </Badge>
                <Link href="/platform/audit">
                  <Button variant="outline" size="sm" className="text-xs">
                    View All
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {derived.recentActivity.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted">
                  <div className={`h-2 w-2 rounded-full mt-2 ${getActionBadgeClass(item.action).split(' ')[0]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(item.timestamp ?? 0)}</p>
                  </div>
                </div>
              ))}
              {derived.recentActivity.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
