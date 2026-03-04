"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChildAssignmentsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const { isLoading } = useAuth();

  const children = useQuery(
    api.modules.portal.parent.queries.getChildren,
    {}
  );

  const child = children?.find((c: any) => c._id === studentId);

  const assignments = useQuery(
    api.modules.portal.parent.queries.getChildAssignments,
    child?.classId
      ? { studentId, classId: child.classId }
      : "skip"
  );

  if (isLoading || children === undefined || assignments === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!child) {
    return (
      <div>
        <PageHeader
          title="Child not found"
          description="This child is not linked to your account."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assignments"
        description="Class assignments for your child"
        backHref={`/portal/parent/children/${studentId}`}
      />

      {assignments === "skip" || assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No assignments are available yet.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {Array.isArray(assignments) &&
              assignments.map((a: any) => (
                <div key={a._id} className="flex justify-between">
                  <span>{a.title}</span>
                  <span>Due {a.dueDate}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

