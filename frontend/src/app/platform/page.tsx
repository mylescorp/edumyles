"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
  MessageSquareWarning,
  Plus,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { ActivityFeed } from "@/components/platform/ActivityFeed";
import { QuickActions, type QuickAction } from "@/components/platform/QuickActions";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
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

const ACTIVITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "school", label: "Tenants" },
  { value: "billing", label: "Billing" },
  { value: "security", label: "Security" },
  { value: "system", label: "System" },
] as const;

type TimeRange = (typeof TIME_RANGES)[number]["value"];
type ActivityFilter = (typeof ACTIVITY_FILTERS)[number]["value"];

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatKes(amountKes: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amountKes);
}

function formatSigned(value: number, formatter: (amount: number) => string = (amount) => amount.toLocaleString()) {
  if (value > 0) return `+${formatter(value)}`;
  if (value < 0) return `-${formatter(Math.abs(value))}`;
  return formatter(0);
}

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function getHealthTone(status: string) {
  if (status === "healthy") {
    return {
      badge: "border-[var(--platform-success-border)] bg-[var(--platform-success-soft)] text-[var(--em-primary)]",
      dot: "bg-[var(--em-success)]",
    };
  }
  if (status === "degraded") {
    return {
      badge: "border-[var(--platform-danger-border)] bg-[var(--platform-danger-soft)] text-[var(--em-danger)]",
      dot: "bg-[var(--em-danger)]",
    };
  }
  return {
    badge: "border-[var(--platform-highlight-border)] bg-[var(--platform-highlight-soft)] text-[var(--em-gold-deep)]",
    dot: "bg-[var(--platform-highlight)]",
  };
}

function EmptyStateCopy({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  tone = "default",
}: {
  title: string;
  value: string;
  subtitle: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-[var(--platform-success-border)] bg-[var(--platform-success-soft)]"
      : tone === "warning"
        ? "border-[var(--platform-highlight-border)] bg-[var(--platform-highlight-soft)]"
        : tone === "danger"
          ? "border-[var(--platform-danger-border)] bg-[var(--platform-danger-soft)]"
          : "border-border/60 bg-card";

  return (
    <div className={cn("rounded-xl border p-3", toneClass)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
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
    activeTenants: asNumber(dashboard.stats?.activeTenants),
    totalTenants: asNumber(dashboard.stats?.totalTenants),
    trialTenants: asNumber(dashboard.stats?.trialTenants),
    suspendedTenants: asNumber(dashboard.stats?.suspendedTenants),
    totalStudents: asNumber(dashboard.stats?.totalStudents),
    totalStaff: asNumber(dashboard.stats?.totalStaff),
    totalRevenueKes: asNumber(dashboard.stats?.totalRevenueKes),
    activeModules: asNumber(dashboard.stats?.activeModules),
    pendingReviews: asNumber(dashboard.stats?.pendingReviews),
    openFlags: asNumber(dashboard.stats?.openFlags),
    mrrKes: asNumber(dashboard.stats?.mrrKes),
    arrKes: asNumber(dashboard.stats?.arrKes),
    openTickets: asNumber(dashboard.stats?.openTickets),
    activeInstalls: asNumber(dashboard.stats?.activeInstalls),
    trends: {
      tenantGrowth: asNumber(dashboard.stats?.trends?.tenantGrowth),
      churnDelta: asNumber(dashboard.stats?.trends?.churnDelta),
      revenueGrowthKes: asNumber(dashboard.stats?.trends?.revenueGrowthKes),
    },
  };

  const health = {
    score: asNumber(dashboard.health?.score),
    status:
      dashboard.health?.status === "healthy" ||
      dashboard.health?.status === "watch" ||
      dashboard.health?.status === "degraded"
        ? dashboard.health.status
        : "watch",
    responseTimeAvg: asNumber(dashboard.health?.responseTimeAvg),
    errorRate24h: asNumber(dashboard.health?.errorRate24h),
    activeSessions: asNumber(dashboard.health?.activeSessions),
    failedPayments7d: asNumber(dashboard.health?.failedPayments7d),
    webhookDeliveryRate: asNumber(dashboard.health?.webhookDeliveryRate),
    smsDeliveryRate: asNumber(dashboard.health?.smsDeliveryRate),
    emailDeliveryRate: asNumber(dashboard.health?.emailDeliveryRate),
    activeIncidents: asNumber(dashboard.health?.activeIncidents),
    openSecurityIncidents: asNumber(dashboard.health?.openSecurityIncidents),
    activeMaintenance: asNumber(dashboard.health?.activeMaintenance),
    scheduledMaintenance: asNumber(dashboard.health?.scheduledMaintenance),
    criticalTickets: asNumber(dashboard.health?.criticalTickets),
    slaBreaches: asNumber(dashboard.health?.slaBreaches),
    failedActions24h: asNumber(dashboard.health?.failedActions24h),
    errorRateTrend: Array.isArray(dashboard.health?.errorRateTrend) ? dashboard.health.errorRateTrend : [],
  };

  const revenue = {
    collectedKes: asNumber(dashboard.revenue?.collectedKes),
    pipelineKes: asNumber(dashboard.revenue?.pipelineKes),
    overdueKes: asNumber(dashboard.revenue?.overdueKes),
    paidInvoices: asNumber(dashboard.revenue?.paidInvoices),
    overdueInvoices: asNumber(dashboard.revenue?.overdueInvoices),
    revenueByPlan: Array.isArray(dashboard.revenue?.revenueByPlan) ? dashboard.revenue.revenueByPlan : [],
    revenueByProvider: Array.isArray(dashboard.revenue?.revenueByProvider)
      ? dashboard.revenue.revenueByProvider
      : [],
    topRevenueModules: Array.isArray(dashboard.revenue?.topRevenueModules)
      ? dashboard.revenue.topRevenueModules
      : [],
    pendingPublisherPayoutsKes: asNumber(dashboard.revenue?.pendingPublisherPayoutsKes),
  };

  const tenants = {
    waitlistWaiting: asNumber(dashboard.tenants?.waitlistWaiting),
    trialConversionRate: asNumber(dashboard.tenants?.trialConversionRate),
    newInRange: asNumber(dashboard.tenants?.newInRange),
    churnedInRange: asNumber(dashboard.tenants?.churnedInRange),
    approachingLimitTenants: Array.isArray(dashboard.tenants?.approachingLimitTenants)
      ? dashboard.tenants.approachingLimitTenants
      : [],
    failedPaymentTenants: Array.isArray(dashboard.tenants?.failedPaymentTenants)
      ? dashboard.tenants.failedPaymentTenants
      : [],
  };

  const marketplace = {
    publishedModules: asNumber(dashboard.marketplace?.publishedModules),
    pendingReview: asNumber(dashboard.marketplace?.pendingReview),
    activeFlags: asNumber(dashboard.marketplace?.activeFlags),
    featuredModules: asNumber(dashboard.marketplace?.featuredModules),
    activeInstalls: asNumber(dashboard.marketplace?.activeInstalls),
    activePilotGrants: asNumber(dashboard.marketplace?.activePilotGrants),
    expiringPilotGrants: asNumber(dashboard.marketplace?.expiringPilotGrants),
    modulesPublishedThisMonth: asNumber(dashboard.marketplace?.modulesPublishedThisMonth),
    topInstalledModules: Array.isArray(dashboard.marketplace?.topInstalledModules)
      ? dashboard.marketplace.topInstalledModules
      : [],
    topRatedModules: Array.isArray(dashboard.marketplace?.topRatedModules)
      ? dashboard.marketplace.topRatedModules
      : [],
    statusBreakdown: Array.isArray(dashboard.marketplace?.statusBreakdown)
      ? dashboard.marketplace.statusBreakdown
      : [],
  };

  const charts = {
    revenueTrend: Array.isArray(dashboard.charts?.revenueTrend) ? dashboard.charts.revenueTrend : [],
    tenantGrowth: Array.isArray(dashboard.charts?.tenantGrowth) ? dashboard.charts.tenantGrowth : [],
  };

  const quickActions: QuickAction[] = [
    {
      id: "create-tenant",
      title: "Create Tenant",
      description: "Launch onboarding for a new school.",
      icon: Plus,
      color: "text-white",
      bgColor: "bg-[var(--platform-accent)] hover:bg-[var(--platform-accent-hover)]",
      href: "/platform/tenants/create",
    },
    {
      id: "analytics",
      title: "Open Analytics",
      description: "Dive into BI and predictive reporting.",
      icon: BarChart3,
      color: "text-white",
      bgColor: "bg-[var(--platform-accent)] hover:bg-[var(--platform-accent-hover)]",
      href: "/platform/analytics",
    },
    {
      id: "review-modules",
      title: "Review Marketplace",
      description: "Process pending requests and flagged content.",
      icon: Sparkles,
      color: "text-white",
      bgColor: "bg-[var(--platform-accent)] hover:bg-[var(--platform-accent-hover)]",
      href: "/platform/marketplace/admin",
      badge: stats.pendingReviews > 0 ? String(stats.pendingReviews) : undefined,
    },
    {
      id: "billing",
      title: "Billing Operations",
      description: "Follow overdue invoices and payout work.",
      icon: Wallet,
      color: "text-white",
      bgColor: "bg-[var(--platform-accent)] hover:bg-[var(--platform-accent-hover)]",
      href: "/platform/billing",
    },
  ];

  const healthTone = getHealthTone(health.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <PageHeader
          title="Platform Dashboard"
          description="Live operational picture across tenants, billing, support, security, and marketplace activity."
          breadcrumbs={[{ label: "Dashboard" }]}
          badge={
            <Badge className="gap-1.5 border border-[var(--platform-success-border)] bg-[var(--platform-success-soft)] text-xs text-[var(--em-primary)]">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--em-success)]" />
              Live backend data
            </Badge>
          }
          className="mb-0 flex-1"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/platform/analytics">
            <Button size="sm" variant="outline" className="h-9 border-border/70 bg-background/70">
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/platform/tenants/create">
            <Button size="sm" className="h-9 bg-[var(--platform-accent)] text-white hover:bg-[var(--platform-accent-hover)]">
              <Plus className="mr-1.5 h-4 w-4" />
              New Tenant
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Window</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.totalTenants.toLocaleString()} tenants, {stats.totalStudents.toLocaleString()} students,{" "}
            {stats.totalStaff.toLocaleString()} staff records
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
          {TIME_RANGES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTimeRange(value);
                announceToScreenReader(`Showing ${label} of dashboard data`);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                timeRange === value
                  ? "bg-[var(--platform-accent)] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="border-border/60 shadow-sm xl:col-span-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-[var(--platform-accent)]" />
              Billing Actions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Real-time billing follow-up from invoices, payout backlog, and failed charge signals.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <MetricCard
              title="Total Collected"
              value={formatKes(stats.totalRevenueKes)}
              subtitle="Lifetime paid invoices in backend"
            />
            <MetricCard
              title="Failed Payments"
              value={health.failedPayments7d.toLocaleString()}
              subtitle="Payment callback failures in the last 7 days"
              tone={health.failedPayments7d > 0 ? "warning" : "success"}
            />
            <MetricCard
              title="Open Flags"
              value={stats.openFlags.toLocaleString()}
              subtitle="Marketplace and moderation review load"
              tone={stats.openFlags > 0 ? "warning" : "default"}
            />
            <MetricCard
              title="Active Modules"
              value={stats.activeModules.toLocaleString()}
              subtitle={`${stats.activeInstalls.toLocaleString()} active installs across tenants`}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4 text-[var(--platform-accent)]" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricCard
              title="Open Security"
              value={health.openSecurityIncidents.toLocaleString()}
              subtitle="Investigating or contained"
              tone={health.openSecurityIncidents > 0 ? "danger" : "success"}
            />
            <MetricCard
              title="Audit Failures"
              value={health.failedActions24h.toLocaleString()}
              subtitle="Denied, fail, or error actions in 24h"
              tone={health.failedActions24h > 0 ? "warning" : "success"}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquareWarning className="h-4 w-4 text-[var(--platform-accent)]" />
              Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricCard
              title="Open Tickets"
              value={stats.openTickets.toLocaleString()}
              subtitle={`${health.criticalTickets.toLocaleString()} critical right now`}
              tone={stats.openTickets > 0 ? "warning" : "success"}
            />
            <MetricCard
              title="SLA Breaches"
              value={health.slaBreaches.toLocaleString()}
              subtitle="Need immediate operational attention"
              tone={health.slaBreaches > 0 ? "danger" : "success"}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        <MetricCard
          title="Tenant Base"
          value={stats.totalTenants.toLocaleString()}
          subtitle={`${stats.activeTenants.toLocaleString()} active, ${stats.trialTenants.toLocaleString()} trial, trend ${formatSigned(stats.trends.tenantGrowth)}`}
          tone="success"
        />
        <MetricCard
          title="Recurring Revenue"
          value={formatKes(stats.mrrKes)}
          subtitle={`ARR ${formatKes(stats.arrKes)} and collected ${formatKes(revenue.collectedKes)}`}
          tone="success"
        />
        <MetricCard
          title="Support Pressure"
          value={stats.openTickets.toLocaleString()}
          subtitle={`${health.criticalTickets.toLocaleString()} critical tickets, ${health.slaBreaches.toLocaleString()} SLA breaches`}
          tone={health.criticalTickets > 0 || health.slaBreaches > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Marketplace Load"
          value={stats.pendingReviews.toLocaleString()}
          subtitle={`${marketplace.activeFlags.toLocaleString()} open flags, ${marketplace.activePilotGrants.toLocaleString()} active grants`}
          tone={marketplace.activeFlags > 0 ? "warning" : "default"}
        />
      </div>

      <QuickActions actions={quickActions} className="border-border/60 shadow-sm" />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-[var(--platform-accent)]" />
              Revenue Trend
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Invoice collections and recurring revenue across the selected period.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard
                title="Collected"
                value={formatKes(revenue.collectedKes)}
                subtitle={`${revenue.paidInvoices.toLocaleString()} paid invoices`}
              />
              <MetricCard
                title="Pipeline"
                value={formatKes(revenue.pipelineKes)}
                subtitle="Open CRM deal value"
              />
              <MetricCard
                title="Overdue"
                value={formatKes(revenue.overdueKes)}
                subtitle={`${revenue.overdueInvoices.toLocaleString()} overdue invoices`}
                tone={revenue.overdueInvoices > 0 ? "warning" : "default"}
              />
              <MetricCard
                title="Growth"
                value={formatSigned(stats.trends.revenueGrowthKes, formatKes)}
                subtitle="Compared with previous matching period"
                tone={stats.trends.revenueGrowthKes >= 0 ? "success" : "danger"}
              />
            </div>

            <div className="h-[280px] rounded-2xl border border-border/60 bg-muted/10 p-3">
              {charts.revenueTrend.length === 0 ? (
                <EmptyStateCopy
                  title="No billing trend in range"
                  description="Paid invoice activity will appear here once the backend has collections inside the selected window."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.revenueTrend}>
                    <defs>
                      <linearGradient id="invoiceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--platform-accent)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--platform-accent)" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                    />
                    <Tooltip
                      formatter={(value: unknown, name: string | number | undefined) => [
                        formatKes(asNumber(value)),
                        name === "invoicesKes" ? "Invoices" : "Recurring",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="invoicesKes"
                      name="invoicesKes"
                      stroke="var(--platform-accent)"
                      strokeWidth={2.5}
                      fill="url(#invoiceGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="recurringKes"
                      name="recurringKes"
                      stroke="var(--platform-highlight)"
                      strokeWidth={2}
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-[var(--platform-accent)]" />
                Platform Health
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Live reliability posture based on incidents, security, audit failures, and delivery telemetry.
              </p>
            </div>
            <Badge variant="outline" className={cn("capitalize", healthTone.badge)}>
              <span className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", healthTone.dot)} />
              {health.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Health score</p>
                  <p className="text-3xl font-semibold tracking-tight">{health.score}%</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{health.failedActions24h.toLocaleString()} failed actions in 24h</p>
                  <p>{health.scheduledMaintenance.toLocaleString()} scheduled windows ahead</p>
                </div>
              </div>
              <Progress value={health.score} className="mt-3 h-2.5" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                title="Response Avg"
                value={`${health.responseTimeAvg.toLocaleString()} ms`}
                subtitle={`${health.activeSessions.toLocaleString()} active sessions`}
              />
              <MetricCard
                title="Error Rate"
                value={formatPercent(health.errorRate24h)}
                subtitle={`${health.failedPayments7d.toLocaleString()} failed payments in 7d`}
                tone={health.errorRate24h > 2 ? "warning" : "default"}
              />
              <MetricCard
                title="Delivery"
                value={formatPercent(health.webhookDeliveryRate)}
                subtitle={`Email ${formatPercent(health.emailDeliveryRate)}, SMS ${formatPercent(health.smsDeliveryRate)}`}
              />
              <MetricCard
                title="Risk Events"
                value={(health.activeIncidents + health.openSecurityIncidents).toLocaleString()}
                subtitle={`${health.activeIncidents.toLocaleString()} incidents, ${health.openSecurityIncidents.toLocaleString()} security`}
                tone={health.activeIncidents + health.openSecurityIncidents > 0 ? "danger" : "success"}
              />
            </div>

            <div className="h-[120px] rounded-2xl border border-border/60 bg-muted/10 p-2">
              {health.errorRateTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No audit error trend available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={health.errorRateTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.22)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value: unknown) => [formatPercent(asNumber(value)), "Error rate"]} />
                    <Area type="monotone" dataKey="errorRate" stroke="var(--em-danger)" fill="rgba(220, 38, 38, 0.12)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-[var(--platform-accent)]" />
              Tenant Watchlist
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Capacity risk, failed payments, conversion, and acquisition signals from live subscriptions.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                title="New in Range"
                value={tenants.newInRange.toLocaleString()}
                subtitle={`${tenants.waitlistWaiting.toLocaleString()} still on waitlist`}
              />
              <MetricCard
                title="Churned"
                value={tenants.churnedInRange.toLocaleString()}
                subtitle={`Trial conversion ${formatPercent(tenants.trialConversionRate)}`}
                tone={tenants.churnedInRange > 0 ? "warning" : "default"}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Approaching Student Limits
                </p>
                <Link href="/platform/tenants">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    View tenants
                  </Button>
                </Link>
              </div>
              {tenants.approachingLimitTenants.length === 0 ? (
                <EmptyStateCopy
                  title="No tenants near limits"
                  description="Capacity pressure will show up here when live student usage reaches plan thresholds."
                />
              ) : (
                <div className="space-y-3">
                  {tenants.approachingLimitTenants.map((tenant: any) => (
                    <div key={tenant.tenantId} className="rounded-xl border border-border/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.usage.toLocaleString()} / {tenant.studentLimit.toLocaleString()} students
                          </p>
                        </div>
                        <Badge variant="outline" className="border-[var(--platform-highlight-border)] bg-[var(--platform-highlight-soft)] text-[var(--em-gold-deep)]">
                          {tenant.usagePct}%
                        </Badge>
                      </div>
                      <Progress value={tenant.usagePct} className="mt-3 h-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Failed Payments in 7 Days
              </p>
              {tenants.failedPaymentTenants.length === 0 ? (
                <EmptyStateCopy
                  title="No recent failed payment tenants"
                  description="Billing exceptions from payment callbacks will appear here automatically."
                />
              ) : (
                <div className="space-y-2">
                  {tenants.failedPaymentTenants.map((tenant: any) => (
                    <div key={tenant.tenantId} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">Payment callback failed recently</p>
                      </div>
                      <Badge variant="outline" className="border-[var(--platform-danger-border)] bg-[var(--platform-danger-soft)] text-[var(--em-danger)]">
                        At risk
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-[var(--platform-accent)]" />
              Tenant Growth
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              New tenant creation and waitlist conversions over the selected window.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard
                title="Active"
                value={stats.activeTenants.toLocaleString()}
                subtitle={`${stats.suspendedTenants.toLocaleString()} suspended`}
              />
              <MetricCard
                title="Trial"
                value={stats.trialTenants.toLocaleString()}
                subtitle={`${tenants.waitlistWaiting.toLocaleString()} waiting list`}
              />
              <MetricCard
                title="People"
                value={stats.totalStudents.toLocaleString()}
                subtitle={`${stats.totalStaff.toLocaleString()} staff records`}
              />
            </div>

            <div className="h-[280px] rounded-2xl border border-border/60 bg-muted/10 p-3">
              {charts.tenantGrowth.length === 0 ? (
                <EmptyStateCopy
                  title="No tenant growth data in range"
                  description="New tenants and waitlist conversions will plot here once the backend returns activity for this window."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.tenantGrowth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="newTenants" fill="var(--platform-accent)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="waitlistConversions" fill="var(--platform-highlight)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan Revenue</p>
                <div className="mt-3 space-y-3">
                  {revenue.revenueByPlan.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active subscription revenue by plan yet.</p>
                  ) : (
                    revenue.revenueByPlan.slice(0, 4).map((entry: any) => (
                      <div key={entry.planId} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">{entry.planId}</span>
                          <span className="text-xs text-muted-foreground">
                            {entry.tenants.toLocaleString()} tenants
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Progress
                            value={stats.mrrKes > 0 ? (entry.revenueKes / stats.mrrKes) * 100 : 0}
                            className="h-2 flex-1"
                          />
                          <span className="w-24 text-right text-sm font-medium">
                            {formatKes(entry.revenueKes)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue Sources</p>
                <div className="mt-3 space-y-2">
                  {revenue.revenueByProvider.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payment provider breakdown available yet.</p>
                  ) : (
                    revenue.revenueByProvider.map((entry: any) => (
                      <div key={entry.provider} className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2">
                        <span className="text-sm font-medium capitalize">{entry.provider}</span>
                        <span className="text-sm text-muted-foreground">{formatKes(entry.revenueKes)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Globe2 className="h-4 w-4 text-[var(--platform-accent)]" />
              Marketplace Pulse
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Publishing health, install momentum, featured inventory, and live review load.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                title="Published Modules"
                value={marketplace.publishedModules.toLocaleString()}
                subtitle={`${marketplace.modulesPublishedThisMonth.toLocaleString()} published this month`}
              />
              <MetricCard
                title="Active Installs"
                value={marketplace.activeInstalls.toLocaleString()}
                subtitle={`${marketplace.featuredModules.toLocaleString()} featured modules`}
              />
              <MetricCard
                title="Review Queue"
                value={marketplace.pendingReview.toLocaleString()}
                subtitle={`${marketplace.activeFlags.toLocaleString()} flagged items`}
                tone={marketplace.pendingReview > 0 || marketplace.activeFlags > 0 ? "warning" : "default"}
              />
              <MetricCard
                title="Pilot Grants"
                value={marketplace.activePilotGrants.toLocaleString()}
                subtitle={`${marketplace.expiringPilotGrants.toLocaleString()} expiring soon`}
                tone={marketplace.expiringPilotGrants > 0 ? "warning" : "default"}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Installed</p>
                <div className="mt-3 space-y-2">
                  {marketplace.topInstalledModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No install leaderboard available yet.</p>
                  ) : (
                    marketplace.topInstalledModules.map((module: any) => (
                      <div key={module.moduleId} className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{module.name}</p>
                          <p className="text-xs text-muted-foreground">{module.installs.toLocaleString()} installs</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatKes(asNumber(module.revenueKes))}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Rated</p>
                <div className="mt-3 space-y-2">
                  {marketplace.topRatedModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No ratings have been recorded yet.</p>
                  ) : (
                    marketplace.topRatedModules.map((module: any) => (
                      <div key={module.moduleId} className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{module.name}</p>
                          <p className="text-xs text-muted-foreground">{module.installs.toLocaleString()} installs</p>
                        </div>
                        <Badge variant="outline" className="border-[var(--platform-accent-border)] bg-[var(--platform-accent-soft)] text-[var(--platform-accent)]">
                          {module.rating?.toFixed?.(1) ?? module.rating} / 5
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status Breakdown</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {marketplace.statusBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Marketplace statuses will appear here as modules move through workflow states.</p>
                ) : (
                  marketplace.statusBreakdown.map((entry: any) => (
                    <Badge key={entry.status} variant="secondary" className="h-7 px-2.5 text-xs">
                      {entry.status}: {entry.count}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-[var(--platform-accent)]" />
                Live Activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Recent audit and platform events streamed from backend activity logs.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {ACTIVITY_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setActivityFilter(value);
                    announceToScreenReader(`Filtering activity by ${label}`);
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                    activityFilter === value
                      ? "bg-[var(--platform-accent)] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <MetricCard
                title="Incidents"
                value={health.activeIncidents.toLocaleString()}
                subtitle="Active platform incidents"
                tone={health.activeIncidents > 0 ? "danger" : "success"}
              />
              <MetricCard
                title="Security"
                value={health.openSecurityIncidents.toLocaleString()}
                subtitle="Open security incidents"
                tone={health.openSecurityIncidents > 0 ? "danger" : "success"}
              />
              <MetricCard
                title="Maintenance"
                value={health.activeMaintenance.toLocaleString()}
                subtitle={`${health.scheduledMaintenance.toLocaleString()} scheduled`}
                tone={health.activeMaintenance > 0 ? "warning" : "default"}
              />
              <MetricCard
                title="Payouts Pending"
                value={formatKes(revenue.pendingPublisherPayoutsKes)}
                subtitle="Awaiting publisher payout"
                tone={revenue.pendingPublisherPayoutsKes > 0 ? "warning" : "default"}
              />
            </div>

            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
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
              <ActivityFeed events={activityFeed || []} showViewAll={false} />
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
