"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { BillingAdminRail } from "@/components/platform/BillingAdminRail";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/formatters";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  CreditCard,
  FileWarning,
  LineChart,
  Receipt,
  ShieldAlert,
} from "lucide-react";

type BillingDashboardOverview = {
  summary: {
    mrrKes: number;
    arrKes: number;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    overdueInvoiceCount: number;
    overdueAmountKes: number;
    atRiskCount: number;
    churnLast30Days: number;
    churnRatePct: number;
    revenueLast30DaysKes: number;
    revenueGrowthPct: number;
  };
  revenueByPlan: Array<{
    planId: string;
    planLabel: string;
    tenantCount: number;
    monthlyKes: number;
  }>;
  recentActivity: Array<{
    id: string;
    tenantId: string;
    tenantName: string;
    status: string;
    totalAmountKes: number;
    dueDate: number;
    updatedAt: number;
  }>;
  atRiskTenants: Array<{
    tenantId: string;
    tenantName: string;
    status: string;
    planId: string;
    trialEndsAt?: number;
    nextPaymentDue?: number;
  }>;
};

type SubscriptionRow = {
  _id: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  status: "trialing" | "active" | "past_due" | "suspended" | "cancelled";
  currentPeriodStart: number;
  currentPeriodEnd: number;
  nextPaymentDue?: number;
  trialEndsAt?: number;
  updatedAt: number;
};

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusClass(status: string) {
  switch (status) {
    case "paid":
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "trialing":
    case "sent":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "past_due":
    case "overdue":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "suspended":
    case "cancelled":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
  }
}

function daysUntil(timestamp?: number) {
  if (!timestamp) return null;
  return Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function BillingPage() {
  const { sessionToken, isLoading } = useAuth();

  const overview = usePlatformQuery(
    api.modules.platform.subscriptions.getBillingDashboardOverview,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as BillingDashboardOverview | undefined;

  const subscriptions = usePlatformQuery(
    api.modules.platform.subscriptions.getAllSubscriptions,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as SubscriptionRow[] | undefined;

  if (isLoading || overview === undefined || subscriptions === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const newestSubscriptions = [...subscriptions]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Track recurring revenue, watch billing risk, and move quickly between subscriptions and invoice operations."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Billing" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/platform/billing/subscriptions">Subscriptions</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/platform/billing/invoices">Invoices</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/platform/billing/reports">Reports</Link>
            </Button>
            <Button asChild>
              <Link href="/platform/billing/invoices/create">Create Invoice</Link>
            </Button>
          </div>
        }
      />

      <BillingAdminRail currentHref="/platform/billing" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="MRR"
          value={formatKes(overview.summary.mrrKes)}
          note={`ARR ${formatKes(overview.summary.arrKes)}`}
          icon={BadgeDollarSign}
        />
        <MetricCard
          title="Revenue (30d)"
          value={formatKes(overview.summary.revenueLast30DaysKes)}
          note={`${overview.summary.revenueGrowthPct}% vs prior 30 days`}
          icon={LineChart}
        />
        <MetricCard
          title="Subscriptions"
          value={String(overview.summary.activeSubscriptions)}
          note={`${overview.summary.trialingSubscriptions} trialing`}
          icon={CreditCard}
        />
        <MetricCard
          title="Overdue"
          value={String(overview.summary.overdueInvoiceCount)}
          note={formatKes(overview.summary.overdueAmountKes)}
          icon={FileWarning}
        />
        <MetricCard
          title="At Risk"
          value={String(overview.summary.atRiskCount)}
          note={`${overview.summary.churnRatePct}% churn rate`}
          icon={ShieldAlert}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue by plan</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/platform/billing/subscriptions">
                View subscriptions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {overview.revenueByPlan.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No active plan revenue yet"
                description="Plan revenue distribution will appear here once schools are placed onto subscription plans."
                className="py-10"
              />
            ) : (
              <div className="space-y-4">
                {overview.revenueByPlan.map((plan) => (
                  <div key={plan.planId} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{plan.planLabel}</p>
                        <p className="text-sm text-muted-foreground">{plan.tenantCount} tenant{plan.tenantCount === 1 ? "" : "s"}</p>
                      </div>
                      <p className="text-lg font-semibold">{formatKes(plan.monthlyKes)}</p>
                    </div>
                    <Progress
                      value={overview.summary.mrrKes > 0 ? (plan.monthlyKes / overview.summary.mrrKes) * 100 : 0}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Risk watchlist</CardTitle>
            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-700">
              {overview.summary.atRiskCount} flagged
            </Badge>
          </CardHeader>
          <CardContent>
            {overview.atRiskTenants.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="No high-risk subscriptions"
                description="At-risk tenants will show here when trials near expiry or payments fall behind."
                className="py-10"
              />
            ) : (
              <div className="space-y-4">
                {overview.atRiskTenants.map((tenant) => {
                  const daysLeft = daysUntil(tenant.trialEndsAt);
                  return (
                    <div key={tenant.tenantId} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{tenant.tenantName}</p>
                          <p className="text-sm text-muted-foreground">{tenant.planId}</p>
                        </div>
                        <Badge variant="outline" className={statusClass(tenant.status)}>
                          {tenant.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        {tenant.trialEndsAt ? <p>Trial ends {formatDate(tenant.trialEndsAt)}{daysLeft !== null ? ` (${daysLeft}d left)` : ""}</p> : null}
                        {tenant.nextPaymentDue ? <p>Next payment due {formatDate(tenant.nextPaymentDue)}</p> : null}
                      </div>
                      <div className="mt-4">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/platform/tenants/${tenant.tenantId}`}>Open tenant</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent invoice activity</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/platform/billing/invoices">
                Open invoices
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {overview.recentActivity.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No invoice activity yet"
                description="Once invoices are created and updated, the most recent billing activity will appear here."
                className="py-10"
              />
            ) : (
              <div className="space-y-4">
                {overview.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between gap-4 rounded-xl border p-4">
                    <div>
                      <p className="font-medium">{activity.tenantName}</p>
                      <p className="text-sm text-muted-foreground">
                        Due {formatDate(activity.dueDate)} · Updated {formatRelativeTime(activity.updatedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={statusClass(activity.status)}>
                        {activity.status}
                      </Badge>
                      <p className="mt-2 font-semibold">{formatKes(activity.totalAmountKes)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently updated subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {newestSubscriptions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No subscription updates yet"
                description="Subscription changes will appear here once billing activity starts."
                className="py-10"
              />
            ) : (
              <div className="space-y-4">
                {newestSubscriptions.map((subscription) => (
                  <div key={subscription.tenantId} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{subscription.tenantName}</p>
                        <p className="text-sm text-muted-foreground">{subscription.planId}</p>
                      </div>
                      <Badge variant="outline" className={statusClass(subscription.status)}>
                        {subscription.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      Updated {formatDateTime(subscription.updatedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="font-medium">Billing pressure snapshot</p>
              <p className="text-sm text-muted-foreground">
                {overview.summary.overdueInvoiceCount} overdue invoice{overview.summary.overdueInvoiceCount === 1 ? "" : "s"}, {overview.summary.atRiskCount} at-risk subscription{overview.summary.atRiskCount === 1 ? "" : "s"}, and {overview.summary.churnLast30Days} churn event{overview.summary.churnLast30Days === 1 ? "" : "s"} in the last 30 days.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/platform/billing/subscriptions">Review at-risk accounts</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof CreditCard;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-2">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
