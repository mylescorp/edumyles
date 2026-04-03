"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";

type WalletSummary = {
    _id: Id<"wallets">;
    ownerId: string;
    ownerType: string;
    balanceCents: number;
    currency: string;
    frozen?: boolean;
    updatedAt: number;
};

export default function WalletsPage() {
    const { isLoading, sessionToken } = useAuth();
    const { toast } = useToast();
    const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(null);
    const [selectedAdjustmentWallet, setSelectedAdjustmentWallet] = useState<WalletSummary | null>(null);
    const [topUpAmount, setTopUpAmount] = useState("");
    const [topUpNote, setTopUpNote] = useState("");
    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentNote, setAdjustmentNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const wallets = useQuery(
        api.modules.ewallet.queries.listAllWallets,
        sessionToken ? { sessionToken, limit: 250 } : "skip"
    ) as WalletSummary[] | undefined;

    const adminTopUp = useMutation(api.modules.ewallet.mutations.adminTopUp);
    const adminAdjustWallet = useMutation(api.modules.ewallet.mutations.adminAdjustWallet);
    const freezeWallet = useMutation(api.modules.ewallet.mutations.freezeWallet);
    const unfreezeWallet = useMutation(api.modules.ewallet.mutations.unfreezeWallet);

    const handleTopUp = async () => {
        if (!sessionToken || !selectedWallet) return;
        const amountCents = Math.round(Number(topUpAmount) * 100);
        if (!amountCents || amountCents <= 0) {
            toast({
                title: "Invalid amount",
                description: "Enter a positive amount to top up.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await adminTopUp({
                sessionToken,
                targetOwnerId: selectedWallet.ownerId,
                targetOwnerType: selectedWallet.ownerType,
                amountCents,
                note: topUpNote.trim() || "Admin wallet top-up",
                currency: selectedWallet.currency,
            });
            toast({
                title: "Wallet topped up",
                description: `${selectedWallet.ownerId} received ${(amountCents / 100).toFixed(2)} ${selectedWallet.currency}.`,
            });
            setSelectedWallet(null);
            setTopUpAmount("");
            setTopUpNote("");
        } catch (error) {
            toast({
                title: "Top-up failed",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdjustment = async () => {
        if (!sessionToken || !selectedAdjustmentWallet) return;
        const amountCents = Math.round(Number(adjustmentAmount) * 100);
        if (!amountCents) {
            toast({
                title: "Invalid amount",
                description: "Enter a positive or negative amount for the adjustment.",
                variant: "destructive",
            });
            return;
        }
        if (!adjustmentNote.trim()) {
            toast({
                title: "Reason required",
                description: "Add a short reason for this wallet adjustment.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await adminAdjustWallet({
                sessionToken,
                targetOwnerId: selectedAdjustmentWallet.ownerId,
                targetOwnerType: selectedAdjustmentWallet.ownerType,
                amountCents,
                note: adjustmentNote.trim(),
                currency: selectedAdjustmentWallet.currency,
            });
            toast({
                title: "Wallet adjusted",
                description: `${selectedAdjustmentWallet.ownerId} balance was ${amountCents > 0 ? "credited" : "debited"} by ${(Math.abs(amountCents) / 100).toFixed(2)} ${selectedAdjustmentWallet.currency}.`,
            });
            setSelectedAdjustmentWallet(null);
            setAdjustmentAmount("");
            setAdjustmentNote("");
        } catch (error) {
            toast({
                title: "Adjustment failed",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFreeze = async (wallet: WalletSummary) => {
        if (!sessionToken) return;
        try {
            await freezeWallet({
                sessionToken,
                ownerId: wallet.ownerId,
                reason: "Frozen by school admin from wallet management",
            });
            toast({
                title: "Wallet frozen",
                description: `${wallet.ownerId} can no longer transact until the wallet is reopened.`,
            });
        } catch (error) {
            toast({
                title: "Freeze failed",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleUnfreeze = async (wallet: WalletSummary) => {
        if (!sessionToken) return;
        try {
            await unfreezeWallet({
                sessionToken,
                ownerId: wallet.ownerId,
            });
            toast({
                title: "Wallet reopened",
                description: `${wallet.ownerId} can transact again.`,
            });
        } catch (error) {
            toast({
                title: "Unable to reopen wallet",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const walletList = wallets ?? [];
    const summary = useMemo(() => ({
        active: walletList.filter((wallet) => !wallet.frozen).length,
        frozen: walletList.filter((wallet) => wallet.frozen).length,
        totalBalanceCents: walletList.reduce((sum, wallet) => sum + wallet.balanceCents, 0),
    }), [walletList]);

    const columns: Column<WalletSummary>[] = [
        {
            key: "ownerId",
            header: "Owner",
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.ownerId}</p>
                    <p className="text-sm capitalize text-muted-foreground">{row.ownerType}</p>
                </div>
            ),
            sortable: true,
        },
        {
            key: "balanceCents",
            header: "Balance",
            cell: (row) => `${row.currency} ${(row.balanceCents / 100).toFixed(2)}`,
            sortable: true,
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => (
                <Badge variant={row.frozen ? "destructive" : "default"}>
                    {row.frozen ? "Frozen" : "Active"}
                </Badge>
            ),
        },
        {
            key: "updatedAt",
            header: "Last Activity",
            cell: (row) => new Date(row.updatedAt).toLocaleDateString(),
            sortable: true,
        },
        {
            key: "actions",
            header: "",
            cell: (row) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedWallet(row)}>
                        Top Up
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedAdjustmentWallet(row)}>
                        Adjust
                    </Button>
                    {row.frozen ? (
                        <Button size="sm" variant="ghost" onClick={() => handleUnfreeze(row)}>
                            Unfreeze
                        </Button>
                    ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleFreeze(row)}>
                            Freeze
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Wallets"
                description={`Review balances across ${walletList.length} wallets. ${summary.active} active, ${summary.frozen} frozen, total balance KES ${(summary.totalBalanceCents / 100).toFixed(2)}.`}
            />

            <DataTable
                data={walletList}
                columns={columns}
                searchable
                searchPlaceholder="Search by owner ID or type..."
                searchKey={(row) => `${row.ownerId} ${row.ownerType}`}
                emptyTitle="No wallets found"
                emptyDescription="Wallet accounts will appear here once users transact."
            />

            <Dialog open={!!selectedWallet} onOpenChange={(open) => !open && setSelectedWallet(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Admin Wallet Top-up</DialogTitle>
                    </DialogHeader>
                    {selectedWallet && (
                        <div className="space-y-4">
                            <div className="rounded-lg border p-3 text-sm">
                                <p className="font-medium">{selectedWallet.ownerId}</p>
                                <p className="text-muted-foreground">
                                    Current balance: {selectedWallet.currency} {(selectedWallet.balanceCents / 100).toFixed(2)}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={topUpAmount}
                                    onChange={(event) => setTopUpAmount(event.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="note">Note</Label>
                                <Input
                                    id="note"
                                    value={topUpNote}
                                    onChange={(event) => setTopUpNote(event.target.value)}
                                    placeholder="Reason for adjustment"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setSelectedWallet(null)}>
                                    Cancel
                                </Button>
                                <Button type="button" onClick={handleTopUp} disabled={isSubmitting}>
                                    {isSubmitting ? "Applying..." : "Apply top-up"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedAdjustmentWallet} onOpenChange={(open) => !open && setSelectedAdjustmentWallet(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Admin Wallet Adjustment</DialogTitle>
                    </DialogHeader>
                    {selectedAdjustmentWallet && (
                        <div className="space-y-4">
                            <div className="rounded-lg border p-3 text-sm">
                                <p className="font-medium">{selectedAdjustmentWallet.ownerId}</p>
                                <p className="text-muted-foreground">
                                    Current balance: {selectedAdjustmentWallet.currency} {(selectedAdjustmentWallet.balanceCents / 100).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Use a positive amount to credit funds or a negative amount to debit funds.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adjustment-amount">Signed Amount</Label>
                                <Input
                                    id="adjustment-amount"
                                    type="number"
                                    step="0.01"
                                    value={adjustmentAmount}
                                    onChange={(event) => setAdjustmentAmount(event.target.value)}
                                    placeholder="-500 or 1000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adjustment-note">Reason</Label>
                                <Input
                                    id="adjustment-note"
                                    value={adjustmentNote}
                                    onChange={(event) => setAdjustmentNote(event.target.value)}
                                    placeholder="Explain why this balance changed"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setSelectedAdjustmentWallet(null)}>
                                    Cancel
                                </Button>
                                <Button type="button" onClick={handleAdjustment} disabled={isSubmitting}>
                                    {isSubmitting ? "Applying..." : "Apply adjustment"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
