"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText, ChevronRight } from "lucide-react";

export default function AssignmentsPage() {
    const { user, isLoading: authLoading } = useAuth();

    const classes = useQuery(
        api.modules.academics.queries.getTeacherClasses,
        {}
    );

    // In a real implementation, we might want a cross-class assignment query for the teacher.
    // For now, we'll suggest selecting a class or show a list from a new teacher assignments query if it existed.
    // Let's assume we implement a simple list for the first class for now or show an empty state.

    const assignments = useQuery(
        api.modules.academics.queries.getAssignments,
        classes?.[0]?._id ? { classId: classes[0]._id } : "skip"
    );

    if (authLoading || classes === undefined) return <LoadingSkeleton variant="page" />;

    const columns = [
        { header: "Title", accessorKey: "title" },
        { header: "Due Date", accessorKey: "dueDate" },
        { header: "Max Points", accessorKey: "maxPoints" },
        { header: "Status", accessorKey: "status" },
        {
            header: "Actions",
            id: "actions",
            cell: (row: any) => (
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/portal/teacher/assignments/${row._id}`}>
                        Submissions
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Assignments"
                    description="Create and manage student assessments."
                />
                <Button asChild>
                    <Link href="/portal/teacher/assignments/create">
                        <Plus className="mr-2 h-4 w-4" />
                        New Assignment
                    </Link>
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={assignments || []}
                searchKey="title"
            />
        </div>
    );
}
