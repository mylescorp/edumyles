"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentFeesHistoryPage() {
  const { isLoading } = useAuth();

  const payments = useQuery(
    api.modules.portal.parent.queries.getPaymentHistory,
    {}
  );

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
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {payments.map((p: any) => (
              <div key={p._id} className="flex items-center justify-between">
                <span>
                  KES {p.amount} • {p.method} • {p.status}
                </span>
                <span>
                  {new Date(p.processedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

