"use client";

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

const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    top_up: "default",
    spend: "destructive",
    refund: "secondary",
    transfer: "outline",
};

export default function TransactionsPage() {
    const { isLoading, sessionToken } = useAuth();

    const transactions = useQuery(
        api.modules.ewallet.queries.listWalletTransactions,
        sessionToken ? { sessionToken } : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<WalletTransaction>[] = [
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

            <DataTable
                data={(transactions as WalletTransaction[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search by wallet ID or reference..."
                searchKey={(row) => `${row.walletId} ${row.reference ?? ""} ${row.orderId ?? ""}`}
                emptyTitle="No transactions found"
                emptyDescription="Wallet transactions will appear here once activity begins."
            />
        </div>
    );
}
