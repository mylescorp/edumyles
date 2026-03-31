"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  FileText,
  TrendingUp,
  ArrowRight,
  Percent,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function FinanceIndexPage() {
  const { isLoading, sessionToken } = useAuth();

  const feeStructures = useQuery(
    api.modules.finance.queries.listFeeStructures,
    sessionToken ? { sessionToken } : "skip"
  );

  const invoices = useQuery(
    api.modules.finance.queries.listInvoices,
    sessionToken ? { sessionToken } : "skip"
  );

  const report = useQuery(
    api.modules.finance.queries.getFinancialReport,
    sessionToken ? { sessionToken } : "skip"
  ) as any;

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const feeList     = (feeStructures ?? []) as any[];
  const invoiceList = (invoices ?? []) as any[];
  const overdue     = invoiceList.filter((i: any) => i.status === "overdue").length;
  const outstanding = report?.outstanding ?? 0;
  const collected   = report?.totalPaid ?? 0;
  const rate        = report?.collectionRate ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Fee structures, invoices and billing configuration"
        breadcrumbs={[
          { label: "Admin Portal", href: "/portal/admin" },
          { label: "Finance" },
        ]}
        actions={
          <Link href="/admin/finance">
            <Button variant="outline" size="sm" className="gap-1.5">
              Full Finance Panel <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(collected / 100, "KES")}</p>
              <p className="text-sm text-muted-foreground">Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(outstanding / 100, "KES")}</p>
              <p className="text-sm text-muted-foreground">Outstanding</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Percent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(rate)}%</p>
              <p className="text-sm text-muted-foreground">Collection Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-2xl font-bold">{overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
              {overdue > 0 && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">!</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module sections */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-base">Fee Structures</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configure fee schedules, discount policies and grade-based billing rules.
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active structures</span>
              <Badge variant="outline">{feeList.filter((f: any) => f.isActive !== false).length}</Badge>
            </div>
            <Link href="/portal/admin/finance/fees">
              <Button className="w-full gap-2">
                Manage Fee Structures <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base">Invoices</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate, view and manage student invoices with payment tracking.
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total invoices</span>
              <Badge variant="outline">{invoiceList.length}</Badge>
            </div>
            <Link href="/admin/finance/invoices">
              <Button className="w-full gap-2">
                View Invoices <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
