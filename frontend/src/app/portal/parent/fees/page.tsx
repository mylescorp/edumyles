"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";

export default function ParentFeesPage() {
  const { isLoading } = useAuth();
  const overview = useQuery(
    api.modules.portal.parent.queries.getChildrenFeeOverview,
    {}
  ) as Array<{
    studentId: string;
    firstName: string;
    lastName: string;
    totalInvoiced: number;
    totalPaid: number;
    balance: number;
    pendingInvoiceCount: number;
    paidInvoiceCount: number;
  }> | undefined;

  if (isLoading || overview === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div>
      <PageHeader
        title="Fees"
        description="View outstanding fee balances for your children"
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/portal/parent/fees/pay">Pay Fees</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/portal/parent/fees/history">Payment History</Link>
            </Button>
          </div>
        }
      />

      {overview.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No children are linked to your account yet.
        </p>
      ) : (
        <div className="space-y-4">
          {overview.map((child) => (
              <Card key={child.studentId}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle>
                      {child.firstName} {child.lastName}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={child.balance > 0 ? "secondary" : "default"}>
                        {child.balance > 0 ? `${child.pendingInvoiceCount} outstanding` : "Up to date"}
                      </Badge>
                      {child.paidInvoiceCount > 0 && (
                        <Badge variant="outline">
                          {child.paidInvoiceCount} paid
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Total Invoiced
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatCurrency(child.totalInvoiced)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Confirmed Payments
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatCurrency(child.totalPaid)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Outstanding Balance
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatCurrency(child.balance)}
                    </p>
                  </div>
                </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

