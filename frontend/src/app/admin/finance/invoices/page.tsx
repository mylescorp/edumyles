"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Invoice = {
    _id: string;
    studentId: string;
    amount: number;
    amountPaid: number;
    balance: number;
    status: string;
    dueDate: string;
    issuedAt: string;
    studentName?: string;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    paid: "default",
    partially_paid: "secondary",
    cancelled: "destructive",
};

export default function InvoicesPage() {
    const { isLoading, sessionToken } = useAuth();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [verifyingTransferId, setVerifyingTransferId] = useState<string | null>(null);
    const router = useRouter();

    const invoices = usePlatformQuery(
        api.modules.finance.queries.listInvoices,
        sessionToken
            ? (statusFilter === "all" ? { sessionToken } : { sessionToken, status: statusFilter as any })
            : "skip",
        !!sessionToken
    );

    const students = usePlatformQuery(api.modules.sis.queries.listStudents, sessionToken ? { sessionToken } : "skip", !!sessionToken);
    const pendingBankTransfers = usePlatformQuery(
        api.modules.finance.queries.listPendingBankTransfers,
        sessionToken ? { sessionToken } : "skip",
        !!sessionToken
    ) as
        | Array<{
            _id: string;
            externalId: string;
            amount?: number;
            createdAt: number;
            dueDate?: string | null;
            studentName: string;
            invoiceAmount: number;
            invoiceStatus: string;
          }>
        | undefined;

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const verifyBankTransfer = async (callbackId: string) => {
        setVerifyingTransferId(callbackId);
        try {
            const res = await fetch("/api/payments/bank-transfer/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callbackId }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload.error ?? "Unable to verify bank transfer");
            }

            toast({
                title: "Bank transfer verified",
                description: "The payment has been posted to the invoice ledger.",
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Verification failed",
                description: error instanceof Error ? error.message : "Unable to verify bank transfer.",
                variant: "destructive",
            });
        } finally {
            setVerifyingTransferId(null);
        }
    };

    // Create a map for quick access
    const studentMap = new Map((students as any[])?.map((s) => [s._id, `${s.firstName} ${s.lastName}`]) ?? []);

    const columns: Column<Invoice>[] = [
        {
            key: "_id",
            header: "ID",
            cell: (row: Invoice) => row._id.slice(-6).toUpperCase(),
        },
        {
            key: "studentName",
            header: "Student",
            // Cast studentId to any to match the map key type if necessary, or ensure map key type is Id<"students">
            cell: (row: Invoice) => studentMap.get(row.studentId as any) ?? "Loading...",
            sortable: true,
        },
        {
            key: "amount",
            header: "Amount",
            cell: (row: Invoice) => formatCurrency(row.amount),
            sortable: true,
        },
        {
            key: "amountPaid",
            header: "Paid",
            cell: (row: Invoice) => formatCurrency(row.amountPaid),
            sortable: true,
        },
        {
            key: "balance",
            header: "Balance",
            cell: (row: Invoice) => formatCurrency(row.balance),
            sortable: true,
        },
        {
            key: "dueDate",
            header: "Due Date",
            cell: (row: Invoice) => formatDate(row.dueDate),
            sortable: true,
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Invoice) => (
                <Badge variant={statusColors[row.status] ?? "outline"}>
                    {row.status.replace("_", " ")}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "",
            cell: (row: Invoice) => (
                <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/finance/invoices/${row._id}`}>View</Link>
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Invoices"
                description="View and manage student invoices"
            />

            <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Invoices</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {pendingBankTransfers !== undefined && pendingBankTransfers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Bank Transfers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {pendingBankTransfers.map((transfer) => (
                            <div
                                key={transfer._id}
                                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{transfer.studentName}</p>
                                        <Badge variant="secondary">Awaiting verification</Badge>
                                        <Badge variant="outline">
                                            {transfer.invoiceStatus.replace("_", " ")}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Ref {transfer.externalId} • Expected {formatCurrency(transfer.amount ?? transfer.invoiceAmount)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Submitted {formatDate(transfer.createdAt)}
                                        {transfer.dueDate ? ` • Invoice due ${formatDate(transfer.dueDate)}` : ""}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => verifyBankTransfer(transfer._id)}
                                    disabled={verifyingTransferId === transfer._id}
                                >
                                    {verifyingTransferId === transfer._id ? "Verifying..." : "Verify Payment"}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <DataTable
                data={(invoices as Invoice[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search invoices..."
                searchKey={(row) =>
                    [row._id, studentMap.get(row.studentId as any) ?? "", row.status]
                        .join(" ")
                        .toLowerCase()
                }
                emptyTitle="No invoices found"
                emptyDescription="Generate invoices for students to see them here."
            />
        </div>
    );
}
