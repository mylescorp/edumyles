"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";

type Student = {
    _id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    gender: string;
    status: string;
    classId?: string;
    dateOfBirth: string;
    createdAt: number;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    graduated: "secondary",
    suspended: "destructive",
    transferred: "outline",
};

export default function StudentsPage() {
    const { isLoading, sessionToken } = useAuth();
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const {
        results: students,
        status: studentsStatus,
        loadMore,
    } = usePaginatedQuery(
        api.modules.sis.queries.listStudentsPaginated,
        sessionToken
            ? { sessionToken, status: statusFilter === "all" ? undefined : statusFilter }
            : "skip",
        { initialNumItems: 50 }
    );

    const classes = useQuery(
        api.modules.sis.queries.listClasses,
        sessionToken ? { sessionToken } : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const classMap = new Map((classes as any[])?.map((c) => [c._id, c.name]) ?? []);

    const columns: Column<Student>[] = [
        {
            key: "admissionNumber",
            header: "Adm. No.",
            cell: (row) => (
                <Link href={`/admin/students/${row._id}`} className="font-medium text-primary hover:underline">
                    {row.admissionNumber}
                </Link>
            ),
            sortable: true,
        },
        {
            key: "name",
            header: "Name",
            cell: (row) => `${row.firstName} ${row.lastName}`,
            sortable: true,
        },
        {
            key: "gender",
            header: "Gender",
            cell: (row) => row.gender,
        },
        {
            key: "class",
            header: "Class",
            cell: (row) => (row.classId ? classMap.get(row.classId) ?? "—" : "—"),
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
            key: "actions",
            header: "",
            cell: (row) => (
                <Link href={`/admin/students/${row._id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                </Link>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Students"
                description="Manage student records"
                actions={
                    <Link href="/admin/students/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Enroll Student
                        </Button>
                    </Link>
                }
            />

            <div className="mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="graduated">Graduated</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                data={(students as Student[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search by name or admission number..."
                searchKey={(row) => `${row.firstName} ${row.lastName} ${row.admissionNumber}`}
                emptyTitle="No students found"
                emptyDescription="Enroll your first student to get started."
                serverPagination={{
                    isDone: studentsStatus === "Exhausted",
                    loadMore: (n) => loadMore(n),
                    isLoading: studentsStatus === "LoadingMore",
                }}
            />
        </div>
    );
}
