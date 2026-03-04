"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ChildOverviewPage({
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

  if (isLoading || children === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const child = children.find((c: any) => c._id === studentId);

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
    <div className="space-y-6">
      <PageHeader
        title={`${child.firstName} ${child.lastName}`}
        description="Overview of your child's academic information"
        backHref="/portal/parent/children"
      />

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/portal/parent/children/${studentId}/grades`}>
              View Grades
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/portal/parent/children/${studentId}/attendance`}>
              Attendance
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/portal/parent/children/${studentId}/timetable`}>
              Timetable
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/portal/parent/children/${studentId}/assignments`}>
              Assignments
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Admission No: {child.admissionNumber}</p>
          <p>Status: {child.status}</p>
          <p>Gender: {child.gender}</p>
        </CardContent>
      </Card>
    </div>
  );
}

