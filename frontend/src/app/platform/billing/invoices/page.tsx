"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Plus, FileText, DollarSign, Clock, CheckCircle } from "lucide-react";
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
};

const PLAN_PRICES: Record<string, number> = {
  free: 0, starter: 49, growth: 129, premium: 249, enterprise: 499,
};

const PLAN_COLORS: Record<string, string> = {
  enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  growth:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  starter:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  premium:    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  free:       "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_COLORS: Record<string, string> = {
  active:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  trial:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  suspended:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled:  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function BillingInvoicesPage() {
  const { isLoading, sessionToken } = useAuth();
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const subscriptions = useQuery(
    api.platform.billing.queries.listSubscriptions,
    sessionToken ? { sessionToken } : "skip"
  );

  const subList = (subscriptions ?? []) as Subscription[];

  const filtered = useMemo(() => {
    return subList.filter((s) => {
      const matchPlan   = planFilter === "all" || s.plan === planFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchPlan && matchStatus;
    });
  }, [subList, planFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = subList.filter((s) => s.status === "active" || s.status === "trial");
    const mrr    = active.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);
    const outstanding = subList.filter((s) => s.status === "suspended").length;
    return {
      total: subList.length,
      active: active.length,
      mrr,
      outstanding,
    };
  }, [subList]);

  const columns: Column<Subscription>[] = [
    {
      key: "name",
      header: "Tenant",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.subdomain}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      cell: (row) => <span className="text-sm">{row.email}</span>,
    },
    {
      key: "plan",
      header: "Plan",
      sortable: true,
      cell: (row) => (
        <Badge className={`${PLAN_COLORS[row.plan] ?? PLAN_COLORS.free} border-0 capitalize`}>
          {row.plan}
        </Badge>
      ),
    },
    {
      key: "priceCents",
      header: "Monthly",
      sortable: true,
      cell: (row) => (
        <span className="font-medium">
          ${PLAN_PRICES[row.plan] ?? 0}/mo
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge className={`${STATUS_COLORS[row.status] ?? STATUS_COLORS.cancelled} border-0 capitalize`}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Since",
      sortable: true,
      cell: (row) => <span className="text-sm">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
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

  if (isLoading || subscriptions === undefined) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing Invoices"
        description="View tenant subscriptions and generate invoices"
        actions={
          <Link href="/platform/billing/invoices/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        }
        breadcrumbs={[
          { label: "Billing", href: "/platform/billing" },
          { label: "Invoices" },
        ]}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Tenants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
              <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats.mrr.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.outstanding}</p>
              <p className="text-sm text-muted-foreground">Suspended</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <p className="self-center text-sm text-muted-foreground sm:ml-auto">
          {filtered.length} of {subList.length} tenants
        </p>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search tenants…"
        emptyMessage="No subscriptions found matching your filters."
      />
    </div>
  );
}
