"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { formatDate } from "@/lib/formatters";
import { BarChart3, FileWarning, Receipt, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type BillingReportsOverview = {
  summary: {
    totalBilledKes: number;
    totalCollectedKes: number;
    totalOutstandingKes: number;
    totalVatKes: number;
    overdueCount: number;
    overdueKes: number;
    activeSubscriptions: number;
  };
  monthly: Array<{
    monthLabel: string;
    paidKes: number;
    sentKes: number;
    vatKes: number;
    invoiceCount: number;
  }>;
  topTenants: Array<{
    tenantId: string;
    tenantName: string;
    billedKes: number;
    paidKes: number;
    invoiceCount: number;
  }>;
  recentInvoices: Array<{
    id: string;
    tenantId: string;
    tenantName: string;
    totalAmountKes: number;
    vatAmountKes: number;
    status: string;
    dueDate: number;
    createdAt: number;
  }>;
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
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "sent":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "void":
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
    case "refunded":
      return "border-violet-500/20 bg-violet-500/10 text-violet-700";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  }
}

export default function BillingReportsPage() {
  const { sessionToken, isLoading } = useAuth();
  const overview = usePlatformQuery(
    api.modules.platform.subscriptions.getBillingReportsOverview,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as BillingReportsOverview | undefined;

  if (isLoading || overview === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing reports"
        description="Review invoice throughput, VAT exposure, and top-paying schools from the subscription invoice ledger."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Billing", href: "/platform/billing" },
          { label: "Reports" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/platform/billing/invoices">Open invoices</Link>
            </Button>
            <Button asChild>
              <Link href="/platform/billing/invoices/create">Create invoice</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Receipt} title="Total billed" value={formatKes(overview.summary.totalBilledKes)} />
        <MetricCard icon={TrendingUp} title="Collected" value={formatKes(overview.summary.totalCollectedKes)} />
        <MetricCard icon={FileWarning} title="Outstanding" value={formatKes(overview.summary.totalOutstandingKes)} />
        <MetricCard icon={BarChart3} title="VAT tracked" value={formatKes(overview.summary.totalVatKes)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Collections trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            {overview.monthly.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No invoice data yet"
                description="Monthly billing trends will appear here once invoices start flowing through the new ledger."
                className="h-full"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="monthLabel" />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === "number" ? formatKes(value) : String(value ?? "")
                    }
                  />
                  <Bar dataKey="paidKes" name="Collected" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="sentKes" name="Outstanding" fill="#0369a1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exposure snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SnapshotRow label="Overdue invoice count" value={String(overview.summary.overdueCount)} />
            <SnapshotRow label="Overdue amount" value={formatKes(overview.summary.overdueKes)} />
            <SnapshotRow label="Active subscriptions" value={String(overview.summary.activeSubscriptions)} />
            <SnapshotRow
              label="Collection rate"
              value={
                overview.summary.totalBilledKes > 0
                  ? `${Math.round((overview.summary.totalCollectedKes / overview.summary.totalBilledKes) * 100)}%`
                  : "0%"
              }
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Top billed tenants</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.topTenants.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No tenant billing records"
                description="Top billed schools will appear here once invoices have been created."
                className="py-10"
              />
            ) : (
              <div className="space-y-4">
                {overview.topTenants.map((tenant) => (
                  <div key={tenant.tenantId} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                    <div>
                      <p className="font-medium">{tenant.tenantName}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenant.invoiceCount} invoice{tenant.invoiceCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatKes(tenant.paidKes)}</p>
                      <p className="text-sm text-muted-foreground">of {formatKes(tenant.billedKes)} billed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent invoice log</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.recentInvoices.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No recent invoices"
                description="The latest subscription invoices will show up here."
                className="py-10"
              />
            ) : (
              <div className="space-y-4">
                {overview.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{invoice.tenantName}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDate(invoice.createdAt)} · Due {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusClass(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">VAT {formatKes(invoice.vatAmountKes)}</span>
                      <span className="font-semibold">{formatKes(invoice.totalAmountKes)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Receipt;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
