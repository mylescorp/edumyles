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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { CreditCard, Smartphone, Building, CheckCircle, Clock, AlertCircle } from "lucide-react";

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
    paymentMethod: "mpesa" | "card" | "bank_transfer";
  }>({ open: false, invoiceId: null, amount: 0, paymentMethod: "mpesa" });
  const [phone, setPhone] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [bankDetails, setBankDetails] = useState({ accountName: "", accountNumber: "", bankName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const handlePayClick = (invoiceId: Id<"invoices">, amount: number, label?: string) => {
    setPayDialog({ open: true, invoiceId, amount, label, paymentMethod: "mpesa" });
    setPhone("");
    setCardDetails({ number: "", expiry: "", cvv: "" });
    setBankDetails({ accountName: "", accountNumber: "", bankName: "" });
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
    
    if (payDialog.paymentMethod === "bank_transfer" && (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName)) {
      toast({
        title: "Bank details required",
        description: "Please enter complete bank transfer information",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    try {
      let result;
      
      switch (payDialog.paymentMethod) {
        case "mpesa":
          result = await initiateStkPush({
            invoiceId: payDialog.invoiceId,
            phone: phone.trim(),
          });
          break;
          
        case "card":
          // For now, log card payment intent (Stripe integration in Phase 11)
          result = { message: "Card payment processing will be available soon" };
          toast({
            title: "Info",
            description: "Card payments will be available in Phase 11",
          });
          break;
          
        case "bank_transfer":
          // For now, log bank transfer intent
          result = { message: "Bank transfer instructions will be available soon" };
          toast({
            title: "Info", 
            description: "Bank transfers will be available in Phase 11",
          });
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
              <RadioGroup 
                value={payDialog.paymentMethod} 
                onValueChange={(value: "mpesa" | "card" | "bank_transfer") => 
                  setPayDialog((d) => ({ ...d, paymentMethod: value }))
                }
              >
                <div className="flex items-center space-x-4">
                  <RadioGroupItem value="mpesa" className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4" />
                    <span>M-Pesa</span>
                  </RadioGroupItem>
                  <RadioGroupItem value="card" className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Card</span>
                  </RadioGroupItem>
                  <RadioGroupItem value="bank_transfer" className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Bank Transfer</span>
                  </RadioGroupItem>
                </div>
              </RadioGroup>
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
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  placeholder="Equity Bank"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails((d) => ({ ...d, bankName: e.target.value }))}
                />
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  placeholder="John Doe"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails((d) => ({ ...d, accountName: e.target.value }))}
                />
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  placeholder="1234567890"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails((d) => ({ ...d, accountNumber: e.target.value }))}
                />
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-muted p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount to Pay:</span>
                <span className="text-lg font-bold">KES {payDialog.amount}</span>
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
                        KES {payment.amount} • {payment.method.replace('_', ' ').toUpperCase()}
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

