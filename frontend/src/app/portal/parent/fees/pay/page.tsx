"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function ParentPayFeesPage() {
  const { isLoading } = useAuth();

  const children = useQuery(
    api.modules.portal.parent.queries.getChildren,
    {}
  );

  useQuery(api.modules.portal.parent.queries.getChildrenFeeOverview, {});

  const initiateStkPush = useAction(api.actions.payments.mpesa.initiateStkPush);

  const [payDialog, setPayDialog] = useState<{
    open: boolean;
    invoiceId: Id<"invoices"> | null;
    amount: number;
    label?: string;
  }>({ open: false, invoiceId: null, amount: 0 });
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePayClick = (invoiceId: Id<"invoices">, amount: number, label?: string) => {
    setPayDialog({ open: true, invoiceId, amount, label });
    setPhone("");
  };

  const handlePaySubmit = async () => {
    if (!payDialog.invoiceId || !phone.trim()) {
      toast({
        title: "Phone required",
        description: "Enter your M-Pesa phone number (e.g. 07XX XXX XXX).",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = await initiateStkPush({
        invoiceId: payDialog.invoiceId,
        phone: phone.trim(),
      });
      setPayDialog((d) => ({ ...d, open: false }));
      toast({
        title: "Payment initiated",
        description: result.message ?? "Enter your M-Pesa PIN on your phone to complete payment.",
      });
    } catch (error) {
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unable to initiate payment. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || children === undefined) {
    return <LoadingSkeleton variant="page" />;
  }
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
        children.map((child: { _id: Id<"students">; firstName: string; lastName: string }) => (
          <ChildPayCard
            key={child._id}
            child={child}
            onPayClick={handlePayClick}
          />
        ))
      )}

      <Dialog open={payDialog.open} onOpenChange={(open) => setPayDialog((d) => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay with M-Pesa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You will receive an M-Pesa prompt on your phone. Amount: KES {payDialog.amount}
          </p>
          <div className="grid gap-2">
            <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
            <Input
              id="mpesa-phone"
              type="tel"
              placeholder="07XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog((d) => ({ ...d, open: false }))}>
              Cancel
            </Button>
            <Button onClick={handlePaySubmit} disabled={submitting}>
              {submitting ? "Sending…" : "Send M-Pesa prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChildPayCard({
  child,
  onPayClick,
}: {
  child: { _id: Id<"students">; firstName: string; lastName: string };
  onPayClick: (invoiceId: Id<"invoices">, amount: number, label?: string) => void;
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
            {outstandingInvoices.map((inv: { _id: Id<"invoices">; dueDate: string; amount: number }) => (
              <div key={inv._id} className="flex items-center justify-between">
                <span>
                  Invoice • Due {inv.dueDate} • KES {inv.amount}
                </span>
                <Button
                  size="sm"
                  onClick={() => onPayClick(inv._id, inv.amount, `${child.firstName} ${child.lastName}`)}
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

