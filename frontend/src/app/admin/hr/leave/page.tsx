"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

type LeaveRequest = {
    _id: Id<"staffLeave">;
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
    const { toast } = useToast();
    const [statusFilter, setStatusFilter] = useState("all");

    const leaveRequests = useQuery(
        api.modules.hr.queries.listLeave,
        sessionToken ? { sessionToken, status: statusFilter === "all" ? undefined : statusFilter } : "skip"
    );

    const staff = useQuery(
        api.modules.hr.queries.listStaff,
        sessionToken ? { sessionToken } : "skip"
    );

    const approveLeaveRequest = useMutation(api.modules.hr.mutations.approveLeaveRequest);
    const cancelLeaveRequest = useMutation(api.modules.hr.mutations.cancelLeaveRequest);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const staffMap = new Map((staff as any[])?.map((s) => [s._id, `${s.firstName} ${s.lastName}`]) ?? []);

    const handleDecision = async (leaveId: Id<"staffLeave">, approved: boolean) => {
        try {
            await approveLeaveRequest({ leaveId, approved });
            toast({
                title: approved ? "Leave approved" : "Leave rejected",
                description: "The leave request has been updated.",
            });
        } catch (error) {
            toast({
                title: "Unable to update leave request",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleCancel = async (leaveId: Id<"staffLeave">) => {
        try {
            await cancelLeaveRequest({ leaveId });
            toast({
                title: "Leave cancelled",
                description: "The leave request has been cancelled and closed.",
            });
        } catch (error) {
            toast({
                title: "Unable to cancel leave request",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        }
    };

    const columns: Column<LeaveRequest>[] = [
        {
            key: "staffName",
            header: "Staff Member",
            cell: (row: LeaveRequest) => staffMap.get(row.staffId as any) ?? "Loading...",
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
        {
            key: "actions",
            header: "",
            cell: (row: LeaveRequest) => {
                if (row.status === "pending") {
                    return (
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleDecision(row._id, true)}>
                                Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDecision(row._id, false)}>
                                Reject
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleCancel(row._id)}>
                                Cancel
                            </Button>
                        </div>
                    );
                }
                if (row.status === "approved") {
                    return (
                        <Button size="sm" variant="ghost" onClick={() => handleCancel(row._id)}>
                            Cancel
                        </Button>
                    );
                }
                return <span className="text-sm text-muted-foreground">Reviewed</span>;
            },
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Leave Requests"
                description="Review and manage staff leave applications"
            />

            <div className="max-w-xs">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Requests</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                data={(leaveRequests as LeaveRequest[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search by staff name or type..."
                searchKey={(row) => `${staffMap.get(row.staffId as any) ?? ""} ${row.type} ${row.status}`}
                emptyTitle="No leave requests found"
                emptyDescription="Staff leave requests will appear here for review."
            />
        </div>
    );
}
