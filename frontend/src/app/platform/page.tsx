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
type MarketplaceCatalogEntry = {
  moduleId: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  installCount?: number;
};

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
      ? "border-[#26A65B]/30 bg-[rgba(38,166,91,0.08)] text-[#26A65B]"
      : status === "watch"
        ? "border-[#E8A020]/30 bg-[rgba(232,160,32,0.08)] text-[#C17B00]"
        : "border-[#D64545]/30 bg-[rgba(214,69,69,0.08)] text-[#D64545]";

  return <Badge className={cn("border text-xs capitalize", tones)}>{status}</Badge>;
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
    errorRateTrend: Array.isArray(dashboard?.health?.errorRateTrend) ? dashboard.health.errorRateTrend : [],
    activeSessions: asNumber(dashboard?.health?.activeSessions),
    failedPayments7d: asNumber(dashboard?.health?.failedPayments7d),
    webhookDeliveryRate: asNumber(dashboard?.health?.webhookDeliveryRate),
    smsDeliveryRate: asNumber(dashboard?.health?.smsDeliveryRate),
    emailDeliveryRate: asNumber(dashboard?.health?.emailDeliveryRate),
    activeIncidents: asNumber(dashboard?.health?.activeIncidents),
    openSecurityIncidents: asNumber(dashboard?.health?.openSecurityIncidents),
    activeMaintenance: asNumber(dashboard?.health?.activeMaintenance),
    scheduledMaintenance: asNumber(dashboard?.health?.scheduledMaintenance),
    criticalTickets: asNumber(dashboard?.health?.criticalTickets),
    slaBreaches: asNumber(dashboard?.health?.slaBreaches),
    failedActions24h: asNumber(dashboard?.health?.failedActions24h),
  };
  const revenue = {
    mrrKes: asNumber(dashboard?.revenue?.mrrKes),
    arrKes: asNumber(dashboard?.revenue?.arrKes),
    revenueByPlan: Array.isArray(dashboard?.revenue?.revenueByPlan) ? dashboard.revenue.revenueByPlan : [],
    revenueByProvider: Array.isArray(dashboard?.revenue?.revenueByProvider) ? dashboard.revenue.revenueByProvider : [],
    topRevenueModules: Array.isArray(dashboard?.revenue?.topRevenueModules) ? dashboard.revenue.topRevenueModules : [],
    pendingPublisherPayoutsKes: asNumber(dashboard?.revenue?.pendingPublisherPayoutsKes),
    collectedKes: asNumber(dashboard?.revenue?.collectedKes),
    overdueKes: asNumber(dashboard?.revenue?.overdueKes),
    pipelineKes: asNumber(dashboard?.revenue?.pipelineKes),
    paidInvoices: asNumber(dashboard?.revenue?.paidInvoices),
    overdueInvoices: asNumber(dashboard?.revenue?.overdueInvoices),
  };
  const tenants = {
    total: asNumber(dashboard?.tenants?.total),
    active: asNumber(dashboard?.tenants?.active),
    trialing: asNumber(dashboard?.tenants?.trialing),
    suspended: asNumber(dashboard?.tenants?.suspended),
    newInRange: asNumber(dashboard?.tenants?.newInRange),
    previousNewInRange: asNumber(dashboard?.tenants?.previousNewInRange),
    churnedInRange: asNumber(dashboard?.tenants?.churnedInRange),
    previousChurnedInRange: asNumber(dashboard?.tenants?.previousChurnedInRange),
    waitlistWaiting: asNumber(dashboard?.tenants?.waitlistWaiting),
    trialConversionRate: asNumber(dashboard?.tenants?.trialConversionRate),
    approachingLimitTenants: Array.isArray(dashboard?.tenants?.approachingLimitTenants) ? dashboard.tenants.approachingLimitTenants : [],
    failedPaymentTenants: Array.isArray(dashboard?.tenants?.failedPaymentTenants) ? dashboard.tenants.failedPaymentTenants : [],
    planDistribution: Array.isArray(dashboard?.tenants?.planDistribution) ? dashboard.tenants.planDistribution : [],
  };
  const marketplace = {
    publishedModules: asNumber(dashboard?.marketplace?.publishedModules),
    pendingReview: asNumber(dashboard?.marketplace?.pendingReview),
    activeFlags: asNumber(dashboard?.marketplace?.activeFlags),
    activePublishers: asNumber(dashboard?.marketplace?.activePublishers),
    featuredModules: asNumber(dashboard?.marketplace?.featuredModules),
    activeInstalls: asNumber(dashboard?.marketplace?.activeInstalls),
    activePilotGrants: asNumber(dashboard?.marketplace?.activePilotGrants),
    expiringPilotGrants: asNumber(dashboard?.marketplace?.expiringPilotGrants),
    modulesPublishedThisMonth: asNumber(dashboard?.marketplace?.modulesPublishedThisMonth),
    topInstalledModules: Array.isArray(dashboard?.marketplace?.topInstalledModules) ? dashboard.marketplace.topInstalledModules : [],
    topRatedModules: Array.isArray(dashboard?.marketplace?.topRatedModules) ? dashboard.marketplace.topRatedModules : [],
    recentPublishedModules: Array.isArray(dashboard?.marketplace?.recentPublishedModules) ? dashboard.marketplace.recentPublishedModules : [],
    pendingRequests: asNumber(dashboard?.marketplace?.pendingRequests),
    statusBreakdown: Array.isArray(dashboard?.marketplace?.statusBreakdown) ? dashboard.marketplace.statusBreakdown : [],
  };
  const charts = {
    revenueTrend: Array.isArray(dashboard?.charts?.revenueTrend) ? dashboard.charts.revenueTrend : [],
    tenantGrowth: Array.isArray(dashboard?.charts?.tenantGrowth) ? dashboard.charts.tenantGrowth : [],
  };
  const planDistribution = tenants.planDistribution;
  const revenueTrend = charts.revenueTrend;
  const tenantGrowth = charts.tenantGrowth;
  const marketplaceBreakdown = marketplace.statusBreakdown.slice(0, 6);
  const quickActions: QuickAction[] = [
    {
      id: "create-tenant",
      title: "Create Tenant",
      description: "Launch the tenant onboarding wizard.",
      icon: Plus,
      color: "text-[#0F4C2A]",
      bgColor: "bg-[#0F4C2A]/5 hover:bg-[#0F4C2A]/10",
      href: "/platform/tenants/create",
    },
    {
      id: "grant-pilot",
      title: "Grant Pilot Access",
      description: "Open pilot grants and issue a new module grant.",
      icon: Zap,
      color: "text-[#1565C0]",
      bgColor: "bg-[#1565C0]/5 hover:bg-[#1565C0]/10",
      href: "/platform/marketplace/pilot-grants",
    },
    {
      id: "review-modules",
      title: "Review Modules",
      description: "Process pending marketplace review items.",
      icon: Sparkles,
      color: "text-[#E8A020]",
      bgColor: "bg-[#E8A020]/5 hover:bg-[#E8A020]/10",
      href: "/platform/marketplace/admin",
      badge: marketplace.pendingReview > 0 ? `${marketplace.pendingReview}` : undefined,
    },
    {
      id: "process-payouts",
      title: "Process Payouts",
      description: "Review billing operations and publisher payouts.",
      icon: Wallet,
      color: "text-[#7C3AED]",
      bgColor: "bg-[#7C3AED]/5 hover:bg-[#7C3AED]/10",
      href: "/platform/billing",
    },
    {
      id: "security-alerts",
      title: "View Security Alerts",
      description: "Jump into security, impersonation, and anomaly monitoring.",
      icon: Shield,
      color: "text-[#D64545]",
      bgColor: "bg-[#D64545]/5 hover:bg-[#D64545]/10",
      href: "/platform/security",
      badge: health.status === "degraded" ? "Attention" : undefined,
    },
    {
      id: "impersonate",
      title: "Impersonate",
      description: "Start a guarded support session with full audit history.",
      icon: UserCog,
      color: "text-[#0D9488]",
      bgColor: "bg-[#0D9488]/5 hover:bg-[#0D9488]/10",
      href: "/platform/impersonation",
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

      <div className="rounded-xl border border-border/60 bg-background/95 p-2 shadow-sm">
        <div className="grid gap-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-card px-3.5 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tenants</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{stats.totalTenants.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.activeTenants.toLocaleString()} active • {stats.trialTenants.toLocaleString()} in trial
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
        </div>
      </div>

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
                <p>{health.failedActions24h.toLocaleString()} failed actions in the last 24h</p>
                <p>{health.scheduledMaintenance.toLocaleString()} scheduled maintenance windows ahead</p>
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
            {health.errorRateTrend.length > 0 ? (
               <div className="h-[94px] rounded-xl border border-border/60 p-2.5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={health.errorRateTrend}>
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
                <p className={cn("mt-1.5 text-base font-semibold", health.failedPayments7d > 0 && "text-[#D64545]")}>
                  {health.failedPayments7d.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Webhook delivery</p>
                <p className="mt-1.5 text-base font-semibold">{health.webhookDeliveryRate}%</p>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SMS delivery</p>
                <p className="mt-1.5 text-base font-semibold">{health.smsDeliveryRate}%</p>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email delivery</p>
                <p className="mt-1.5 text-base font-semibold">{health.emailDeliveryRate}%</p>
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
              Billing performance over the selected window with current recurring revenue and open pipeline.
            </p>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">MRR</p>
              <p className="mt-1.5 text-base font-semibold">{formatKes(revenue.mrrKes)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ARR</p>
              <p className="mt-1.5 text-base font-semibold">{formatKes(revenue.arrKes)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Collected</p>
              <p className="mt-1.5 text-base font-semibold">{formatKes(revenue.collectedKes)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{revenue.paidInvoices.toLocaleString()} paid invoices</p>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overdue</p>
              <p className="mt-1.5 text-base font-semibold">{formatKes(revenue.overdueKes)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{revenue.overdueInvoices.toLocaleString()} outstanding invoices</p>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open CRM pipeline</p>
              <p className="mt-1.5 text-lg font-semibold">{formatKes(revenue.pipelineKes)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5 sm:col-span-2">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue by plan</p>
                  {revenue.revenueByPlan.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No plan revenue yet.</p>
                  ) : (
                    revenue.revenueByPlan.map((entry: RevenueByPlanEntry) => (
                      <div key={entry.planId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{entry.planId}</span>
                          <span>{formatKes(entry.revenueKes)}</span>
                        </div>
                        <Progress value={Math.min(100, revenue.mrrKes > 0 ? (entry.revenueKes / revenue.mrrKes) * 100 : 0)} />
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue by provider</p>
                  {revenue.revenueByProvider.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payment provider data yet.</p>
                  ) : (
                    revenue.revenueByProvider.map((entry: RevenueByProviderEntry) => (
                      <div key={entry.provider} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                        <span className="capitalize">{entry.provider}</span>
                        <span className="font-medium">{formatKes(entry.revenueKes)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 p-2.5 sm:col-span-2">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top revenue modules</p>
                  {revenue.topRevenueModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Revenue by module will appear once installs are monetized.</p>
                  ) : (
                    revenue.topRevenueModules.slice(0, 5).map((entry: RevenueModuleEntry) => (
                      <div key={entry.moduleId} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.installs.toLocaleString()} installs</p>
                        </div>
                        <span>{formatKes(entry.revenueKes)}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-border/60 p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending publisher payouts</p>
                    <p className="mt-1.5 text-base font-semibold">{formatKes(revenue.pendingPublisherPayoutsKes)}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overdue invoices</p>
                    <p className="mt-1.5 text-base font-semibold">{formatKes(revenue.overdueKes)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Globe2 className="h-4 w-4 text-[#0F4C2A]" />
              Tenant Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Current school portfolio, trial posture, and plan distribution from live subscription data.
            </p>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1fr_260px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total schools</p>
                <p className="mt-2 text-2xl font-semibold">{tenants.total.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trialing</p>
                <p className="mt-2 text-2xl font-semibold">{tenants.trialing.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New in range</p>
                <p className="mt-2 text-2xl font-semibold">{tenants.newInRange.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  vs {tenants.previousNewInRange.toLocaleString()} previous period
                </p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trial conversion</p>
                <p className="mt-2 text-2xl font-semibold">{tenants.trialConversionRate}%</p>
              </div>
            </div>
            {planDistribution.length === 0 ? (
              <EmptyPanel title="Plan distribution will appear once subscriptions are active." />
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      dataKey="count"
                      nameKey="planId"
                      innerRadius={58}
                      outerRadius={86}
                      paddingAngle={3}
                    >
                      {planDistribution.map((entry: { planId: string; count: number }, index: number) => (
                        <Cell key={entry.planId} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: unknown, _name: unknown, item: any) => [`${Number(value ?? 0)} tenants`, item?.payload?.planId ?? "Plan"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-3 lg:col-span-2">
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approaching student limit</p>
                <div className="mt-3 space-y-3">
                  {tenants.approachingLimitTenants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tenants are currently at 90% of their student limit.</p>
                  ) : (
                    tenants.approachingLimitTenants.map((tenant: LimitTenantEntry) => (
                      <div key={tenant.tenantId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{tenant.name}</span>
                          <span className="text-muted-foreground">
                            {tenant.usage.toLocaleString()} / {tenant.studentLimit.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={tenant.usagePct} />
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Failed payments needing action</p>
                <div className="mt-3 space-y-2">
                  {tenants.failedPaymentTenants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tenant payment failures in the last 7 days.</p>
                  ) : (
                    tenants.failedPaymentTenants.map((tenant: FailedPaymentTenantEntry) => (
                      <div key={tenant.tenantId} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                        <span className="font-medium">{tenant.name}</span>
                        <span className="text-muted-foreground">
                          {new Date(tenant.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-[#E8A020]" />
              Marketplace Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Publisher activity, review queue, and module adoption across the EduMyles marketplace.
            </p>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1fr_260px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Published modules</p>
                <p className="mt-2 text-2xl font-semibold">{marketplace.publishedModules.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending review</p>
                <p className="mt-2 text-2xl font-semibold">{marketplace.pendingReview.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Published this month</p>
                <p className="mt-2 text-2xl font-semibold">{marketplace.modulesPublishedThisMonth.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active flags</p>
                <p className="mt-2 text-2xl font-semibold">{marketplace.activeFlags.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pilot grants expiring</p>
                <p className="mt-2 text-2xl font-semibold">{marketplace.expiringPilotGrants.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active publishers</p>
                <p className="mt-2 text-2xl font-semibold">{marketplace.activePublishers.toLocaleString()}</p>
              </div>
            </div>
            {marketplaceBreakdown.length === 0 ? (
              <EmptyPanel title="Module status breakdown will appear once submissions exist." />
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marketplaceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip formatter={(value: unknown) => [`${Number(value ?? 0)}`, "Modules"]} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#0F4C2A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-3 lg:col-span-2">
              <div className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live module catalog</p>
                  <Link href="/platform/marketplace/modules">
                    <Button size="sm" variant="outline">Open modules</Button>
                  </Link>
                </div>
                <div className="mt-3 space-y-2">
                  {marketplace.recentPublishedModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No published marketplace modules are available yet.</p>
                  ) : (
                    marketplace.recentPublishedModules.map((module: MarketplaceCatalogEntry) => (
                      <div key={module.moduleId} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{module.name}</p>
                          <p className="text-xs text-muted-foreground">{module.category} · {module.slug}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium capitalize">{module.status.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">{(module.installCount ?? 0).toLocaleString()} installs</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top installed modules</p>
                <div className="mt-3 space-y-2">
                  {marketplace.topInstalledModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Install rankings will appear as schools activate more modules.</p>
                  ) : (
                    marketplace.topInstalledModules.map((module: MarketplaceModuleEntry) => (
                      <div key={module.moduleId} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                        <span className="font-medium">{module.name}</span>
                        <span>{(module.installs ?? 0).toLocaleString()} installs</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top rated modules</p>
                <div className="mt-3 space-y-2">
                  {marketplace.topRatedModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No review scores available yet.</p>
                  ) : (
                    marketplace.topRatedModules.map((module: MarketplaceModuleEntry) => (
                      <div key={module.moduleId} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                        <span className="font-medium">{module.name}</span>
                        <span>{(module.rating ?? 0).toFixed(1)} / 5</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-[#1565C0]" />
              Revenue Trend
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Paid invoice collection and recurring value created during the selected period.
            </p>
          </CardHeader>
          <CardContent>
            {revenueTrend.length === 0 ? (
              <EmptyPanel title="Revenue trend data will appear once invoices and subscriptions exist." />
            ) : (
              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip formatter={(value: unknown) => [formatKes(Number(value ?? 0)), "Amount"]} />
                    <Area type="monotone" dataKey="invoicesKes" stackId="1" stroke="#1565C0" fill="#1565C0" fillOpacity={0.22} />
                    <Area type="monotone" dataKey="recurringKes" stackId="2" stroke="#0F4C2A" fill="#0F4C2A" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-[#0F4C2A]" />
              Tenant Growth
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              New tenant creation and waitlist conversion velocity across the selected period.
            </p>
          </CardHeader>
          <CardContent>
            {tenantGrowth.length === 0 ? (
              <EmptyPanel title="Tenant growth will appear once onboarding activity starts." />
            ) : (
              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tenantGrowth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip formatter={(value: unknown) => [`${Number(value ?? 0)}`, "Tenants"]} />
                    <Bar dataKey="newTenants" radius={[8, 8, 0, 0]} fill="#0F4C2A" />
                    <Bar dataKey="waitlistConversions" radius={[8, 8, 0, 0]} fill="#E8A020" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-3">
          <div className="px-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Wrench className="h-4 w-4 text-[#E8A020]" />
              Quick Actions
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump straight into the highest-frequency platform workflows.
            </p>
          </div>
          <QuickActions actions={quickActions} variant="grid" showHeader={false} />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 px-1">
            {ACTIVITY_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                variant={activityFilter === filter.value ? "default" : "outline"}
                size="sm"
                className={cn(activityFilter === filter.value && "bg-[#0F4C2A] hover:bg-[#1A7A4A]")}
                onClick={() => setActivityFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          {activityFeed === undefined && activityLoading ? (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldAlert className="h-4 w-4 text-[#0F4C2A]" />
                  Recent Activity
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Audit-backed cross-tenant activity from billing, onboarding, support, and security flows.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 p-5 pt-0">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <ActivityFeed events={activityFeed ?? []} isLoading={activityLoading} limit={20} showViewAll />
          )}
        </div>
      </div>
    </div>
  );
}
