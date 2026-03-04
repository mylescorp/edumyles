"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";

type LeaveRequest = {
    _id: string;
    staffId: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    status: string;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    approved: "default",
    rejected: "destructive",
    cancelled: "secondary",
};

export default function LeaveRequestsPage() {
    const { isLoading, sessionToken } = useAuth();

    const leaveRequests = useQuery(
        api.modules.hr.queries.listLeave,
        sessionToken ? {} : "skip"
    );

    const staff = useQuery(
        api.modules.hr.queries.listStaff,
        sessionToken ? {} : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const staffMap = new Map(staff?.map((s) => [s._id, `${s.firstName} ${s.lastName}`]) ?? []);

    const columns: Column<LeaveRequest>[] = [
        {
            key: "staffName",
            header: "Staff Member",
            cell: (row: LeaveRequest) => staffMap.get(row.staffId) ?? "Loading...",
            sortable: true,
        },
        {
            key: "type",
            header: "Leave Type",
            cell: (row: LeaveRequest) => row.type.replace("_", " "),
            sortable: true,
        },
        {
            key: "dates",
            header: "Dates",
            cell: (row: LeaveRequest) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
        },
        {
            key: "days",
            header: "Days",
            cell: (row: LeaveRequest) => row.days,
        },
        {
            key: "status",
            header: "Status",
            cell: (row: LeaveRequest) => (
                <Badge variant={statusColors[row.status] ?? "outline"}>
                    {row.status}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Leave Requests"
                description="Review and manage staff leave applications"
            />

            <DataTable
                data={(leaveRequests as LeaveRequest[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search by staff name or type..."
                emptyTitle="No leave requests found"
                emptyDescription="Staff leave requests will appear here for review."
            />
        </div>
    );
}
