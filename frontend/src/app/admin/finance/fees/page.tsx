"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCurrency } from "@/lib/formatters";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type FeeStructure = {
    _id: string;
    name: string;
    amount: number;
    academicYear: string;
    grade: string;
    frequency: string;
};

export default function FeeStructuresPage() {
    const { isLoading, sessionToken } = useAuth();

    const feeStructures = useQuery(
        api.modules.finance.queries.listFeeStructures,
        sessionToken ? {} : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<FeeStructure>[] = [
        {
            key: "name",
            header: "Fee Name",
            sortable: true,
        },
        {
            key: "amount",
            header: "Amount",
            cell: (row: FeeStructure) => formatCurrency(row.amount),
            sortable: true,
        },
        {
            key: "grade",
            header: "Target Grade",
            sortable: true,
        },
        {
            key: "academicYear",
            header: "Academic Year",
            sortable: true,
        },
        {
            key: "frequency",
            header: "Frequency",
            cell: (row: FeeStructure) => row.frequency.replace("_", " "),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Fee Structures"
                description="Manage academic year fee structures"
                actions={
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Fee Structure
                    </Button>
                }
            />

            <DataTable
                data={(feeStructures as FeeStructure[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search fee structures"
                emptyTitle="No fee structures found"
                emptyDescription="Create your first fee structure to start generating invoices."
            />
        </div>
    );
}
