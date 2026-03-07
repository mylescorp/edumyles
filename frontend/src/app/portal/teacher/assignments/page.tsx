"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText, ChevronRight } from "lucide-react";

type Assignment = {
  _id: string;
  title: string;
  className: string;
  dueDate: number;
  type: string;
  maxScore: number;
};

export default function AssignmentsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const classes = useQuery(api.modules.academics.queries.getTeacherClasses, {});

  const assignments = useQuery(
    api.modules.academics.queries.getAssignments,
    classes?.[0]?._id ? { tenantId: user?.tenantId || "", classId: classes[0]._id } : "skip"
  );

  if (authLoading || classes === undefined || assignments === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const columns: Column<Assignment>[] = [
    {
      key: "title",
      header: "Title",
      cell: (row) => row.title,
    },
    {
      key: "className",
      header: "Class",
      cell: (row) => row.className,
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (row) => new Date(row.dueDate).toLocaleDateString(),
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => row.type,
    },
    {
      key: "maxScore",
      header: "Max Score",
      cell: (row) => row.maxScore.toString(),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/portal/teacher/assignments/${row._id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Manage your class assignments"
        breadcrumbs={[
          { label: "Teacher Portal", href: "/portal/teacher" },
          { label: "Assignments" },
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Your Assignments</h3>
          <p className="text-sm text-muted-foreground">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/teacher/assignments/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Link>
        </Button>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
          <p className="text-muted-foreground mb-4">Create your first assignment to get started</p>
          <Button asChild>
            <Link href="/portal/teacher/assignments/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Link>
          </Button>
        </div>
      ) : (
        <DataTable data={assignments} columns={columns} searchKey={(row) => row.title} />
      )}
    </div>
  );
}
