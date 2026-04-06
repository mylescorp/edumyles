"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDate, formatDateTime } from "@/lib/formatters";
import {
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Plus,
  RotateCcw,
  Send,
} from "lucide-react";
import { toast } from "sonner";

type InvoiceRow = {
  _id: string;
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planLabel: string;
  amountKes: number;
  vatAmountKes: number;
  totalAmountKes: number;
  displayCurrency: string;
  displayAmount: number;
  exchangeRate: number;
  status: "draft" | "sent" | "paid" | "overdue" | "void" | "refunded";
  rawStatus: "draft" | "sent" | "paid" | "void" | "refunded";
  dueDate: number;
  createdAt: number;
  updatedAt: number;
  paidAt?: number;
  paymentProvider?: string;
  paymentReference?: string;
};

type SubscriptionRow = {
  tenantId: string;
  tenantName: string;
};

type StatusFilter = "all" | "draft" | "sent" | "paid" | "overdue" | "void" | "refunded";

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusClass(status: InvoiceRow["status"]) {
  switch (status) {
    case "paid":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "sent":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "overdue":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "refunded":
      return "border-violet-500/20 bg-violet-500/10 text-violet-700";
    case "void":
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
    default:
      return "border-stone-500/20 bg-stone-500/10 text-stone-700";
  }
}

export default function BillingInvoicesPage() {
  const { isLoading, sessionToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const invoices = usePlatformQuery(
    api.modules.platform.subscriptions.getPlatformInvoices,
    sessionToken
      ? {
          sessionToken,
          status:
            statusFilter === "all" || statusFilter === "overdue"
              ? undefined
              : statusFilter,
          tenantId: tenantFilter === "all" ? undefined : tenantFilter,
        }
      : "skip",
    !!sessionToken
  ) as InvoiceRow[] | undefined;

  const subscriptions = usePlatformQuery(
    api.modules.platform.subscriptions.getAllSubscriptions,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as SubscriptionRow[] | undefined;

  const updateInvoiceStatus = useMutation(
    api.modules.platform.subscriptions.updateSubscriptionInvoiceStatus
  );

  const invoiceRows = useMemo(
    () =>
      (invoices ?? []).filter((invoice) =>
        statusFilter === "overdue" ? invoice.status === "overdue" : true
      ),
    [invoices, statusFilter]
  );

  const tenantOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const subscription of subscriptions ?? []) {
      if (!seen.has(subscription.tenantId)) {
        seen.set(subscription.tenantId, subscription.tenantName);
      }
    }
    return Array.from(seen.entries()).map(([tenantId, tenantName]) => ({ tenantId, tenantName }));
  }, [subscriptions]);

  const stats = useMemo(() => {
    const paid = invoiceRows.filter((invoice) => invoice.status === "paid");
    const overdue = invoiceRows.filter((invoice) => invoice.status === "overdue");
    const sent = invoiceRows.filter((invoice) => invoice.status === "sent");

    return {
      total: invoiceRows.length,
      paidKes: paid.reduce((sum, invoice) => sum + invoice.totalAmountKes, 0),
      overdueKes: overdue.reduce((sum, invoice) => sum + invoice.totalAmountKes, 0),
      sentCount: sent.length,
    };
  }, [invoiceRows]);

  const handleStatusUpdate = async (
    invoice: InvoiceRow,
    status: "sent" | "paid" | "refunded" | "void"
  ) => {
    if (!sessionToken) return;
    setActionLoadingId(invoice.id);
    try {
      await updateInvoiceStatus({
        sessionToken,
        invoiceId: invoice._id as never,
        status,
        paymentProvider: status === "paid" ? invoice.paymentProvider ?? "manual" : undefined,
        paymentReference: invoice.paymentReference,
      });
      toast.success(`Invoice ${invoice.invoiceNumber} updated to ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update invoice status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading || invoices === undefined || subscriptions === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Invoices"
        description="Track invoice status, collection performance, and manual interventions from the subscription ledger."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Billing", href: "/platform/billing" },
          { label: "Invoices" },
        ]}
        actions={
          <Button asChild>
            <Link href="/platform/billing/invoices/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FileText} title="Invoices" value={String(stats.total)} note="Current filtered view" />
        <MetricCard icon={DollarSign} title="Collected" value={formatKes(stats.paidKes)} note="Invoices marked paid" />
        <MetricCard icon={Clock} title="Overdue" value={formatKes(stats.overdueKes)} note="Outstanding exposure" />
        <MetricCard icon={Send} title="Awaiting payment" value={String(stats.sentCount)} note="Invoices still open" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="void">Void</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Tenant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tenants</SelectItem>
            {tenantOptions.map((tenant) => (
              <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                {tenant.tenantName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {invoiceRows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="No invoices match these filters"
              description="Try a different status or tenant filter, or create the first invoice for a school."
              action={
                <Button asChild>
                  <Link href="/platform/billing/invoices/create">Create invoice</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoiceRows.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
                      <Badge variant="outline" className={statusClass(invoice.status)}>
                        {invoice.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{invoice.tenantName}</p>
                      <p>
                        {invoice.planLabel} plan · Created {formatDateTime(invoice.createdAt)} · Due{" "}
                        {formatDate(invoice.dueDate)}
                      </p>
                      {invoice.paymentReference ? (
                        <p>Reference: {invoice.paymentReference}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[360px]">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Subtotal</p>
                      <p className="font-semibold">{formatKes(invoice.amountKes)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">VAT</p>
                      <p className="font-semibold">{formatKes(invoice.vatAmountKes)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                      <p className="font-semibold">{formatKes(invoice.totalAmountKes)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {invoice.rawStatus === "draft" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === invoice.id}
                      onClick={() => handleStatusUpdate(invoice, "sent")}
                    >
                      <Send className="mr-2 h-3.5 w-3.5" />
                      Mark Sent
                    </Button>
                  ) : null}

                  {(invoice.status === "sent" || invoice.status === "overdue") && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === invoice.id}
                      onClick={() => handleStatusUpdate(invoice, "paid")}
                    >
                      <CheckCircle className="mr-2 h-3.5 w-3.5" />
                      Mark Paid
                    </Button>
                  )}

                  {invoice.rawStatus !== "void" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === invoice.id}
                      onClick={() => handleStatusUpdate(invoice, "void")}
                    >
                      Void
                    </Button>
                  ) : null}

                  {invoice.rawStatus === "paid" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === invoice.id}
                      onClick={() => handleStatusUpdate(invoice, "refunded")}
                    >
                      <RotateCcw className="mr-2 h-3.5 w-3.5" />
                      Refund
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  note,
}: {
  icon: typeof FileText;
  title: string;
  value: string;
  note: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
