"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  History,
  LifeBuoy,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { ActivityFeed } from "@/components/platform/ActivityFeed";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useAuth } from "@/hooks/useAuth";
import { useActivityFeedByType, usePlatformDashboardOverview } from "@/hooks/useDashboardData";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { PanelWelcomeCard } from "@/components/shared/PanelWelcomeCard";

const TIME_RANGES = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "12m", label: "12M" },
] as const;

type TimeRange = (typeof TIME_RANGES)[number]["value"];

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

export default function PlatformDashboardPage() {
  const { isLoading } = useAuth();
  const { hasRole } = usePermissions();
  const { announceToScreenReader } = useAccessibility();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

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
  const { data: activityFeed, isLoading: activityLoading } = useActivityFeedByType(20);

  if (isLoading || dashboardLoading) {
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
    totalRevenueKes: asNumber(dashboard.stats?.totalRevenueKes),
    mrrKes: asNumber(dashboard.stats?.mrrKes),
    openTickets: asNumber(dashboard.stats?.openTickets),
    activeModules: asNumber(dashboard.stats?.activeModules),
  };
  const hasDashboardData = dashboard !== undefined;

  const health = {
    status:
      dashboard.health?.status === "healthy" ||
      dashboard.health?.status === "watch" ||
      dashboard.health?.status === "degraded"
        ? dashboard.health.status
        : "watch",
    responseTimeAvg: asNumber(dashboard.health?.responseTimeAvg),
    errorRate24h: asNumber(dashboard.health?.errorRate24h),
    failedPayments7d: asNumber(dashboard.health?.failedPayments7d),
    openSecurityIncidents: asNumber(dashboard.health?.openSecurityIncidents),
    slaBreaches: asNumber(dashboard.health?.slaBreaches),
    failedActions24h: asNumber(dashboard.health?.failedActions24h),
  };

  const marketplace = {
    activeFlags: asNumber(dashboard.marketplace?.activeFlags),
    activeInstalls: asNumber(dashboard.marketplace?.activeInstalls),
  };

  const healthTone = getHealthTone(health.status);

  const attentionCount = hasDashboardData ?
    health.failedPayments7d +
    health.openSecurityIncidents +
    health.failedActions24h +
    health.slaBreaches +
    marketplace.activeFlags : null;
  const actionItems = [
    { title: "Create tenant", description: "Launch onboarding for a new school.", icon: Plus, href: "/platform/tenants/create" },
    { title: "Open analytics", description: "View BI and predictive reporting.", icon: BarChart3, href: "/platform/analytics" },
    { title: "Invite staff", description: "Add a platform team member.", icon: Users, href: "/platform/users/invite" },
    { title: "Review audit log", description: "See who changed what, and when.", icon: History, href: "/platform/audit" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-8">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Platform / Dashboard</p>
          <PageHeader
            title="Platform dashboard"
            description="Tenants, billing, support, security and marketplace activity in one place."
            breadcrumbs={[]}
            className="mb-0"
          />
          <nav aria-label="Dashboard views" className="mt-4 flex items-center gap-5 text-sm">
            <span aria-current="page" className="border-b-2 border-[var(--platform-accent)] pb-2 font-medium text-foreground">Overview</span>
            <Link href="/platform/analytics" className="pb-2 text-muted-foreground transition-colors hover:text-foreground">Reports</Link>
            <a href="#recent-activity" className="pb-2 text-muted-foreground transition-colors hover:text-foreground">Activity</a>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <div className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-card p-1" aria-label="Dashboard time range">
            {TIME_RANGES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={timeRange === value}
                onClick={() => {
                  setTimeRange(value);
                  announceToScreenReader(`Showing ${label} of dashboard data`);
                }}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  timeRange === value ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Link href="/platform/tenants/create">
            <Button size="sm" className="bg-[var(--platform-accent)] text-white hover:bg-[var(--platform-accent-hover)]">
              <Plus className="mr-1.5 h-4 w-4" /> New tenant
            </Button>
          </Link>
        </div>
      </div>

      <PanelWelcomeCard
        description="Here is your platform overview and the latest activity across schools, billing, and support."
        actions={(
          <>
            <Link href="/platform/tenants/create">
              <Button size="sm" className="bg-[var(--platform-highlight)] text-slate-950 hover:brightness-95">Create first school</Button>
            </Link>
            <Link href="/platform/analytics">
              <Button size="sm" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">Open analytics</Button>
            </Link>
          </>
        )}
        metrics={[
          { label: "Platform", value: hasDashboardData ? health.status[0].toUpperCase() + health.status.slice(1) : "—" },
          { label: "Avg response", value: hasDashboardData ? `${health.responseTimeAvg.toLocaleString()} ms` : "—" },
          { label: "Error rate", value: hasDashboardData ? `${health.errorRate24h.toFixed(1)}%` : "—" },
        ]}
      />

      <section aria-label="Platform summary metrics" className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Total collected", value: hasDashboardData ? formatKes(stats.totalRevenueKes) : "—", note: hasDashboardData ? "Lifetime paid invoices" : "Waiting for platform data", icon: CircleDollarSign },
          { label: "Active tenants", value: hasDashboardData ? stats.activeTenants.toLocaleString() : "—", note: hasDashboardData ? `${stats.activeTenants.toLocaleString()} currently active` : "Waiting for platform data", icon: Building2 },
          { label: "Open tickets", value: hasDashboardData ? stats.openTickets.toLocaleString() : "—", note: hasDashboardData ? `${health.slaBreaches.toLocaleString()} SLA breaches` : "Waiting for platform data", icon: LifeBuoy },
        ].map((metric) => (
          <Card key={metric.label} className="border-border/70 shadow-sm">
            <CardContent className="flex items-start justify-between p-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>
              </div>
              <span className="rounded-md bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><metric.icon className="h-4 w-4" /></span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid items-stretch gap-3 xl:grid-cols-[1.65fr_0.95fr]">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 md:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Needs attention</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Current items that need attention.</p>
              </div>
              <Badge variant="outline" className={cn("gap-1 border", attentionCount === 0 ? healthTone.badge : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200")}>
                {attentionCount === 0 ? <Check className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                {attentionCount === null ? "Reconnecting" : attentionCount === 0 ? "All clear" : `${attentionCount.toLocaleString()} to review`}
              </Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
              {[
                { title: "Billing", icon: CreditCard, firstLabel: "Failed payments", firstValue: health.failedPayments7d, secondLabel: "Recurring revenue", secondValue: formatKes(stats.mrrKes), detail: "Callback failures, last 7 days" },
                { title: "Security", icon: ShieldCheck, firstLabel: "Open incidents", firstValue: health.openSecurityIncidents, secondLabel: "Audit failures", secondValue: health.failedActions24h, detail: "Denied or failed, last 24h" },
                { title: "Support", icon: LifeBuoy, firstLabel: "Open tickets", firstValue: stats.openTickets, secondLabel: "SLA breaches", secondValue: health.slaBreaches, detail: "Need immediate attention" },
                { title: "Marketplace", icon: Store, firstLabel: "Active modules", firstValue: stats.activeModules, secondLabel: "Open flags", secondValue: marketplace.activeFlags, detail: "Installs across tenants" },
              ].map((item) => (
                <div key={item.title} className="min-h-[128px] rounded-lg border border-border/60 bg-muted/35 p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold"><item.icon className="h-3.5 w-3.5 text-[var(--platform-accent)]" />{item.title}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div><p className="text-lg font-semibold leading-none">{!hasDashboardData ? "—" : typeof item.firstValue === "number" ? item.firstValue.toLocaleString() : item.firstValue}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.firstLabel}</p></div>
                    <div><p className="text-lg font-semibold leading-none">{!hasDashboardData ? "—" : typeof item.secondValue === "number" ? item.secondValue.toLocaleString() : item.secondValue}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.secondLabel}</p></div>
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 md:p-5">
            <h2 className="text-sm font-semibold">Getting started</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{!hasDashboardData ? "Platform setup checklist" : stats.activeTenants === 0 ? "0 of 3 steps done" : "Your platform setup checklist"}</p>
            <div className="mt-4 space-y-1">
              {[
                { title: "Create your first school", detail: "Launch onboarding for a new tenant.", href: "/platform/tenants/create" },
                { title: "Invite platform staff", detail: "Add admins, support and finance roles.", href: "/platform/users/invite" },
                { title: "Connect M-Pesa collection", detail: "Review payment settings before go-live.", href: "/platform/settings" },
              ].map((step, index) => (
                <Link key={step.title} href={step.href} className="group flex items-center gap-3 rounded-lg px-1.5 py-2.5 transition-colors hover:bg-muted/60">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">{index + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{step.title}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{step.detail}</span></span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid items-stretch gap-3 xl:grid-cols-[1.65fr_0.95fr]">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Quick actions</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{actionItems.length} available</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
              {actionItems.map((action) => (
                <Link key={action.title} href={action.href} className="group flex min-h-[68px] items-center gap-2.5 rounded-lg border border-border/70 bg-card px-3 py-2.5 transition-colors hover:border-[var(--platform-accent)]/40 hover:bg-muted/30">
                  <span className="rounded-md bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><action.icon className="h-4 w-4" /></span>
                  <span className="min-w-0"><span className="block text-xs font-semibold">{action.title}</span><span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">{action.description}</span></span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card id="recent-activity" className="scroll-mt-24 border-border/70 shadow-sm">
          <CardContent className="p-4 md:p-5">
            <div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--platform-accent)]" /><h2 className="text-sm font-semibold">Recent activity</h2></div>
            {!hasDashboardData ? (
              <div className="flex min-h-[110px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 px-4 text-center">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-xs font-semibold">Reconnecting</p>
                <p className="mt-1 max-w-[230px] text-[11px] leading-4 text-muted-foreground">Recent activity will appear here when the platform service is available.</p>
              </div>
            ) : activityLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 3 }).map((_, index) => <div key={index} className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="flex-1 space-y-1"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}
              </div>
            ) : (activityFeed?.length ?? 0) === 0 ? (
              <div className="flex min-h-[110px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 px-4 text-center">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-xs font-semibold">Nothing yet</p>
                <p className="mt-1 max-w-[230px] text-[11px] leading-4 text-muted-foreground">School sign-ups, payments and support events will appear here as they happen.</p>
              </div>
            ) : <ActivityFeed events={activityFeed || []} showViewAll={false} />}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
