"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChildAttendancePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const { isLoading } = useAuth();

  const attendance = useQuery(
    api.modules.portal.parent.queries.getChildAttendance,
    { studentId }
  );

  if (isLoading || attendance === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance"
        description="Daily attendance records"
        backHref={`/portal/parent/children/${studentId}`}
      />

      {attendance.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No attendance records are available yet.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {attendance.map((a: any) => (
              <div key={a._id} className="flex justify-between">
                <span>{a.date}</span>
                <span className="capitalize">{a.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

