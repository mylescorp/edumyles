"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FileText, DollarSign, Clock, CheckCircle, Send, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/formatters";

type PlatformInvoice = {
  _id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  plan: string;
  amountCents: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void" | "refunded";
  dueDate: number;
  createdAt: number;
  paidAt?: number;
  paymentMethod?: string;
};

const STATUS_COLORS: Record<PlatformInvoice["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  void: "bg-gray-100 text-gray-700",
  refunded: "bg-amber-100 text-amber-700",
};

function formatKes(amountCents: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export default function BillingInvoicesPage() {
  const { isLoading, sessionToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const invoices = usePlatformQuery(
    api.platform.billing.queries.listInvoices,
    {
      sessionToken: sessionToken || "",
      status: statusFilter === "all" ? undefined : (statusFilter as PlatformInvoice["status"]),
      tenantId: tenantFilter === "all" ? undefined : tenantFilter,
    },
    !!sessionToken
  );

  const subscriptions = usePlatformQuery(
    api.platform.billing.queries.listSubscriptions,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const updateInvoiceStatus = useMutation(api.platform.billing.mutations.updateInvoiceStatus);

  const invoiceList = (invoices ?? []) as PlatformInvoice[];
  const tenantOptions = subscriptions ?? [];

  const stats = useMemo(() => {
    const paid = invoiceList.filter((invoice) => invoice.status === "paid");
    const overdue = invoiceList.filter((invoice) => invoice.status === "overdue");
    const sent = invoiceList.filter((invoice) => invoice.status === "sent");
    return {
      total: invoiceList.length,
      paidRevenue: paid.reduce((sum, invoice) => sum + invoice.amountCents, 0),
      overdueAmount: overdue.reduce((sum, invoice) => sum + invoice.amountCents, 0),
      sentCount: sent.length,
    };
  }, [invoiceList]);

  const handleStatusUpdate = async (
    invoiceId: string,
    status: PlatformInvoice["status"],
    paymentMethod?: string
  ) => {
    if (!sessionToken) return;
    setActionLoadingId(invoiceId);
    try {
      await updateInvoiceStatus({
        sessionToken,
        invoiceId,
        status,
        paymentMethod,
      });
      toast.success(`Invoice marked as ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update invoice status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns: Column<PlatformInvoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.invoiceNumber}</p>
          <p className="text-xs text-muted-foreground">{row.tenantName}</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      sortable: true,
      cell: (row) => <span className="capitalize">{row.plan.replace("standard", "growth")}</span>,
    },
    {
      key: "amountCents",
      header: "Amount",
      sortable: true,
      cell: (row) => <span className="font-medium">{formatKes(row.amountCents)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => <Badge className={STATUS_COLORS[row.status]}>{row.status}</Badge>,
    },
    {
      key: "dueDate",
      header: "Due",
      sortable: true,
      cell: (row) => <span className="text-sm">{formatDate(row.dueDate)}</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          {row.status === "draft" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate(row._id, "sent")}
              disabled={actionLoadingId === row._id}
            >
              <Send className="mr-1 h-3.5 w-3.5" />
              Send
            </Button>
          )}
          {(row.status === "sent" || row.status === "overdue") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate(row._id, "paid", "manual")}
              disabled={actionLoadingId === row._id}
            >
              <CheckCircle className="mr-1 h-3.5 w-3.5" />
              Mark Paid
            </Button>
          )}
          {row.status === "paid" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate(row._id, "refunded")}
              disabled={actionLoadingId === row._id}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Refund
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading || invoices === undefined || subscriptions === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Invoices"
        description="Track invoice status, overdue exposure, and payment collection."
        actions={
          <Link href="/platform/billing/invoices/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        }
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Billing", href: "/platform/billing" },
          { label: "Invoices" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatKes(stats.paidRevenue)}</p>
              <p className="text-sm text-muted-foreground">Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatKes(stats.overdueAmount)}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Send className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sentCount}</p>
              <p className="text-sm text-muted-foreground">Awaiting Payment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="void">Void</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Tenant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenants</SelectItem>
            {tenantOptions.map((tenant: any) => (
              <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={invoiceList}
        columns={columns}
        searchable
        searchPlaceholder="Search invoices..."
        searchKey={(row) => `${row.invoiceNumber} ${row.tenantName} ${row.tenantId} ${row.status}`}
        emptyTitle="No invoices"
        emptyDescription="No platform invoices found for the current filters."
      />
    </div>
  );
}
