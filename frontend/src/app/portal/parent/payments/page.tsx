"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download,
  Eye,
  Filter,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function ParentPaymentsPage() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const invoices = useQuery(
    api.modules.finance.queries.listInvoices,
    user ? { studentId: user._id } : "skip"
  );

  const payments = useQuery(
    api.modules.finance.queries.getFinancialReport,
    {}
  );

  const generateReceipt = useMutation(api.modules.finance.mutations.generateReceipt);

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const handleGenerateReceipt = async (paymentId: string) => {
    try {
      const receiptData = await generateReceipt({ paymentId, format: "html" });
      
      // Create and download receipt
      const receiptWindow = window.open('', '_blank');
      receiptWindow.document.write(receiptData);
      receiptWindow.document.close();
      
      toast({
        title: "Receipt Generated",
        description: "Receipt has been generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate receipt",
        variant: "destructive"
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
        totalBilled: payments?.totalBilled ?? 0,
        totalPaid: payments?.totalPaid ?? 0,
        outstanding: payments?.outstanding ?? 0,
      },
      invoices: dateFilteredInvoices?.map((invoice: any) => ({
        invoiceNumber: invoice.invoiceNumber,
        dueDate: invoice.dueDate,
        amount: invoice.amount,
        status: invoice.status,
      })),
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "partially_paid":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "partially_paid":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredInvoices = invoices?.filter((invoice: any) =>
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const statusFilteredInvoices = statusFilter === "all" 
    ? filteredInvoices 
    : filteredInvoices?.filter((invoice: any) => invoice.status === statusFilter);

  const dateFilteredInvoices = dateFilter
    ? statusFilteredInvoices?.filter((invoice: any) => 
        new Date(invoice.dueDate) <= new Date(dateFilter)
      )
    : statusFilteredInvoices;

  return (
    <div>
      <PageHeader
        title="Payment History"
        description="View invoices, payments, and generate receipts"
      />

      <div className="space-y-6">
        {/* Filters */}
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
                    placeholder="Search by invoice number or student..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Due Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  placeholder="Filter by due date"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium">Total Billed:</div>
                  <div className="text-lg font-bold">
                    KES {payments?.totalBilled?.toLocaleString() || "0"}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium">Total Paid:</div>
                  <div className="text-lg font-bold text-green-600">
                    KES {payments?.totalPaid?.toLocaleString() || "0"}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium">Outstanding:</div>
                  <div className="text-lg font-bold text-red-600">
                    KES {payments?.outstanding?.toLocaleString() || "0"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices ({dateFilteredInvoices?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {dateFilteredInvoices?.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Invoices Found</h3>
                <p className="text-muted-foreground">
                  No invoices match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dateFilteredInvoices?.map((invoice: any) => (
                  <div
                    key={invoice._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-2 capitalize">
                            {invoice.status.replace('_', ' ')}
                          </span>
                        </Badge>
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(invoice.dueDate), "PPP")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        KES {invoice.amount.toLocaleString()}
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateReceipt(invoice._id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/portal/parent/fees">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Statistics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Collection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {payments?.collectionRate?.toFixed(1) || "0"}%
                </div>
                <p className="text-sm text-muted-foreground">
                  of invoices paid on time
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cash</span>
                  <span className="font-medium">KES 0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bank Transfer</span>
                  <span className="font-medium">KES 0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mobile Money</span>
                  <span className="font-medium">KES 0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Card</span>
                  <span className="font-medium">KES 0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/portal/parent/fees/pay">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Make Payment
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleExportReport}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/portal/parent/messages">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Reminders
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
