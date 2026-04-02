"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function ParentFeesHistoryPage() {
  const { isLoading } = useAuth();

  const payments = useQuery(
    api.modules.portal.parent.queries.getPaymentHistory,
    {}
  ) as
    | Array<{
        _id: string;
        amount: number;
        method: string;
        status: string;
        processedAt?: number;
        updatedAt?: number;
        createdAt?: number;
        reference?: string;
        studentName: string;
        invoiceAmount: number;
        invoiceStatus: string;
        dueDate?: string | null;
      }>
    | undefined;

  if (isLoading || payments === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payment History"
        description="View past fee payments"
      />

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No payments have been recorded yet.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.map((payment) => {
              const timestamp =
                payment.processedAt ?? payment.updatedAt ?? payment.createdAt;

              return (
                <div
                  key={payment._id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">
                        {payment.studentName}
                      </p>
                      <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                        {payment.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline">
                        {payment.invoiceStatus.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {payment.method.toUpperCase()} payment of {formatCurrency(payment.amount)}
                      {payment.reference ? ` • Ref ${payment.reference}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Invoice total {formatCurrency(payment.invoiceAmount)}
                      {payment.dueDate ? ` • Due ${formatDate(payment.dueDate)}` : ""}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground sm:text-right">
                    {timestamp ? formatDate(timestamp) : "Date unavailable"}
                  </div>
                </div>
              );
            })}
            {payments.some((payment) => payment.status !== "completed") && (
              <p className="text-xs text-muted-foreground">
                Pending and failed attempts are shown here for visibility. Only completed payments
                reduce your outstanding balance.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

