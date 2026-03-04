"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Wallet, History, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Wallet = {
    _id: string;
    ownerId: string;
    ownerType: string;
    balanceCents: number;
    currency: string;
};

type Transaction = {
    _id: string;
    walletId: string;
    type: string;
    amountCents: number;
    reference?: string;
    createdAt: number;
};

export default function EWalletPage() {
    const { isLoading, sessionToken } = useAuth();

    const transactions = useQuery(
        api.modules.ewallet.queries.listWalletTransactions,
        sessionToken ? {} : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const transactionColumns: Column<Transaction>[] = [
        {
            key: "type",
            header: "Type",
            cell: (row: Transaction) => (
                <div className="flex items-center gap-2">
                    {row.type === "credit" || row.type === "topup" ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                    )}
                    <span className="capitalize">{row.type}</span>
                </div>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            cell: (row: Transaction) => (
                <span className={row.type === "credit" || row.type === "topup" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {row.type === "credit" || row.type === "topup" ? "+" : "-"}
                    {formatCurrency(row.amountCents)}
                </span>
            ),
            sortable: true,
        },
        {
            key: "reference",
            header: "Reference",
            cell: (row: Transaction) => row.reference ?? "—",
        },
        {
            key: "createdAt",
            header: "Date & Time",
            cell: (row: Transaction) => formatDateTime(row.createdAt),
            sortable: true,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="eWallet Management"
                description="Monitor digital wallets and transactions"
            />

            <Tabs defaultValue="transactions">
                <TabsList className="mb-4">
                    <TabsTrigger value="transactions" className="gap-2">
                        <History className="h-4 w-4" />
                        All Transactions
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="transactions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={(transactions as Transaction[]) ?? []}
                                columns={transactionColumns}
                                searchable
                                searchPlaceholder="Search by reference or type..."
                                emptyTitle="No transactions found"
                                emptyDescription="Wallet transactions will appear here as they occur."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
