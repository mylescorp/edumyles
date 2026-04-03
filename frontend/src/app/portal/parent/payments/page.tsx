"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type ChildFeeOverview = {
  studentId: string;
  firstName: string;
  lastName: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  pendingInvoiceCount: number;
  paidInvoiceCount: number;
};

type ParentPaymentHistoryItem = {
  _id: string;
  amount: number;
  method: string;
  reference: string;
  status: string;
  processedAt?: number;
  createdAt?: number;
  studentName: string;
  invoiceAmount: number;
  invoiceStatus: string;
  dueDate?: string | null;
};

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
    case "success":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "failed":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function ParentPaymentsPage() {
  const { isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const childOverview = useQuery(
    api.modules.portal.parent.queries.getChildrenFeeOverview,
    {}
  ) as ChildFeeOverview[] | undefined;

  const paymentHistory = useQuery(
    api.modules.portal.parent.queries.getPaymentHistory,
    {}
  ) as ParentPaymentHistoryItem[] | undefined;

  const generateReceipt = useMutation(api.modules.finance.mutations.generateReceipt);

  if (isLoading || childOverview === undefined || paymentHistory === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const totalBilled = childOverview.reduce((sum, child) => sum + child.totalInvoiced, 0);
  const totalPaid = childOverview.reduce((sum, child) => sum + child.totalPaid, 0);
  const outstanding = childOverview.reduce((sum, child) => sum + child.balance, 0);

  const filteredPayments = paymentHistory.filter((payment) =>
    payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusFilteredPayments =
    statusFilter === "all"
      ? filteredPayments
      : filteredPayments.filter((payment) => payment.status === statusFilter);

  const dateFilteredPayments = dateFilter
    ? statusFilteredPayments.filter((payment) => {
        const timestamp = payment.processedAt ?? payment.createdAt;
        return timestamp ? new Date(timestamp) <= new Date(dateFilter) : false;
      })
    : statusFilteredPayments;

  const methodTotals = dateFilteredPayments.reduce<Record<string, number>>((acc, payment) => {
    const key = payment.method || "unknown";
    acc[key] = (acc[key] ?? 0) + payment.amount;
    return acc;
  }, {});

  const handleGenerateReceipt = async (paymentId: string) => {
    try {
      const receiptData = await generateReceipt({ paymentId: paymentId as any, format: "html" });
      const receiptWindow = window.open("", "_blank");

      if (!receiptWindow) {
        throw new Error("Unable to open receipt window");
      }

      receiptWindow.document.write(String(receiptData));
      receiptWindow.document.close();

      toast({
        title: "Receipt generated",
        description: "The receipt has been opened in a new tab.",
      });
    } catch (error) {
      toast({
        title: "Failed to generate receipt",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportReport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      filters: {
        searchTerm,
        statusFilter,
        dateFilter,
      },
      summary: {
        totalBilled,
        totalPaid,
        outstanding,
      },
      childOverview,
      payments: dateFilteredPayments,
    };

    const dataStr = JSON.stringify(payload, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const linkElement = document.createElement("a");
    linkElement.href = dataUri;
    linkElement.download = `parent-payments-report-${new Date().toISOString().split("T")[0]}.json`;
    linkElement.click();

    toast({
      title: "Report generated",
      description: "Payment report downloaded as JSON.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment History"
        description="Track fee balances, payment receipts, and payment activity for all linked children"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by child, reference, or method..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>
                <div className="font-medium">Total Billed</div>
                <div className="text-lg font-bold text-foreground">KES {totalBilled.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium">Total Paid</div>
                <div className="text-lg font-bold text-green-600">KES {totalPaid.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium">Outstanding</div>
                <div className="text-lg font-bold text-red-600">KES {outstanding.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Child Fee Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {childOverview.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No linked children were found for this account.
            </div>
          ) : (
            childOverview.map((child) => (
              <div key={child.studentId} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    {child.firstName} {child.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Invoiced KES {child.totalInvoiced.toLocaleString()} • Paid KES {child.totalPaid.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {child.pendingInvoiceCount} pending invoice(s) • {child.paidInvoiceCount} paid invoice(s)
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${child.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                    KES {child.balance.toLocaleString()}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/portal/parent/fees/pay">
                      <DollarSign className="mr-1 h-4 w-4" />
                      Pay Fees
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments ({dateFilteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dateFilteredPayments.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No Payments Found</h3>
              <p className="text-muted-foreground">No payment activity matches your current filters.</p>
            </div>
          ) : (
            dateFilteredPayments.map((payment) => (
              <div
                key={payment._id}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status === "failed" ? (
                        <AlertCircle className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                      )}
                      <span className="capitalize">{payment.status.replace("_", " ")}</span>
                    </Badge>
                    <span className="font-medium">{payment.studentName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ref: {payment.reference} • {payment.method.toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.processedAt || payment.createdAt
                      ? format(new Date(payment.processedAt ?? payment.createdAt ?? Date.now()), "PPP p")
                      : "Awaiting processing"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Invoice status: {payment.invoiceStatus.replace("_", " ")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">KES {payment.amount.toLocaleString()}</div>
                  <div className="mt-2 flex justify-end gap-2">
                    {(payment.status === "completed" || payment.status === "success") && (
                      <Button variant="outline" size="sm" onClick={() => handleGenerateReceipt(payment._id)}>
                        <Download className="mr-1 h-4 w-4" />
                        Receipt
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/portal/parent/fees">
                        <Eye className="mr-1 h-4 w-4" />
                        View Fees
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : "0.0"}%
              </div>
              <p className="text-sm text-muted-foreground">of invoiced fees have been paid</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(methodTotals).length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment activity yet.</p>
            ) : (
              Object.entries(methodTotals).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{method.replace("_", " ")}</span>
                  <span className="font-medium">KES {amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/portal/parent/fees/pay">
                <DollarSign className="mr-2 h-4 w-4" />
                Make Payment
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleExportReport}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/portal/parent/messages">
                <Calendar className="mr-2 h-4 w-4" />
                Contact School
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
