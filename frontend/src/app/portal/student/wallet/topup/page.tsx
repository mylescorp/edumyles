"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, CreditCard, Smartphone, ArrowLeft, CheckCircle, Building } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { requestWalletTopUpSchema } from "@shared/validators";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const PAYMENT_METHODS = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone, description: "Pay via M-Pesa mobile money" },
  { id: "card", label: "Debit / Credit Card", icon: CreditCard, description: "Visa, Mastercard" },
  { id: "bank_transfer", label: "Bank Transfer", icon: Building, description: "Request manual bank-transfer funding" },
];

export default function WalletTopupPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mpesa");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [latestReference, setLatestReference] = useState("");

  const myWallet = useQuery(
    api.modules.ewallet.queries.getMyWalletBalance,
    sessionToken ? { sessionToken } : "skip"
  );
  const myRequests = useQuery(
    api.modules.ewallet.queries.getMyTopUpRequests,
    sessionToken ? { sessionToken, limit: 10 } : "skip"
  );
  const requestTopUp = useMutation(api.modules.ewallet.mutations.requestTopUp);

  if (isLoading || myWallet === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const amountNum = parseFloat(amount);
  const isValid = !isNaN(amountNum) && amountNum >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;

    const parsed = requestWalletTopUpSchema.safeParse({
      amount: amountNum,
      method,
      phone,
      note,
    });
    if (!parsed.success) {
      toast({
        title: "Request details incomplete",
        description: parsed.error.issues[0]?.message ?? "Please complete the form.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestTopUp({
        sessionToken,
        amountCents: Math.round(amountNum * 100),
        method: parsed.data.method,
        phone: parsed.data.phone || undefined,
        note: parsed.data.note || undefined,
        currency: myWallet.currency,
      });
      setLatestReference(result.reference);
      setSubmitted(true);
      setAmount("");
      setPhone("");
      setNote("");
    } catch (error) {
      toast({
        title: "Unable to submit top-up request",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <PageHeader title="Add Funds" description="Top up your eWallet" />
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-14 w-14 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Request Submitted!</h3>
            <p className="text-muted-foreground mb-1">
              Your {PAYMENT_METHODS.find((m) => m.id === method)?.label} wallet top-up request has been sent for review.
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              KES {amountNum.toFixed(2)} requested via{" "}
              {PAYMENT_METHODS.find((m) => m.id === method)?.label}.
            </p>
            {latestReference && (
              <p className="text-sm text-muted-foreground mb-2">
                Reference: <span className="font-medium text-foreground">{latestReference}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-6">
              Finance will approve and credit your wallet once they verify the request.
            </p>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/portal/student/wallet">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Wallet
                </Link>
              </Button>
              <Button onClick={() => setSubmitted(false)}>Add More Funds</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Add Funds" description="Top up your eWallet" />

      <div className="max-w-lg space-y-6">
        {/* Current balance */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="flex items-center gap-4 p-6">
            <Wallet className="h-8 w-8" />
            <div>
              <p className="text-blue-100 text-sm">Current Balance</p>
              <p className="text-2xl font-bold">
                {(myWallet.balanceCents / 100).toFixed(2)} {myWallet.currency}
              </p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <Card>
            <CardHeader>
              <CardTitle>Amount to Add</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((a) => (
                  <Button
                    key={a}
                    type="button"
                    variant={amount === String(a) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount(String(a))}
                  >
                    KES {a.toLocaleString()}
                  </Button>
                ))}
              </div>
              {method === "mpesa" && (
                <div className="space-y-1">
                  <Label htmlFor="phone">M-Pesa Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+254712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="note">Note</Label>
                <Input
                  id="note"
                  placeholder="Optional note for finance"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="amount">Custom Amount ({myWallet.currency})</Label>
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  step="1"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Minimum top-up: KES 10</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                return (
                  <label
                    key={pm.id}
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      method === pm.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={pm.id}
                      checked={method === pm.id}
                      onChange={() => setMethod(pm.id)}
                      className="sr-only"
                    />
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{pm.label}</p>
                      <p className="text-xs text-muted-foreground">{pm.description}</p>
                    </div>
                    {method === pm.id && (
                      <Badge variant="default" className="bg-primary text-xs">
                        Selected
                      </Badge>
                    )}
                  </label>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/portal/student/wallet">Cancel</Link>
            </Button>
            <Button type="submit" className="flex-1" disabled={!isValid || submitting}>
              {submitting ? "Submitting..." : `Request ${isValid ? `${myWallet.currency} ${amountNum.toLocaleString()}` : "…"} via `}
              {PAYMENT_METHODS.find((m) => m.id === method)?.label}
            </Button>
          </div>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Recent Top-up Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {((myRequests as any[]) ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Your recent top-up requests will appear here once submitted.
              </p>
            ) : (
              ((myRequests as any[]) ?? []).map((request) => (
                <div key={request._id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {myWallet.currency} {(request.amountCents / 100).toFixed(2)} via {String(request.method).replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.reference ?? "No reference"} • {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
