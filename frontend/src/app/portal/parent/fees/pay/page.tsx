"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function ParentPayFeesPage() {
  const { isLoading } = useAuth();

  const children = useQuery(
    api.modules.portal.parent.queries.getChildren,
    {}
  );

  const getOutstanding = useQuery(
    api.modules.portal.parent.queries.getChildrenFeeOverview,
    {}
  );

  const initiatePayment = useMutation(
    api.modules.portal.parent.mutations.initiatePayment
  );

  if (isLoading || children === undefined || getOutstanding === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handlePay = async (studentId: string, invoiceId: string) => {
    try {
      await initiatePayment({ invoiceId, method: "mpesa" });
      toast({
        title: "Payment initiated",
        description: "M-Pesa STK push will complete this payment in Phase 11.",
      });
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "Unable to initiate payment. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pay Fees"
        description="Initiate fee payments for your children"
      />

      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No children are linked to your account yet.
        </p>
      ) : (
        children.map((child: any) => (
          <ChildPayCard
            key={child._id}
            child={child}
            onPay={handlePay}
          />
        ))
      )}
    </div>
  );
}

function ChildPayCard({
  child,
  onPay,
}: {
  child: any;
  onPay: (studentId: string, invoiceId: string) => void;
}) {
  const outstandingInvoices = useQuery(
    api.modules.portal.parent.queries.getOutstandingInvoicesForChild,
    { studentId: String(child._id) }
  );

  if (outstandingInvoices === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {child.firstName} {child.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton variant="card" />
        </CardContent>
      </Card>
    );
  }

  const hasOutstanding = outstandingInvoices.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {child.firstName} {child.lastName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {hasOutstanding ? (
          <>
            {outstandingInvoices.map((inv: any) => (
              <div key={inv._id} className="flex items-center justify-between">
                <span>
                  Invoice • Due {inv.dueDate} • KES {inv.amount}
                </span>
                <Button
                  size="sm"
                  onClick={() => onPay(String(child._id), String(inv._id))}
                >
                  Pay with M-Pesa
                </Button>
              </div>
            ))}
          </>
        ) : (
          <p>No outstanding invoices.</p>
        )}
      </CardContent>
    </Card>
  );
}

