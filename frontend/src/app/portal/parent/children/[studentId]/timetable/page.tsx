"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChildTimetablePage({
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

  const timetable = useQuery(
    api.modules.portal.parent.queries.getChildTimetable,
    child?.classId ? { classId: child.classId } : "skip"
  );

  if (isLoading || children === undefined || timetable === undefined) {
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
        title="Timetable"
        description="Weekly class schedule"
        backHref={`/portal/parent/children/${studentId}`}
      />

      {timetable === "skip" || timetable.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No timetable has been set for this class yet.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Class Timetable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {Array.isArray(timetable) &&
              timetable.map((slot: any) => (
                <div key={slot._id} className="flex justify-between">
                  <span>
                    Day {slot.dayOfWeek} • {slot.startTime}–{slot.endTime}
                  </span>
                  <span>{slot.room || "TBD"}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

