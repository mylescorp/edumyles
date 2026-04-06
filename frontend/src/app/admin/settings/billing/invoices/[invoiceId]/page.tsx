"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Receipt, Calendar, CreditCard, FileText } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/formatters";

/* ---- helpers ---- */
function invoiceStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid": return "default";
    case "sent": return "secondary";
    case "draft": return "outline";
    case "void":
    case "refunded": return "destructive";
    default: return "outline";
  }
}

function invoiceStatusClass(status: string) {
  switch (status) {
    case "paid": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "sent": return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "draft": return "border-slate-500/20 bg-slate-500/10 text-slate-700";
    default: return "border-rose-500/20 bg-rose-500/10 text-rose-700";
  }
}

const providerLabels: Record<string, string> = {
  mpesa: "M-Pesa",
  airtel: "Airtel Money",
  stripe: "Card (Stripe)",
  bank_transfer: "Bank Transfer",
};

function printInvoice(invoice: any, schoolName: string, format: (n: number) => string) {
  const lineItemsHtml = (invoice.lineItems ?? [])
    .map(
      (item: any) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.description}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity ?? 1}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${format(item.amountKes ?? 0)}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${String(invoice._id).slice(-8).toUpperCase()}</title>
  <style>
    body { font-family: sans-serif; max-width: 680px; margin: 40px auto; padding: 24px; color: #111; }
    .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .school-name { font-size: 22px; font-weight: 700; color: #0F4C2A; }
    .invoice-label { font-size: 28px; font-weight: 800; color: #0F4C2A; text-align: right; }
    .invoice-id { font-size: 13px; color: #666; text-align: right; }
    .section { margin-bottom: 24px; }
    .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .value { font-size: 14px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { text-align: left; font-size: 12px; color: #888; text-transform: uppercase; padding: 8px 0; border-bottom: 2px solid #0F4C2A; }
    th:last-child { text-align: right; }
    th:nth-child(2) { text-align: center; }
    .total-row { font-weight: 700; font-size: 16px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; background: #d1fae5; color: #065f46; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="school-name">${schoolName}</div>
      <div style="font-size:12px;color:#888;margin-top:4px;">EduMyles School Management Platform</div>
    </div>
    <div>
      <div class="invoice-label">INVOICE</div>
      <div class="invoice-id">#${String(invoice._id).slice(-8).toUpperCase()}</div>
      <div class="invoice-id">${invoice.status?.toUpperCase() ?? ""}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
    <div class="section">
      <div class="label">Issue Date</div>
      <div class="value">${formatDate(invoice.createdAt)}</div>
    </div>
    <div class="section">
      <div class="label">Due Date</div>
      <div class="value">${invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</div>
    </div>
    ${invoice.paidAt ? `<div class="section"><div class="label">Paid On</div><div class="value">${formatDate(invoice.paidAt)}</div></div>` : ""}
    ${invoice.paymentProvider ? `<div class="section"><div class="label">Payment Method</div><div class="value">${providerLabels[invoice.paymentProvider] ?? invoice.paymentProvider}</div></div>` : ""}
    ${invoice.paymentReference ? `<div class="section"><div class="label">Reference</div><div class="value" style="font-family:monospace;font-size:13px;">${invoice.paymentReference}</div></div>` : ""}
  </div>

  <table>
    <thead><tr><th>Description</th><th>Qty</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>${lineItemsHtml}</tbody>
  </table>

  <div style="text-align:right;margin-top:8px;">
    ${invoice.vatAmountKes ? `<div style="margin-bottom:4px;font-size:13px;">VAT: ${format(invoice.vatAmountKes)}</div>` : ""}
    <div class="total-row">Total: ${format(invoice.totalAmountKes ?? invoice.amountKes ?? 0)}</div>
  </div>

  ${invoice.status === "paid" ? `<div style="text-align:center;margin-top:40px;"><span class="status-badge">PAID</span></div>` : ""}
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.print();
  }
}

/* ---- page component ---- */
export default function SubscriptionInvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { isLoading: authLoading } = useAuth();
  const { format } = useCurrency();

  // Fetch all tenant invoices and filter by ID
  const invoices = useQuery(api.modules.platform.subscriptions.getSubscriptionInvoices, {}) as any[] | undefined;

  if (authLoading || invoices === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const invoice = invoices?.find((inv: any) => String(inv._id) === invoiceId) ?? null;

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/settings/billing"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Billing
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Invoice Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This invoice does not exist or does not belong to your account.
          </p>
          <Button asChild>
            <Link href="/admin/settings/billing">Back to Billing</Link>
          </Button>
        </div>
      </div>
    );
  }

  const invoiceRef = String(invoice._id).slice(-8).toUpperCase();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/settings/billing"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Billing
      </Link>

      <PageHeader
        title={`Invoice #${invoiceRef}`}
        description={`Issued ${formatDate(invoice.createdAt)}${invoice.dueDate ? ` · Due ${formatDate(invoice.dueDate)}` : ""}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Billing", href: "/admin/settings/billing" },
          { label: `Invoice #${invoiceRef}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant={invoiceStatusVariant(invoice.status)}
              className={`${invoiceStatusClass(invoice.status)} text-sm px-3 py-1`}
            >
              {invoice.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => printInvoice(invoice, "Your School", format)}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print / Download
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-[#0F4C2A]/10 p-3">
              <FileText className="h-5 w-5 text-[#0F4C2A]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{format(invoice.totalAmountKes ?? invoice.amountKes ?? 0)}</p>
              <p className="text-sm text-muted-foreground">Invoice Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Calendar className="h-5 w-5 text-[#1565C0]" />
            </div>
            <div>
              <p className="font-semibold text-sm">{formatDate(invoice.createdAt)}</p>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              {invoice.dueDate && (
                <p className="text-xs text-muted-foreground mt-0.5">Due: {formatDate(invoice.dueDate)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-amber-100 p-3">
              <CreditCard className="h-5 w-5 text-[#E8A020]" />
            </div>
            <div>
              <p className="font-semibold text-sm capitalize">
                {invoice.paymentProvider ? (providerLabels[invoice.paymentProvider] ?? invoice.paymentProvider) : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              {invoice.paidAt && (
                <p className="text-xs text-muted-foreground mt-0.5">Paid: {formatDate(invoice.paidAt)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {(!invoice.lineItems || invoice.lineItems.length === 0) ? (
            <p className="text-sm text-muted-foreground">No line items recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lineItems.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-center">{item.quantity ?? 1}</TableCell>
                    <TableCell className="text-right font-medium">{format(item.amountKes ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Separator className="my-4" />

          <div className="flex flex-col items-end gap-1 text-sm">
            {invoice.vatAmountKes ? (
              <div className="flex gap-8">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{format(invoice.amountKes ?? 0)}</span>
              </div>
            ) : null}
            {invoice.vatAmountKes ? (
              <div className="flex gap-8">
                <span className="text-muted-foreground">VAT</span>
                <span className="font-medium">{format(invoice.vatAmountKes)}</span>
              </div>
            ) : null}
            <div className="flex gap-8 text-base font-bold">
              <span>Total</span>
              <span>{format(invoice.totalAmountKes ?? invoice.amountKes ?? 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-y-3 gap-x-6 sm:grid-cols-2 text-sm">
          {[
            { label: "Invoice ID", value: `#${invoiceRef}` },
            { label: "Status", value: invoice.status },
            { label: "Subscription ID", value: invoice.subscriptionId ? `#${String(invoice.subscriptionId).slice(-8).toUpperCase()}` : null },
            { label: "Currency", value: invoice.displayCurrency ?? "KES" },
            { label: "Payment Reference", value: invoice.paymentReference ?? null },
            { label: "Issue Date", value: formatDate(invoice.createdAt) },
            { label: "Due Date", value: invoice.dueDate ? formatDate(invoice.dueDate) : null },
            { label: "Paid On", value: invoice.paidAt ? formatDateTime(invoice.paidAt) : null },
          ]
            .filter((r) => r.value != null)
            .map((row) => (
              <div key={row.label} className="flex justify-between border-b pb-2 last:border-0">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium capitalize">{row.value}</span>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
