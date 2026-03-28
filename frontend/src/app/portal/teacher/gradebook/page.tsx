"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, ClipboardList, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TeacherGradebookPage() {
  const { isLoading } = useAuth();

  const classes = useQuery(api.modules.academics.queries.getTeacherClasses, {});

  if (isLoading || classes === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div>
      <PageHeader
        title="Gradebook"
        description="Enter and manage grades for all your assigned classes"
        breadcrumbs={[
          { label: "Teacher Portal", href: "/portal/teacher" },
          { label: "Gradebook" },
        ]}
      />

      <div className="space-y-4">
        {classes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You have no classes assigned yet. Contact your school administrator
                to get classes assigned to your account.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Select a class to open its gradebook and enter or review student grades.
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls: any) => (
                <Card
                  key={cls._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        <CardDescription className="mt-0.5">
                          {cls.grade && `Grade ${cls.grade}`}
                          {cls.grade && cls.subject && " • "}
                          {cls.subject}
                        </CardDescription>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {cls.studentCount !== undefined
                          ? `${cls.studentCount} students`
                          : "Students enrolled"}
                      </span>
                    </div>

                    {cls.academicYear && (
                      <Badge variant="outline" className="text-xs">
                        {cls.academicYear}
                      </Badge>
                    )}

                    <Button asChild className="w-full gap-2">
                      <Link href={`/portal/teacher/classes/${cls._id}/grades`}>
                        Open Gradebook
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
