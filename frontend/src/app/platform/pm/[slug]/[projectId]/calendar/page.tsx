"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";

export default function CalendarPage() {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const projectId = params.projectId as string;
  const { sessionToken, isLoading: authLoading } = useAuth();

  const project = useQuery(
    api.modules.pm.projects.getProject,
    sessionToken ? { sessionToken, projectId: projectId as any } : "skip"
  );

  if (authLoading || (sessionToken && project === undefined)) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  if (!sessionToken || !project) {
    return (
      <>
        <Card className="max-w-xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Project Data Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sign in with your platform session to load this project&apos;s due dates.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  const tasksWithDates = (project.tasks ?? [])
    .filter((task: any) => task.dueDate)
    .sort((a: any, b: any) => (a.dueDate ?? 0) - (b.dueDate ?? 0));

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-2">
              <Link href={`/platform/pm/${workspaceSlug}/${projectId}`}>
                <Button variant="ghost" size="sm">Back to Project</Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground mt-2">
              Upcoming due dates sourced from live PM project data.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/list`}>
              <Button variant="outline" size="sm">List</Button>
            </Link>
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/timeline`}>
              <Button variant="outline" size="sm">Timeline</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Due Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksWithDates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No dated tasks are available for this project yet.
              </p>
            ) : (
              tasksWithDates.map((task: any) => (
                <div key={task._id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      <Badge variant="secondary">{task.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description || "No description"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.assigneeId || "Unassigned"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
