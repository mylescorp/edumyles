"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Wallet, ArrowUpCircle, ArrowDownCircle, History, Lock, ArrowLeftRight, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/formatters";

const TYPE_LABELS: Record<string, string> = {
  top_up: "Top-Up",
  admin_top_up: "Admin Top-Up",
  spend: "Spend",
  transfer_out: "Transfer Out",
  transfer_in: "Transfer In",
  withdrawal: "Withdrawal",
};

const TYPE_SIGN: Record<string, string> = {
  top_up: "+",
  admin_top_up: "+",
  transfer_in: "+",
  spend: "-",
  transfer_out: "-",
  withdrawal: "-",
};

const TYPE_COLOR: Record<string, string> = {
  top_up: "text-green-600",
  admin_top_up: "text-green-600",
  transfer_in: "text-green-600",
  spend: "text-red-600",
  transfer_out: "text-orange-500",
  withdrawal: "text-red-600",
};

export default function StudentWallet() {
  const { sessionToken } = useAuth();
  const wallet = useQuery(
    api.modules.ewallet.queries.getMyWalletBalance,
    sessionToken ? { sessionToken } : "skip"
  );
  const transactions = useQuery(
    api.modules.ewallet.queries.getMyTransactionHistory,
    sessionToken ? { sessionToken, limit: 30 } : "skip"
  );
  const transferMutation = useMutation(api.modules.portal.student.mutations.sendWalletTransfer);

  const [transferOpen, setTransferOpen] = useState(false);
  const [toOwnerId, setToOwnerId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState("");

  const handleTransfer = async () => {
    setTransferError("");
    setTransferSuccess("");
    const amountCents = Math.round(parseFloat(transferAmount) * 100);
    if (!toOwnerId.trim()) { setTransferError("Recipient is required"); return; }
    if (isNaN(amountCents) || amountCents <= 0) { setTransferError("Enter a valid amount"); return; }
    if (wallet && amountCents > wallet.balanceCents) { setTransferError("Insufficient balance"); return; }

    setTransferLoading(true);
    try {
      const result = await transferMutation({
        sessionToken: sessionToken ?? "",
        recipientAdmissionNumber: toOwnerId.trim().toUpperCase(),
        amountCents,
        note: transferNote || undefined,
      });
      setTransferSuccess(`Transferred successfully to ${result.recipientName}. Ref: ${result.reference}`);
      setToOwnerId("");
      setTransferAmount("");
      setTransferNote("");
    } catch (e: any) {
      setTransferError(e.message ?? "Transfer failed");
    } finally {
      setTransferLoading(false);
    }
  };

  const isFrozen = wallet?.frozen ?? false;
  const balanceDisplay = wallet
    ? `${wallet.currency} ${(wallet.balanceCents / 100).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`
    : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Digital Wallet"
        description="Manage your school funds for cafeteria and shop purchases."
      />

      {isFrozen && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Your wallet is currently frozen. Contact your school administrator for assistance.</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Current Balance
            </CardTitle>
            <CardDescription className="text-primary-foreground/70">Available for use in school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{balanceDisplay}</div>
            {isFrozen && (
              <Badge variant="destructive" className="mt-2">Frozen</Badge>
            )}
            <p className="mt-2 text-sm text-primary-foreground/80">
              Valid at: School Canteen &amp; Uniform Shop
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!transactions || transactions.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground italic border-2 border-dashed rounded-lg">
                No recent transactions.
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((tx: any) => (
                  <div key={tx._id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{TYPE_LABELS[tx.type] ?? tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.note ?? tx.reference ?? "—"} · {formatDateTime(tx.createdAt)}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${TYPE_COLOR[tx.type] ?? "text-foreground"}`}>
                      {TYPE_SIGN[tx.type] ?? ""}
                      {wallet?.currency ?? "KES"} {(Math.abs(tx.amountCents) / 100).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:bg-muted/50 transition-colors border-dashed">
          <CardHeader>
            <ArrowUpCircle className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle>Top-Up Wallet</CardTitle>
            <CardDescription>Add funds using M-Pesa or Student Card.</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className={`transition-colors border-dashed ${isFrozen ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer"}`}
          onClick={() => !isFrozen && setTransferOpen(true)}
        >
          <CardHeader>
            <ArrowLeftRight className="h-8 w-8 text-blue-500 mb-2" />
            <CardTitle>Transfer / Send</CardTitle>
            <CardDescription>Send funds to another student or club.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Available balance</Label>
              <p className="text-lg font-semibold">{balanceDisplay}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="to-owner">Recipient Admission Number</Label>
              <Input
                id="to-owner"
                placeholder="e.g. STU-ABC-001234"
                value={toOwnerId}
                onChange={(e) => setToOwnerId(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="transfer-amount">Amount ({wallet?.currency ?? "KES"})</Label>
              <Input
                id="transfer-amount"
                type="number"
                min="1"
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="transfer-note">Note (optional)</Label>
              <Input
                id="transfer-note"
                placeholder="e.g. lunch money"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
              />
            </div>
            {transferError && (
              <p className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {transferError}
              </p>
            )}
            {transferSuccess && (
              <p className="text-sm text-green-600">{transferSuccess}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={transferLoading}>
              {transferLoading ? "Sending..." : "Send Funds"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
