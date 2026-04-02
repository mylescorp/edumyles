"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useAction } from "@/hooks/useSSRSafeConvex";
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
import { CreditCard, Smartphone, Building, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";

type BankTransferInstructions = {
  reference: string;
  amount: number;
  instructions: string[];
  bankDetails: {
    accountNumber: string;
    bankName: string;
    branch: string;
    swift: string;
  };
};

export default function ParentPayFeesPage() {
  const { isLoading } = useAuth();

  const children = useQuery(
    api.modules.portal.parent.queries.getChildren,
    {}
  );

  const initiateStkPush = useAction(api.actions.payments.mpesa.initiateStkPush);

  const [payDialog, setPayDialog] = useState<{
    open: boolean;
    invoiceId: Id<"invoices"> | null;
    amount: number;
    label?: string;
    paymentMethod: "mpesa" | "card" | "bank_transfer";
  }>({ open: false, invoiceId: null, amount: 0, paymentMethod: "mpesa" });
  const [phone, setPhone] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [submitting, setSubmitting] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [bankTransferInstructions, setBankTransferInstructions] =
    useState<BankTransferInstructions | null>(null);

  const handlePayClick = (invoiceId: Id<"invoices">, amount: number, label?: string) => {
    setPayDialog({ open: true, invoiceId, amount, label, paymentMethod: "mpesa" });
    setPhone("");
    setCardDetails({ number: "", expiry: "", cvv: "" });
  };

  const handlePaySubmit = async () => {
    if (!payDialog.invoiceId) return;
    
    // Validate based on payment method
    if (payDialog.paymentMethod === "mpesa" && !phone.trim()) {
      toast({
        title: "Phone required",
        description: "Enter your M-Pesa phone number (e.g. 07XX XXX XXX).",
        variant: "destructive",
      });
      return;
    }
    
    if (payDialog.paymentMethod === "card" && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv)) {
      toast({
        title: "Card details required",
        description: "Please enter complete card information",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    try {
      let result;
      
      switch (payDialog.paymentMethod) {
        case "mpesa":
          try {
            result = await initiateStkPush({
              invoiceId: payDialog.invoiceId,
              phone: phone.trim(),
            });
          } catch (_actionError) {
            // Fallback to server route for environments where Convex auth identity is unavailable.
            const res = await fetch("/api/payments/mpesa/initiate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                invoiceId: payDialog.invoiceId,
                phone: phone.trim(),
              }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(payload.error ?? "Unable to initiate M-Pesa payment");
            }
            result = payload;
          }
          break;
          
        case "card":
          {
            const res = await fetch("/api/payments/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                invoiceId: payDialog.invoiceId,
                successUrl: "/portal/parent/fees?payment=success",
                cancelUrl: "/portal/parent/fees/pay?payment=cancelled",
              }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(payload.error ?? "Unable to create Stripe checkout session");
            }
            if (payload.url) {
              window.location.href = payload.url;
              return;
            }
            result = payload;
          }
          break;
          
        case "bank_transfer":
          {
            const res = await fetch("/api/payments/bank-transfer/initiate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                invoiceId: payDialog.invoiceId,
              }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(payload.error ?? "Unable to start bank transfer");
            }
            result = payload;
            setBankTransferInstructions(payload);
          }
          break;
      }
      
      setPayDialog((d) => ({ ...d, open: false }));
      
      // Add to payment history
      setPaymentHistory(prev => [...prev, {
        id: Date.now().toString(),
        invoiceId: payDialog.invoiceId,
        amount: payDialog.amount,
        method: payDialog.paymentMethod,
        status: 'pending',
        timestamp: new Date().toISOString(),
        label: payDialog.label
      }]);
      
      toast({
        title: "Payment initiated",
        description: result.message ?? "Payment request submitted successfully",
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Payment Method Selection */}
            <div>
              <Label>Payment Method</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setPayDialog((d) => ({ ...d, paymentMethod: "mpesa" }))}
                    className={`flex items-center space-x-2 p-2 rounded ${payDialog.paymentMethod === "mpesa" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>M-Pesa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayDialog((d) => ({ ...d, paymentMethod: "card" }))}
                    className={`flex items-center space-x-2 p-2 rounded ${payDialog.paymentMethod === "card" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayDialog((d) => ({ ...d, paymentMethod: "bank_transfer" }))}
                    className={`flex items-center space-x-2 p-2 rounded ${payDialog.paymentMethod === "bank_transfer" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    <Building className="h-4 w-4" />
                    <span>Bank Transfer</span>
                  </button>
                </div>
                {payDialog.paymentMethod === "bank_transfer" && (
                  <p className="text-xs text-muted-foreground">
                    Bank transfer uses the school account details below after initiation.
                  </p>
                )}
              </div>
            </div>

            {/* Payment Details Based on Method */}
            {payDialog.paymentMethod === "mpesa" && (
              <div className="space-y-2">
                <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
                <Input
                  id="mpesa-phone"
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  You will receive an M-Pesa prompt on this phone
                </p>
              </div>
            )}

            {payDialog.paymentMethod === "card" && (
              <div className="space-y-2">
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  type="text"
                  placeholder="1234 5678 9012"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails((d) => ({ ...d, number: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="card-expiry">Expiry Date</Label>
                    <Input
                      id="card-expiry"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails((d) => ({ ...d, expiry: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-cvv">CVV</Label>
                    <Input
                      id="card-cvv"
                      type="password"
                      placeholder="123"
                      maxLength={3}
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails((d) => ({ ...d, cvv: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {payDialog.paymentMethod === "bank_transfer" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We will generate a unique transfer reference and show the school bank details
                  after you continue.
                </p>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-muted p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount to Pay:</span>
                <span className="text-lg font-bold">{formatCurrency(payDialog.amount)}</span>
              </div>
              {payDialog.label && (
                <div className="text-xs text-muted-foreground">
                  For: {payDialog.label}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog((d) => ({ ...d, open: false }))}>
              Cancel
            </Button>
            <Button onClick={handlePaySubmit} disabled={submitting}>
              {submitting ? "Processing…" : (
                <>
                  {payDialog.paymentMethod === "mpesa" && "Send M-Pesa Prompt"}
                  {payDialog.paymentMethod === "card" && "Pay with Card"}
                  {payDialog.paymentMethod === "bank_transfer" && "Get Bank Details"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!bankTransferInstructions}
        onOpenChange={(open) => {
          if (!open) setBankTransferInstructions(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bank Transfer Instructions</DialogTitle>
          </DialogHeader>
          {bankTransferInstructions && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-semibold">{bankTransferInstructions.reference}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(bankTransferInstructions.amount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-md border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">{bankTransferInstructions.bankDetails.bankName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account Number</span>
                  <span className="font-medium">{bankTransferInstructions.bankDetails.accountNumber}</span>
                </div>
                {bankTransferInstructions.bankDetails.branch && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Branch</span>
                    <span className="font-medium">{bankTransferInstructions.bankDetails.branch}</span>
                  </div>
                )}
                {bankTransferInstructions.bankDetails.swift && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">SWIFT</span>
                    <span className="font-medium">{bankTransferInstructions.bankDetails.swift}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Next steps</Label>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {bankTransferInstructions.instructions.map((instruction) => (
                    <li key={instruction} className="rounded-md border bg-background p-3">
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setBankTransferInstructions(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Payment Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      payment.status === 'completed' ? 'bg-green-500' :
                      payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">{payment.label || 'Payment'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(payment.amount)} • {payment.method.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {payment.status === 'completed' && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Completed</span>
                      </div>
                    )}
                    {payment.status === 'pending' && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                    {payment.status === 'failed' && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Failed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {paymentHistory.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  View all payments in transaction history
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
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
  ) as
    | Array<{
        _id: Id<"invoices">;
        dueDate: string;
        amount: number;
        amountPaid: number;
        balance: number;
        status: string;
      }>
    | undefined;

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
            {outstandingInvoices.map((inv) => (
              <div
                key={inv._id}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      Invoice due {formatDate(inv.dueDate)}
                    </span>
                    <Badge variant={inv.status === "partially_paid" ? "secondary" : "outline"}>
                      {inv.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p>
                    Total {formatCurrency(inv.amount)} • Paid {formatCurrency(inv.amountPaid)} •
                    Balance {formatCurrency(inv.balance)}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    onPayClick(inv._id, inv.balance, `${child.firstName} ${child.lastName}`)
                  }
                >
                  Pay Balance
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
