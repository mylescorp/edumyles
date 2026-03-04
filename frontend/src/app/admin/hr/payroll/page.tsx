"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";

type PayrollRun = {
    _id: string;
    periodLabel: string;
    startDate: string;
    endDate: string;
    status: string;
    createdAt: number;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    pending: "secondary",
    approved: "default",
    completed: "default",
    cancelled: "destructive",
};

export default function PayrollPage() {
    const { isLoading, sessionToken } = useAuth();

    const payrollRuns = useQuery(
        api.modules.hr.queries.listPayrollRuns,
        sessionToken ? {} : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<PayrollRun>[] = [
        {
            key: "periodLabel",
            header: "Period",
            sortable: true,
        },
        {
            key: "dates",
            header: "Dates",
            cell: (row) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => (
                <Badge variant={statusColors[row.status] ?? "outline"}>
                    {row.status}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Created",
            cell: (row) => formatDate(row.createdAt),
            sortable: true,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Payroll Runs"
                description="Manage monthly staff payroll"
                actions={
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Payroll Run
                    </Button>
                }
            />

            <DataTable
                data={(payrollRuns as PayrollRun[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search periods..."
                emptyTitle="No payroll runs found"
                emptyDescription="Start your first payroll run to process staff salaries."
            />
        </div>
    );
}
