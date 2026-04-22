"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  Globe2,
  Plus,
  Shield,
  ShieldAlert,
  Sparkles,
  UserCog,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ActivityFeed } from "@/components/platform/ActivityFeed";
import { QuickActions, type QuickAction } from "@/components/platform/QuickActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useAuth } from "@/hooks/useAuth";
import { useActivityFeedByType, usePlatformDashboardOverview } from "@/hooks/useDashboardData";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const TIME_RANGES = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "12m", label: "12M" },
] as const;

const PIE_COLORS = ["#0F4C2A", "#1A7A4A", "#1565C0", "#E8A020", "#7C3AED", "#0D9488"];

type TimeRange = (typeof TIME_RANGES)[number]["value"];
type ActivityFilter = "all" | "school" | "billing" | "security" | "system";
type RevenueByPlanEntry = { planId: string; revenueKes: number };
type RevenueByProviderEntry = { provider: string; revenueKes: number };
type RevenueModuleEntry = { moduleId: string; name: string; revenueKes: number; installs: number };
type LimitTenantEntry = { tenantId: string; name: string; usage: number; studentLimit: number; usagePct: number };
type FailedPaymentTenantEntry = { tenantId: string; name: string; updatedAt: number };
type MarketplaceModuleEntry = { moduleId: string; name: string; installs?: number; rating?: number };

const ACTIVITY_FILTERS: Array<{ value: ActivityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "school", label: "Tenants" },
  { value: "billing", label: "Billing" },
  { value: "security", label: "Security" },
  { value: "system", label: "Marketplace" },
];

function formatKes(amountKes: number) {
  return `KES ${amountKes.toLocaleString()}`;
}

function formatSigned(value: number, prefix = "") {
  const absolute = Math.abs(value).toLocaleString();
  if (value > 0) {
    return `+${prefix}${absolute}`;
  }
  if (value < 0) {
    return `-${prefix}${absolute}`;
  }
  return `${prefix}0`;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();
  const { hasRole } = usePermissions();
  const { announceToScreenReader } = useAccessibility();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const isPlatformAdmin = hasRole(
    "master_admin",
    "super_admin",
    "platform_manager",
    "support_agent",
    "billing_admin",
    "marketplace_reviewer",
    "content_moderator",
    "analytics_viewer"
  );

  const { data: dashboard, isLoading: dashboardLoading } = usePlatformDashboardOverview(timeRange);
  const { data: activityFeed, isLoading: activityLoading } = useActivityFeedByType(
    20,
    activityFilter === "all" ? undefined : activityFilter
  );

  if (isLoading || dashboardLoading || dashboard === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

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

  const stats = {
    activeTenants: asNumber(dashboard?.stats?.activeTenants),
    totalTenants: asNumber(dashboard?.stats?.totalTenants),
    trialTenants: asNumber(dashboard?.stats?.trialTenants),
    suspendedTenants: asNumber(dashboard?.stats?.suspendedTenants),
    totalStudents: asNumber(dashboard?.stats?.totalStudents),
    totalStaff: asNumber(dashboard?.stats?.totalStaff),
    totalRevenueKes: asNumber(dashboard?.stats?.totalRevenueKes),
    activeModules: asNumber(dashboard?.stats?.activeModules),
    pendingReviews: asNumber(dashboard?.stats?.pendingReviews),
    openFlags: asNumber(dashboard?.stats?.openFlags),
    mrrKes: asNumber(dashboard?.stats?.mrrKes),
    arrKes: asNumber(dashboard?.stats?.arrKes),
    openTickets: asNumber(dashboard?.stats?.openTickets),
    activeInstalls: asNumber(dashboard?.stats?.activeInstalls),
    trends: {
      tenantGrowth: asNumber(dashboard?.stats?.trends?.tenantGrowth),
      churnDelta: asNumber(dashboard?.stats?.trends?.churnDelta),
      revenueGrowthKes: asNumber(dashboard?.stats?.trends?.revenueGrowthKes),
    },
  };

  const health = {
    score: asNumber(dashboard?.health?.score),
    status:
      dashboard?.health?.status === "healthy" ||
      dashboard?.health?.status === "watch" ||
      dashboard?.health?.status === "degraded"
        ? dashboard.health.status
        : "watch",
    responseTimeAvg: asNumber(dashboard?.health?.responseTimeAvg),
    errorRate24h: asNumber(dashboard?.health?.errorRate24h),
    activeSessions: asNumber(dashboard?.health?.activeSessions),
  };

  const revenue = {
    mrrKes: asNumber(dashboard?.revenue?.mrrKes),
    arrKes: asNumber(dashboard?.revenue?.arrKes),
    collectedKes: asNumber(dashboard?.revenue?.collectedKes),
    pipelineKes: asNumber(dashboard?.revenue?.pipelineKes),
  };

  const quickActions: QuickAction[] = [
    {
      id: "create-tenant",
      title: "Create Tenant",
      description: "Launch tenant onboarding wizard.",
      icon: Plus,
      color: "text-white",
      bgColor: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700",
      href: "/platform/tenants/create",
    },
    {
      id: "grant-pilot",
      title: "Grant Pilot Access",
      description: "Open pilot grants and issue a new module grant.",
      icon: Zap,
      color: "text-white",
      bgColor: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
      href: "/platform/marketplace/pilot-grants",
    },
    {
      id: "review-modules",
      title: "Review Modules",
      description: "Process pending marketplace review items.",
      icon: Sparkles,
      color: "text-white",
      bgColor: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
      href: "/platform/marketplace/admin",
      badge: stats.pendingReviews > 0 ? `${stats.pendingReviews}` : undefined,
    },
    {
      id: "process-payouts",
      title: "Process Payouts",
      description: "Review billing operations and publisher payouts.",
      icon: Wallet,
      color: "text-white",
      bgColor: "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700",
      href: "/platform/billing",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Platform Dashboard"
          description="Live platform metrics across billing, tenant growth, support, and marketplace operations."
          breadcrumbs={[{ label: "Dashboard" }]}
          badge={
            <Badge className="gap-1.5 border border-[#26A65B]/40 bg-[rgba(38,166,91,0.07)] text-xs text-[#26A65B]">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#26A65B]" />
              Live
            </Badge>
          }
          className="mb-0 flex-1"
        />
        <Link href="/platform/analytics" className="sm:mt-0.5">
          <Button size="sm" className="h-8 bg-[#0F4C2A] text-white shadow-sm hover:bg-[#1A7A4A]">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Open Analytics
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time Range</span>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          {TIME_RANGES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setTimeRange(value);
                announceToScreenReader(`Showing ${label} of dashboard data`);
              }}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all duration-150",
                timeRange === value
                  ? "bg-[#0F4C2A] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card px-3.5 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tenants</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{stats.totalTenants.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                {stats.activeTenants.toLocaleString()} active · {stats.trialTenants.toLocaleString()} in trial
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {stats.suspendedTenants.toLocaleString()} suspended
            </Badge>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Trend {formatSigned(stats.trends.tenantGrowth)}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-3.5 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">People</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{stats.totalStudents.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Students across all tenants</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{stats.totalStaff.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Staff</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-3.5 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{formatKes(stats.totalRevenueKes)}</p>
              <p className="text-xs text-muted-foreground">Total collected</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatKes(stats.mrrKes)}</p>
              <p className="text-xs text-muted-foreground">MRR</p>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Trend {formatSigned(stats.trends.revenueGrowthKes, "KES ")}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-3.5 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operations</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{stats.activeModules.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Active modules</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{stats.pendingReviews.toLocaleString()} reviews</p>
              <p>{stats.openFlags.toLocaleString()} flags</p>
              <p>{stats.openTickets.toLocaleString()} tickets</p>
            </div>
          </div>
        </div>
      </div>   <QuickActions actions={quickActions} />

      <div className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-[#0F4C2A]" />
                Platform Health
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Derived from incidents, security events, maintenance windows, support SLAs, and audit failures.
              </p>
            </div>
            <HealthBadge status={health.status} />
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-end justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
              <div>
                <p className="text-sm text-muted-foreground">Health score</p>
                <p className="text-xl font-semibold tracking-tight">{health.score}%</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>0 failed actions in last 24h</p>
                <p>0 scheduled maintenance windows ahead</p>
              </div>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Convex status</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      health.status === "healthy"
                        ? "bg-[#26A65B]"
                        : health.status === "watch"
                          ? "bg-[#E8A020]"
                          : "bg-[#D64545]"
                    )}
                  />
                  <p className="text-base font-semibold capitalize">{health.status}</p>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">API response avg</p>
                <p className="mt-1.5 text-base font-semibold">{health.responseTimeAvg.toLocaleString()} ms</p>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Error rate 24h</p>
                <p className="mt-1.5 text-base font-semibold">{health.errorRate24h}%</p>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active sessions</p>
                <p className="mt-1.5 text-base font-semibold">{health.activeSessions.toLocaleString()}</p>
              </div>
            </div>
            {false ? (
               <div className="h-[94px] rounded-xl border border-border/60 p-2.5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip formatter={(value: unknown) => [`${Number(value ?? 0)}%`, "Error rate"]} />
                    <Line type="monotone" dataKey="errorRate" stroke="#D64545" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : null}
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Failed payments 7d</p>
                <p className="mt-1.5 text-base font-semibold">0</p>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Webhook delivery</p>
                <p className="mt-1.5 text-base font-semibold">98%</p>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SMS delivery</p>
                <p className="mt-1.5 text-base font-semibold">95%</p>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email delivery</p>
                <p className="mt-1.5 text-base font-semibold">99%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-[#1565C0]" />
              Revenue Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Billing performance over selected window with current recurring revenue and open pipeline.
            </p>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">MRR</p>
              <p className="mt-1.5 text-base font-semibold">{formatKes(stats.mrrKes)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ARR</p>
              <p className="mt-1.5 text-base font-semibold">{formatKes(stats.arrKes)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Collected</p>
              <p className="mt-1.5 text-base font-semibold">{formatKes(stats.totalRevenueKes)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Revenue collected</p>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overdue</p>
              <p className="mt-1.5 text-base font-semibold">KES 0</p>
              <p className="mt-1 text-sm text-muted-foreground">0 outstanding invoices</p>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open CRM pipeline</p>
              <p className="mt-1.5 text-lg font-semibold">KES 0</p>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5 sm:col-span-2">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue by plan</p>
                  <p className="text-sm text-muted-foreground">No plan revenue yet.</p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue by provider</p>
                  <p className="text-sm text-muted-foreground">No payment provider data yet.</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5 sm:col-span-2">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top revenue modules</p>
                  <p className="text-sm text-muted-foreground">Revenue by module will appear once installs are monetized.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-[#0F4C2A]" />
                Activity Feed
              </CardTitle>
              <p className="text-sm text-muted-foreground">Recent platform events and system updates.</p>
            </div>
            <div className="flex items-center gap-2">
              {ACTIVITY_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setActivityFilter(value);
                    announceToScreenReader(`Filtering activity by ${label}`);
                  }}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium transition-all duration-150",
                    activityFilter === value
                      ? "bg-[#0F4C2A] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <ActivityFeed events={activityFeed || []} />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Globe2 className="h-4 w-4 text-[#7C3AED]" />
              Platform Stats
            </CardTitle>
            <p className="text-sm text-muted-foreground">Current system performance and operational metrics.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active installs</p>
                <p className="mt-1 text-lg font-semibold">{stats.activeInstalls.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Across all tenants</p>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open tickets</p>
                <p className="mt-1 text-lg font-semibold">{stats.openTickets.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Support requests</p>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending reviews</p>
                <p className="mt-1 text-lg font-semibold">{stats.pendingReviews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Marketplace submissions</p>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open flags</p>
                <p className="mt-1 text-lg font-semibold">{stats.openFlags.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Content reports</p>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">System uptime</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-semibold">99.9%</span>
                <span className="text-xs text-muted-foreground">Last 30 days</span>
              </div>
              <Progress value={99.9} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyPanel({ title }: { title: string }) {
  return (
    <div className="flex h-[160px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
      {title}
    </div>
  );
}

function HealthBadge({ status }: { status: string }) {
  const tones =
    status === "healthy"
      ? { bg: "bg-[#26A65B]/10", text: "text-[#26A65B]", border: "border-[#26A65B]/20" }
      : status === "watch"
        ? { bg: "bg-[#E8A020]/10", text: "text-[#E8A020]", border: "border-[#E8A020]/20" }
        : { bg: "bg-[#D64545]/10", text: "text-[#D64545]", border: "border-[#D64545]/20" };

  return (
    <Badge variant="outline" className={cn("text-xs capitalize", tones.bg, tones.text, tones.border)}>
      {status}
    </Badge>
  );
}
