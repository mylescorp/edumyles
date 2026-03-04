"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChildGradesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const { isLoading } = useAuth();

  const grades = useQuery(
    api.modules.portal.parent.queries.getChildGrades,
    { studentId }
  );

  if (isLoading || grades === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Grades"
        description="Subject grades by term"
        backHref={`/portal/parent/children/${studentId}`}
      />

      {grades.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No grades have been recorded yet.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Grade Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {grades.map((g: any) => (
              <div key={g._id} className="flex justify-between">
                <span>
                  {g.subjectId} • {g.term} {g.academicYear}
                </span>
                <span>
                  {g.score} ({g.grade})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

