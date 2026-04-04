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

type StaffRow = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role: string;
  status: string;
};

export default function HRPerformancePage() {
  const { isLoading, sessionToken } = useAuth();
  const staff = useQuery(
    api.modules.hr.queries.listStaff,
    sessionToken ? { sessionToken } : "skip"
  ) as StaffRow[] | undefined;

  if (isLoading || staff === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const columns: Column<StaffRow>[] = [
    {
      key: "name",
      header: "Staff member",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.firstName} {row.lastName}</p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { key: "department", header: "Department", cell: (row) => row.department || "Unassigned" },
    { key: "role", header: "Role", cell: (row) => row.role },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/staff/${row._id}`}>Open Profile</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Reviews"
        description="Track staff members who need evaluation and follow-up."
      />

      <DataTable
        data={staff}
        columns={columns}
        searchable
        searchPlaceholder="Search staff..."
        searchKey={(row) => `${row.firstName} ${row.lastName} ${row.email} ${row.department ?? ""} ${row.role}`}
        emptyTitle="No staff found"
        emptyDescription="Staff members will appear here once HR records are available."
      />
    </div>
  );
}
