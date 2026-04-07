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

type ExamRow = {
  _id: string;
  name: string;
  className: string;
  date: string;
  status: string;
  submissions: number;
  total: number;
};

export default function AdminExamsPage() {
  const { isLoading, sessionToken } = useAuth();
  const exams = useQuery(
    api.modules.academics.queries.getRecentExams,
    sessionToken ? { sessionToken, limit: 50 } : "skip"
  );

  if (isLoading || exams === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const columns: Column<ExamRow>[] = [
    { key: "name", header: "Exam", sortable: true, cell: (row) => row.name },
    { key: "className", header: "Class", sortable: true, cell: (row) => row.className || "N/A" },
    { key: "date", header: "Date", sortable: true, cell: (row) => row.date },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={row.status === "completed" ? "default" : "outline"}>{row.status}</Badge>,
    },
    { key: "submissions", header: "Submissions", cell: (row) => `${row.submissions}/${row.total}` },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/academics/exams/${row._id}`}>Manage</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examinations"
        description="Review scheduled and completed exams"
        actions={
          <Button asChild>
            <Link href="/admin/academics/exams/create">Schedule Exam</Link>
          </Button>
        }
      />

      <DataTable
        data={exams.data || []}
        columns={columns}
        searchable
        searchPlaceholder="Search exams..."
        searchKey={(row) => `${row.name} ${row.className} ${row.status}`}
        emptyTitle="No examinations yet"
        emptyDescription="Scheduled exams will appear here."
      />
    </div>
  );
}
