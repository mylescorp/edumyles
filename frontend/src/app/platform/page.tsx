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
  ShieldAlert,
  Sparkles,
  Ticket,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ActivityFeed } from "@/components/platform/ActivityFeed";
import { QuickActions } from "@/components/platform/QuickActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformDashboardOverview, useActivityFeed } from "@/hooks/useDashboardData";
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

function formatKes(amountKes: number) {
  return `KES ${amountKes.toLocaleString()}`;
}

function EmptyPanel({ title }: { title: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
      {title}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Building2;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
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

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();
  const { hasRole } = usePermissions();
  const { announceToScreenReader } = useAccessibility();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const isPlatformAdmin = hasRole("master_admin", "super_admin");

  const { data: dashboard, isLoading: dashboardLoading } = usePlatformDashboardOverview(timeRange);
  const { data: activityFeed, isLoading: activityLoading } = useActivityFeed(20);

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

  const { stats, health, revenue, tenants, marketplace, charts } = dashboard;
  const planDistribution = tenants.planDistribution ?? [];
  const revenueTrend = charts.revenueTrend ?? [];
  const tenantGrowth = charts.tenantGrowth ?? [];
  const marketplaceBreakdown = (marketplace.statusBreakdown ?? []).slice(0, 6);

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Tenants"
          value={stats.activeTenants.toLocaleString()}
          subtitle={`${stats.totalTenants.toLocaleString()} total schools`}
          icon={Building2}
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatKes(stats.mrrKes)}
          subtitle={`ARR ${formatKes(stats.arrKes)}`}
          icon={CreditCard}
        />
        <StatCard
          title="Open Support Queue"
          value={stats.openTickets.toLocaleString()}
          subtitle={`${health.criticalTickets.toLocaleString()} high-priority tickets`}
          icon={Ticket}
        />
        <StatCard
          title="Active Module Installs"
          value={stats.activeInstalls.toLocaleString()}
          subtitle={`${marketplace.publishedModules.toLocaleString()} published modules`}
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.35fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
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
          <CardContent className="space-y-6">
            <div className="flex items-end justify-between rounded-2xl border border-border/60 bg-muted/20 p-5">
              <div>
                <p className="text-sm text-muted-foreground">Health score</p>
                <p className="text-4xl font-semibold tracking-tight">{health.score}%</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{health.failedActions24h.toLocaleString()} failed actions in the last 24h</p>
                <p>{health.scheduledMaintenance.toLocaleString()} scheduled maintenance windows ahead</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active incidents</p>
                <p className="mt-2 text-2xl font-semibold">{health.activeIncidents.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Security incidents</p>
                <p className="mt-2 text-2xl font-semibold">{health.openSecurityIncidents.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maintenance now</p>
                <p className="mt-2 text-2xl font-semibold">{health.activeMaintenance.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SLA breaches</p>
                <p className="mt-2 text-2xl font-semibold">{health.slaBreaches.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-[#1565C0]" />
              Revenue Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Billing performance over the selected window with current recurring revenue and open pipeline.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">MRR</p>
              <p className="mt-2 text-2xl font-semibold">{formatKes(revenue.mrrKes)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ARR</p>
              <p className="mt-2 text-2xl font-semibold">{formatKes(revenue.arrKes)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Collected</p>
              <p className="mt-2 text-2xl font-semibold">{formatKes(revenue.collectedKes)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{revenue.paidInvoices.toLocaleString()} paid invoices</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overdue</p>
              <p className="mt-2 text-2xl font-semibold">{formatKes(revenue.overdueKes)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{revenue.overdueInvoices.toLocaleString()} outstanding invoices</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open CRM pipeline</p>
              <p className="mt-2 text-3xl font-semibold">{formatKes(revenue.pipelineKes)}</p>
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
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Waitlist waiting</p>
                <p className="mt-2 text-2xl font-semibold">{tenants.waitlistWaiting.toLocaleString()}</p>
              </div>
            </div>
            {planDistribution.length === 0 ? (
              <EmptyPanel title="Plan distribution will appear once subscriptions are active." />
            ) : (
              <div className="h-[240px]">
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
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active publishers</p>
                <p className="mt-2 text-2xl font-semibold">{marketplace.activePublishers.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending requests</p>
                <p className="mt-2 text-2xl font-semibold">{marketplace.pendingRequests.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pilot grants active</p>
                <p className="mt-2 text-2xl font-semibold">{marketplace.activePilotGrants.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Featured modules</p>
                <p className="mt-2 text-2xl font-semibold">{marketplace.featuredModules.toLocaleString()}</p>
              </div>
            </div>
            {marketplaceBreakdown.length === 0 ? (
              <EmptyPanel title="Module status breakdown will appear once submissions exist." />
            ) : (
              <div className="h-[240px]">
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
              <div className="h-[300px]">
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
              <div className="h-[300px]">
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
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
          <QuickActions variant="grid" showHeader={false} />
        </div>

        <div className="space-y-3">
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
