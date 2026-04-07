"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";

type Application = {
    _id: string;
    applicationId: string;
    firstName: string;
    lastName: string;
    requestedGrade: string;
    guardianName: string;
    guardianPhone: string;
    status: string;
    createdAt: number;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    submitted: "default",
    under_review: "secondary",
    accepted: "default",
    rejected: "destructive",
    waitlisted: "outline",
    enrolled: "secondary",
};

export default function AdmissionsPage() {
    const { isLoading, sessionToken } = useAuth();
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const applicationsResult = useQuery(
        api.modules.admissions.queries.listApplications,
        sessionToken
            ? { sessionToken, status: statusFilter === "all" ? undefined : statusFilter }
            : "skip"
    );
    const applications = applicationsResult?.data;

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<Application>[] = [
        {
            key: "applicationId",
            header: "Application ID",
            cell: (row) => (
                <Link href={`/admin/admissions/${row._id}`} className="font-medium text-primary hover:underline">
                    {row.applicationId}
                </Link>
            ),
        },
        {
            key: "name",
            header: "Applicant Name",
            cell: (row) => `${row.firstName} ${row.lastName}`,
            sortable: true,
        },
        {
            key: "grade",
            header: "Requested Grade",
            cell: (row) => row.requestedGrade,
        },
        {
            key: "guardian",
            header: "Guardian",
            cell: (row) => row.guardianName,
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => (
                <Badge variant={statusColors[row.status] ?? "outline"}>
                    {row.status.replace("_", " ")}
                </Badge>
            ),
        },
        {
            key: "date",
            header: "Date",
            cell: (row) => new Date(row.createdAt).toLocaleDateString(),
            sortable: true,
        },
        {
            key: "actions",
            header: "",
            cell: (row) => (
                <Link href={`/admin/admissions/${row._id}`}>
                    <Button variant="ghost" size="sm">Review</Button>
                </Link>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Admissions"
                description="Manage student admission applications"
            />

            <div className="mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Applications</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="waitlisted">Waitlisted</SelectItem>
                        <SelectItem value="enrolled">Enrolled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                data={applications ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search by name or application ID..."
                searchKey={(row) => `${row.firstName} ${row.lastName} ${row.applicationId}`}
                emptyTitle="No applications found"
                emptyDescription="Admission applications will appear here when submitted."
            />
        </div>
    );
}
