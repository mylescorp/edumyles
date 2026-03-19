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

type Invoice = {
    _id: string;
    studentId: string;
    amount: number;
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

    const invoices = usePlatformQuery(
        api.modules.finance.queries.listInvoices,
        sessionToken
            ? (statusFilter === "all" ? { sessionToken } : { sessionToken, status: statusFilter as any })
            : "skip",
        !!sessionToken
    );

    const students = usePlatformQuery(api.modules.sis.queries.listStudents, sessionToken ? { sessionToken } : "skip", !!sessionToken);

    if (isLoading) return <LoadingSkeleton variant="page" />;

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

            <DataTable
                data={(invoices as Invoice[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search invoices..."
                emptyTitle="No invoices found"
                emptyDescription="Generate invoices for students to see them here."
            />
        </div>
    );
}
