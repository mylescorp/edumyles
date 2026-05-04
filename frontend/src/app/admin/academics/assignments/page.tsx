"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

type AssignmentRow = {
  _id: string;
  title: string;
  className?: string;
  subject?: string;
  teacher?: string;
  dueDate: string;
  status: string;
  submissionCount?: number;
  pendingSubmissions?: number;
};

function formatDueDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function AdminAssignmentsPage() {
  const { isLoading, sessionToken } = useAuth();
  const assignments = useQuery(
    (api as any)["modules/academics/assignments"].listAssignments,
    sessionToken ? { sessionToken, limit: 100 } : "skip"
  ) as AssignmentRow[] | undefined;

  const rows = assignments ?? [];

  const columns: Column<AssignmentRow>[] = [
    {
      key: "title",
      header: "Assignment",
      sortable: true,
      cell: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: "className",
      header: "Class",
      sortable: true,
      cell: (row) => row.className ?? "N/A",
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      cell: (row) => row.subject ?? "N/A",
    },
    {
      key: "dueDate",
      header: "Due",
      sortable: true,
      cell: (row) => formatDueDate(row.dueDate),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "active" ? "default" : "outline"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "submissionCount",
      header: "Submissions",
      cell: (row) => {
        const submitted = row.submissionCount ?? 0;
        const pending = row.pendingSubmissions ?? 0;
        return `${submitted} submitted${pending > 0 ? `, ${pending} pending` : ""}`;
      },
    },
  ];

  if (isLoading || assignments === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Review class assignments and submission progress."
        actions={
          <Button asChild>
            <Link href="/admin/academics/assignments/create">Create Assignment</Link>
          </Button>
        }
      />

      <DataTable
        data={rows}
        columns={columns}
        searchable
        searchPlaceholder="Search assignments..."
        searchKey={(row) =>
          `${row.title} ${row.className ?? ""} ${row.subject ?? ""} ${row.status}`
        }
        emptyTitle="No assignments yet"
        emptyDescription="Assignments created for classes will appear here."
      />
    </div>
  );
}
