"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";

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
    _id: string;
    ownerId: string;
    ownerType: string;
    frozen?: boolean;
};

const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    top_up: "default",
    spend: "destructive",
    refund: "secondary",
    transfer: "outline",
};

export default function TransactionsPage() {
    const { isLoading, sessionToken } = useAuth();
    const [typeFilter, setTypeFilter] = useState("all");

    const transactions = useQuery(
        api.modules.ewallet.queries.listWalletTransactions,
        sessionToken ? { sessionToken } : "skip"
    );
    const wallets = useQuery(
        api.modules.ewallet.queries.listAllWallets,
        sessionToken ? { sessionToken, limit: 250 } : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const walletMap = new Map(((wallets as WalletSummary[]) ?? []).map((wallet) => [wallet._id, wallet]));
    const filteredTransactions = useMemo(() => {
        const allTransactions = (transactions as WalletTransaction[]) ?? [];
        if (typeFilter === "all") return allTransactions;
        if (typeFilter === "credit") {
            return allTransactions.filter((tx) => tx.amountCents > 0);
        }
        if (typeFilter === "debit") {
            return allTransactions.filter((tx) => tx.amountCents < 0);
        }
        return allTransactions.filter((tx) => tx.type === typeFilter);
    }, [transactions, typeFilter]);

    const columns: Column<WalletTransaction>[] = [
        {
            key: "owner",
            header: "Owner",
            cell: (row) => {
                const wallet = walletMap.get(row.walletId);
                return wallet ? (
                    <div>
                        <p className="font-medium">{wallet.ownerId}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                            {wallet.ownerType}
                            {wallet.frozen ? " • frozen" : ""}
                        </p>
                    </div>
                ) : (
                    <span className="text-muted-foreground">Unknown wallet owner</span>
                );
            },
        },
        {
            key: "walletId",
            header: "Wallet ID",
            cell: (row) => (
                <span className="font-mono text-sm">{row.walletId.slice(0, 16)}…</span>
            ),
        },
        {
            key: "type",
            header: "Type",
            cell: (row) => (
                <Badge variant={typeColors[row.type] ?? "outline"}>
                    {row.type.replace("_", " ")}
                </Badge>
            ),
        },
        {
            key: "amountCents",
            header: "Amount",
            cell: (row) => {
                const amount = row.amountCents / 100;
                const isCredit = amount >= 0;
                return (
                    <span className={isCredit ? "text-green-600 dark:text-green-400" : "text-destructive"}>
                        {isCredit ? "+" : ""}KES {amount.toFixed(2)}
                    </span>
                );
            },
            sortable: true,
        },
        {
            key: "reference",
            header: "Reference",
            cell: (row) => row.reference ?? <span className="text-muted-foreground">—</span>,
        },
        {
            key: "orderId",
            header: "Order ID",
            cell: (row) => row.orderId ? (
                <span className="font-mono text-sm">{row.orderId.slice(0, 12)}…</span>
            ) : (
                <span className="text-muted-foreground">—</span>
            ),
        },
        {
            key: "createdAt",
            header: "Date",
            cell: (row) => new Date(row.createdAt).toLocaleDateString(),
            sortable: true,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Wallet Transactions"
                description="Track credits, debits, transfers, and payment activity"
            />

            <div className="mb-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Filter by transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All transactions</SelectItem>
                        <SelectItem value="credit">Credits only</SelectItem>
                        <SelectItem value="debit">Debits only</SelectItem>
                        <SelectItem value="admin_top_up">Admin top-ups</SelectItem>
                        <SelectItem value="transfer_in">Transfer in</SelectItem>
                        <SelectItem value="transfer_out">Transfer out</SelectItem>
                        <SelectItem value="withdrawal">Withdrawals</SelectItem>
                        <SelectItem value="spend">Spend</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                data={filteredTransactions}
                columns={columns}
                searchable
                searchPlaceholder="Search by owner, wallet ID, or reference..."
                searchKey={(row) => {
                    const wallet = walletMap.get(row.walletId);
                    return `${wallet?.ownerId ?? ""} ${wallet?.ownerType ?? ""} ${row.walletId} ${row.reference ?? ""} ${row.orderId ?? ""}`;
                }}
                emptyTitle="No transactions found"
                emptyDescription="Wallet transactions will appear here once activity begins."
            />
        </div>
    );
}
