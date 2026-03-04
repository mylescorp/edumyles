"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ParentFeesPage() {
  const { isLoading } = useAuth();
  const overview = useQuery(
    api.modules.portal.parent.queries.getChildrenFeeOverview,
    {}
  );

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
                <CardTitle>
                  {child.firstName} {child.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Total Invoiced: KES {child.totalInvoiced}</p>
                <p>Total Paid: KES {child.totalPaid}</p>
                <p className="font-medium">
                  Outstanding Balance: KES {child.balance}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

