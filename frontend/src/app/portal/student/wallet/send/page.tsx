"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Send, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function WalletSendPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myWallet = useQuery(
    api.modules.ewallet.queries.getMyWalletBalance,
    sessionToken ? { sessionToken } : "skip"
  );
  const sendWalletTransfer = useMutation(api.modules.portal.student.mutations.sendWalletTransfer);

  if (isLoading || myWallet === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const amountNum = parseFloat(amount);
  const balanceKES = myWallet.balanceCents / 100;
  const isValid =
    recipient.trim().length > 0 &&
    !Number.isNaN(amountNum) &&
    amountNum >= 1 &&
    amountNum <= balanceKES;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!isValid) {
      if (amountNum > balanceKES) {
        setError("Insufficient wallet balance.");
      }
      return;
    }

    if (!sessionToken) return;

    setIsSubmitting(true);
    try {
      const result = await sendWalletTransfer({
        sessionToken,
        recipientAdmissionNumber: recipient.trim().toUpperCase(),
        amountCents: Math.round(amountNum * 100),
        note: note.trim() || undefined,
      });
      setRecipientName(result.recipientName);
      setSubmitted(true);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to send wallet transfer.";
      setError(message);
      toast({
        title: "Transfer failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <PageHeader title="Send Money" description="Transfer funds to another student" />
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-14 w-14 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Transfer Sent!</h3>
            <p className="text-muted-foreground mb-1">
              KES {amountNum.toFixed(2)} sent to{" "}
              <span className="font-medium">{recipientName || recipient}</span>.
            </p>
            {note && (
              <p className="text-sm text-muted-foreground italic mb-4">
                Note: "{note}"
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <Button asChild variant="outline">
                <Link href="/portal/student/wallet">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Wallet
                </Link>
              </Button>
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setRecipient("");
                  setAmount("");
                  setNote("");
                  setRecipientName("");
                }}
              >
                Send Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Send Money" description="Transfer funds to another student" />

      <div className="max-w-lg space-y-6">
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="flex items-center gap-4 p-6">
            <Wallet className="h-8 w-8" />
            <div>
              <p className="text-blue-100 text-sm">Available Balance</p>
              <p className="text-2xl font-bold">
                {balanceKES.toFixed(2)} {myWallet.currency}
              </p>
            </div>
          </CardContent>
        </Card>

        {balanceKES <= 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">
              Your wallet balance is empty. Ask your school finance team to top up your wallet before sending money.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="recipient">Recipient Admission Number</Label>
                <Input
                  id="recipient"
                  placeholder="e.g., ADM-2026-001"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  max={balanceKES}
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setError("");
                  }}
                  required
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  placeholder="What is this for?"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/portal/student/wallet">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isValid || balanceKES <= 0 || isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Sending..." : "Send"}
              {" "}
              {!Number.isNaN(amountNum) && amountNum > 0
                ? `KES ${amountNum.toLocaleString()}`
                : ""}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
