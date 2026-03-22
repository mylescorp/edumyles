"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";

type WalletTransaction = {
    _id: string;
    tenantId: string;
    walletId: string;
    type: string;
    amountCents: number;
    reference?: string;
    orderId?: string;
    createdAt: number;
};

type WalletSummary = {
    walletId: string;
    tenantId: string;
    balanceCents: number;
    transactionCount: number;
    lastActivity: number;
};

export default function WalletsPage() {
    const { isLoading, sessionToken } = useAuth();

    const transactions = useQuery(
        api.modules.ewallet.queries.listWalletTransactions,
        sessionToken ? { sessionToken } : "skip"
    );

    const wallets = useMemo<WalletSummary[]>(() => {
        if (!transactions) return [];
        const map = new Map<string, WalletSummary>();
        for (const tx of transactions as WalletTransaction[]) {
            const existing = map.get(tx.walletId);
            if (existing) {
                existing.balanceCents += tx.amountCents;
                existing.transactionCount += 1;
                if (tx.createdAt > existing.lastActivity) {
                    existing.lastActivity = tx.createdAt;
                }
            } else {
                map.set(tx.walletId, {
                    walletId: tx.walletId,
                    tenantId: tx.tenantId,
                    balanceCents: tx.amountCents,
                    transactionCount: 1,
                    lastActivity: tx.createdAt,
                });
            }
        }
        return Array.from(map.values());
    }, [transactions]);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<WalletSummary>[] = [
        {
            key: "walletId",
            header: "Wallet ID",
            cell: (row) => (
                <span className="font-mono text-sm">{row.walletId.slice(0, 16)}…</span>
            ),
        },
        {
            key: "balanceCents",
            header: "Balance",
            cell: (row) => {
                const amount = row.balanceCents / 100;
                return (
                    <span className={amount < 0 ? "text-destructive" : "text-foreground"}>
                        KES {amount.toFixed(2)}
                    </span>
                );
            },
            sortable: true,
        },
        {
            key: "transactionCount",
            header: "Transactions",
            cell: (row) => (
                <Badge variant="outline">{row.transactionCount}</Badge>
            ),
            sortable: true,
        },
        {
            key: "lastActivity",
            header: "Last Activity",
            cell: (row) => new Date(row.lastActivity).toLocaleDateString(),
            sortable: true,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Wallets"
                description="Review wallet balances, statuses, and user accounts"
            />

            <DataTable
                data={wallets}
                columns={columns}
                searchable
                searchPlaceholder="Search by wallet ID..."
                searchKey={(row) => row.walletId}
                emptyTitle="No wallets found"
                emptyDescription="Wallet accounts will appear here once users transact."
            />
        </div>
    );
}
