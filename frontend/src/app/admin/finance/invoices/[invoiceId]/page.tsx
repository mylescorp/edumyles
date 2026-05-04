"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Printer, Receipt, Calendar, DollarSign, FileWarning } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  paid: "default",
  partially_paid: "secondary",
  cancelled: "destructive",
};

const methodLabels: Record<string, string> = {
  mpesa: "M-Pesa",
  airtel_money: "Airtel Money",
  stripe: "Card (Stripe)",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  cheque: "Cheque",
};

function printReceipt(receipt: Record<string, any>) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Receipt ${receipt.receiptNumber}</title>
  <style>
    body { font-family: sans-serif; max-width: 480px; margin: 40px auto; padding: 24px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
    .bold { font-weight: 600; }
    .total { font-size: 18px; font-weight: 700; margin-top: 12px; }
    .stamp { text-align: center; margin-top: 32px; color: #16a34a; font-size: 22px; font-weight: 800; border: 3px solid #16a34a; padding: 8px 24px; display: inline-block; transform: rotate(-5deg); }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${receipt.tenantInfo?.name ?? "School"}</h1>
  <p class="sub">${receipt.tenantInfo?.address ?? ""} · ${receipt.tenantInfo?.phone ?? ""}</p>
  <div class="row"><span>Receipt No.</span><span class="bold">${receipt.receiptNumber}</span></div>
  <div class="row"><span>Student</span><span class="bold">${receipt.studentName}</span></div>
  <div class="row"><span>Admission No.</span><span>${receipt.admissionNumber ?? "—"}</span></div>
  <div class="row"><span>Invoice</span><span>${receipt.invoiceNumber ?? "—"}</span></div>
  <div class="row"><span>Payment Method</span><span>${methodLabels[receipt.method] ?? receipt.method}</span></div>
  <div class="row"><span>Reference</span><span>${receipt.reference ?? "—"}</span></div>
  <div class="row"><span>Date</span><span>${receipt.processedAt ? new Date(receipt.processedAt).toLocaleString() : "—"}</span></div>
  <hr style="margin: 16px 0"/>
  ${(receipt.items ?? []).map((item: any) => `<div class="row"><span>${item.description}</span><span>${formatCurrency(item.amount ?? 0)}</span></div>`).join("")}
  <div class="row total"><span>TOTAL PAID</span><span>${formatCurrency(receipt.amount ?? receipt.total ?? 0)}</span></div>
  <div style="text-align:center; margin-top:32px">
    <span class="stamp">PAID</span>
  </div>
</body>
</html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { isLoading, sessionToken } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [generatingNotice, setGeneratingNotice] = useState(false);

  const invoice = useQuery(
    api.modules.finance.queries.getInvoice,
    sessionToken && invoiceId ? { invoiceId: invoiceId as Id<"invoices">, sessionToken } : "skip"
  ) as any;

  const paymentStatus = useQuery(
    api.modules.finance.queries.getPaymentStatusForInvoice,
    sessionToken && invoiceId ? { invoiceId: invoiceId as Id<"invoices">, sessionToken } : "skip"
  ) as any;

  const generateReceipt = useMutation(api.modules.finance.mutations.generateReceipt);
  const generateDemandNotice = useMutation(api.modules.finance.mutations.generateDemandNotice);

  if (isLoading || invoice === undefined || paymentStatus === undefined) return <LoadingSkeleton variant="page" />;

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Link href="/admin/finance/invoices">
          <Button variant="outline" className="mt-4">Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  const payments: any[] = paymentStatus?.payments ?? [];
  const completedPayments = payments.filter((p) => p.status === "completed");

  const handleDownloadReceipt = async (paymentId: string) => {
    setDownloadingId(paymentId);
    try {
      const receipt = await generateReceipt({ paymentId: paymentId as Id<"payments">, format: "html" });
      printReceipt(receipt as Record<string, any>);
    } catch (err) {
      toast({ title: "Failed to generate receipt", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleGenerateDemandNotice = async () => {
    setGeneratingNotice(true);
    try {
      const result = await generateDemandNotice({ studentIds: [invoice.studentId] }) as any;
      const notice = result?.notices?.[0];
      if (!notice?.pdfUrl) {
        throw new Error("No outstanding balance found for this student.");
      }
      window.open(notice.pdfUrl, "_blank", "noopener,noreferrer");
      toast({
        title: "Demand notice generated",
        description: "The notice opened in a new tab for printing or saving.",
      });
    } catch (err) {
      toast({
        title: "Could not generate demand notice",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingNotice(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/finance/invoices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <PageHeader
          title={`Invoice · ${invoice._id.slice(-6).toUpperCase()}`}
          description={`Issued ${formatDate(invoice.issuedAt)}${invoice.dueDate ? ` · Due ${formatDate(invoice.dueDate)}` : ""}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {(paymentStatus?.balance ?? 0) > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDemandNotice}
                  disabled={generatingNotice}
                >
                  <FileWarning className="mr-2 h-4 w-4" />
                  {generatingNotice ? "Generating..." : "Demand Notice"}
                </Button>
              )}
              <Badge variant={statusColors[invoice.status] ?? "outline"} className="text-sm px-3 py-1">
                {invoice.status?.replace("_", " ")}
              </Badge>
            </div>
          }
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3"><DollarSign className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(invoice.amount)}</p>
              <p className="text-sm text-muted-foreground">Invoice total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3"><Receipt className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(paymentStatus?.amountPaid ?? 0)}</p>
              <p className="text-sm text-muted-foreground">Amount paid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-3"><Calendar className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(paymentStatus?.balance ?? invoice.amount)}</p>
              <p className="text-sm text-muted-foreground">Outstanding balance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded for this invoice yet.</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Method</th>
                    <th className="text-left p-3 font-medium">Reference</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                    <th className="text-right p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment: any) => (
                    <tr key={payment._id} className="border-t">
                      <td className="p-3">{payment.processedAt ? formatDate(payment.processedAt) : formatDate(payment.createdAt)}</td>
                      <td className="p-3">{methodLabels[payment.method] ?? payment.method}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{payment.reference ?? "—"}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="p-3 text-right">
                        <Badge variant={payment.status === "completed" ? "default" : payment.status === "failed" ? "destructive" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {payment.status === "completed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadReceipt(payment._id)}
                            disabled={downloadingId === payment._id}
                            title="Download receipt"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            {downloadingId === payment._id ? "..." : "Receipt"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30">
                  <tr>
                    <td colSpan={3} className="p-3 font-medium text-sm">Total paid</td>
                    <td className="p-3 text-right font-bold">{formatCurrency(paymentStatus?.amountPaid ?? 0)}</td>
                    <td colSpan={2} />
                  </tr>
                  {(paymentStatus?.balance ?? 0) > 0 && (
                    <tr>
                      <td colSpan={3} className="p-3 font-medium text-sm text-orange-600">Outstanding balance</td>
                      <td className="p-3 text-right font-bold text-orange-600">{formatCurrency(paymentStatus?.balance ?? 0)}</td>
                      <td colSpan={2} />
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            { label: "Description", value: invoice.description },
            { label: "Academic Year", value: invoice.academicYear },
            { label: "Term", value: invoice.term },
            { label: "Issued", value: formatDate(invoice.issuedAt) },
            { label: "Due Date", value: invoice.dueDate ? formatDate(invoice.dueDate) : "—" },
          ].filter((r) => r.value).map((row) => (
            <div key={row.label} className="flex justify-between border-b pb-2 last:border-0">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
