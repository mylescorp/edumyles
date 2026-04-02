"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";

type Subscription = {
  _id: string;
  tenantId: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  email: string;
  createdAt: number;
  updatedAt: number;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  standard: "Growth",
  pro: "Pro",
  enterprise: "Enterprise",
};

function formatKesFromCents(amountCents: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function PlanBadge({ plan }: { plan: string }) {
  const variant =
    plan === "enterprise"
      ? "bg-purple-500/10 text-purple-700 border-purple-200"
      : plan === "growth" || plan === "standard"
        ? "bg-blue-500/10 text-blue-700 border-blue-200"
        : plan === "pro"
          ? "bg-amber-500/10 text-amber-700 border-amber-200"
          : "bg-green-500/10 text-green-700 border-green-200";
  return (
    <Badge variant="outline" className={variant}>
      {PLAN_LABELS[plan] ?? plan}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "active"
      ? "bg-green-500/10 text-green-700"
      : status === "trial"
        ? "bg-blue-500/10 text-blue-700"
        : status === "suspended"
          ? "bg-red-500/10 text-red-700"
          : "bg-gray-500/10 text-gray-700";
  return (
    <Badge variant="outline" className={variant}>
      {status}
    </Badge>
  );
}

export default function BillingPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const isMasterAdmin = hasRole("master_admin");
  const isPlatformAdmin = hasRole("master_admin", "super_admin");

  const [planFilter, setPlanFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [changeTierDialog, setChangeTierDialog] = useState<{ tenant: Subscription; newPlan: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const subscriptions = usePlatformQuery(
    api.platform.billing.queries.listSubscriptions,
    {
      sessionToken: sessionToken || "",
      plan: planFilter,
      status: statusFilter,
    },
    isPlatformAdmin && !!sessionToken
  );

  const billingOverview = usePlatformQuery(
    api.platform.billing.queries.getBillingOverview,
    { sessionToken: sessionToken || "" },
    isPlatformAdmin && !!sessionToken
  );

  const subscriptionMetrics = usePlatformQuery(
    api.platform.billing.queries.getSubscriptionMetrics,
    { sessionToken: sessionToken || "" },
    isPlatformAdmin && !!sessionToken
  );

  const revenueBreakdown = usePlatformQuery(
    api.platform.billing.queries.getRevenueBreakdown,
    { sessionToken: sessionToken || "" },
    isPlatformAdmin && !!sessionToken
  );

  const updateTier = useMutation(api.platform.billing.mutations.updateTenantTier);

  const subscriptionList = (subscriptions as Subscription[]) ?? [];
  const topRevenuePlan = useMemo(() => {
    const rows = revenueBreakdown?.revenueByPlan ?? [];
    return [...rows].sort((a, b) => b.mrrCents - a.mrrCents)[0] ?? null;
  }, [revenueBreakdown]);

  if (isLoading || (isPlatformAdmin && (!subscriptions || !billingOverview || !subscriptionMetrics))) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleChangeTier = async () => {
    if (!changeTierDialog || !sessionToken) return;
    setActionLoading(true);
    try {
      await updateTier({
        sessionToken,
        tenantId: changeTierDialog.tenant.tenantId,
        plan: changeTierDialog.newPlan as "free" | "starter" | "growth" | "enterprise",
      });
      toast.success("Subscription plan updated.");
      setChangeTierDialog(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update plan.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Subscription>[] = [
    {
      key: "name",
      header: "School",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.subdomain}.edumyles.com</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      sortable: true,
      cell: (row) => <PlanBadge plan={row.plan} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "email",
      header: "Contact",
      cell: (row) => <span className="text-sm">{row.email}</span>,
    },
    {
      key: "createdAt",
      header: "Since",
      sortable: true,
      cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "billing",
      header: "Billing",
      cell: (row) => (
        <Link href={`/platform/billing/invoices/create?tenantId=${row.tenantId}`}>
          <Button size="sm" variant="outline" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Invoice
          </Button>
        </Link>
      ),
    },
  ];

  if (isMasterAdmin) {
    columns.push({
      key: "actions",
      header: "Change Plan",
      className: "w-48",
      cell: (row) => (
        <Select
          value={row.plan === "standard" ? "growth" : row.plan}
          onValueChange={(value) => {
            const currentPlan = row.plan === "standard" ? "growth" : row.plan;
            if (value !== currentPlan) {
              setChangeTierDialog({ tenant: row, newPlan: value });
            }
          }}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscriptions"
        description="Track revenue, invoice risk, and tenant subscription health."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Billing" },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href="/platform/billing/invoices">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                View Invoices
              </Button>
            </Link>
            <Link href="/platform/billing/invoices/create">
              <Button className="gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Create Invoice
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatKesFromCents(billingOverview!.mrr)}
            </div>
            <p className="text-xs text-muted-foreground">
              ARR {formatKesFromCents(billingOverview!.arr)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <CreditCard className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingOverview!.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptionMetrics!.trial} in trial, {subscriptionMetrics!.suspended} suspended
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Invoices</CardTitle>
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingOverview!.overdueInvoiceCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatKesFromCents(billingOverview!.overdueAmount)} outstanding
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Growth</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billingOverview!.revenueGrowth}%
            </div>
            <p className="text-xs text-muted-foreground">
              This month {formatKesFromCents(billingOverview!.thisMonthRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(subscriptionMetrics!.planDistribution as Record<string, number>).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlanBadge plan={plan} />
                </div>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Growth Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total tenants</span>
              <span className="font-medium">{subscriptionMetrics!.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recent signups</span>
              <span className="font-medium">{subscriptionMetrics!.recentSignups}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Churn rate</span>
              <span className="font-medium">{subscriptionMetrics!.churnRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available credits</span>
              <span className="font-medium">{formatKesFromCents(billingOverview!.availableCredits)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Revenue Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topRevenuePlan ? (
              <>
                <div className="flex items-center gap-2">
                  <PlanBadge plan={topRevenuePlan.plan} />
                  <span className="text-sm text-muted-foreground">
                    {topRevenuePlan.tenantCount} tenants
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {formatKesFromCents(topRevenuePlan.mrrCents)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Estimated recurring monthly revenue for this tier
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No revenue data available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={planFilter ?? "all"}
          onValueChange={(value) => setPlanFilter(value === "all" ? undefined : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="standard">Growth</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter ?? "all"}
          onValueChange={(value) => setStatusFilter(value === "all" ? undefined : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {subscriptionList.length} tenant{subscriptionList.length === 1 ? "" : "s"}
        </div>
      </div>

      <DataTable
        data={subscriptionList}
        columns={columns}
        searchable
        searchPlaceholder="Search subscriptions..."
        searchKey={(row) => `${row.name} ${row.subdomain} ${row.email} ${row.plan} ${row.status}`}
        emptyTitle="No subscriptions"
        emptyDescription="No subscriptions found matching the current filters."
      />

      <ConfirmDialog
        open={!!changeTierDialog}
        onOpenChange={(open) => !open && setChangeTierDialog(null)}
        title="Change Subscription Plan"
        description={`Change "${changeTierDialog?.tenant.name}" from ${PLAN_LABELS[changeTierDialog?.tenant.plan ?? ""] ?? changeTierDialog?.tenant.plan} to ${PLAN_LABELS[changeTierDialog?.newPlan ?? ""] ?? changeTierDialog?.newPlan}?`}
        confirmLabel="Update Plan"
        onConfirm={handleChangeTier}
        isLoading={actionLoading}
      />
    </div>
  );
}
