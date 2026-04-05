"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";

export default function ListViewPage() {
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
              Sign in with your platform session to load this project&apos;s task list.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  const tasks = [...(project.tasks ?? [])].sort(
    (a: any, b: any) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0)
  );

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
            <p className="text-muted-foreground mt-2">Task list sourced from live PM project data.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/calendar`}>
              <Button variant="outline" size="sm">Calendar</Button>
            </Link>
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/timeline`}>
              <Button variant="outline" size="sm">Timeline</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks have been created for this project yet.</p>
            ) : (
              tasks.map((task: any) => (
                <div key={task._id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      <Badge variant="secondary">{task.status}</Badge>
                      <Badge variant="outline">{task.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.description || "No description"}
                    </p>
                    <div className="text-xs text-muted-foreground flex gap-4">
                      <span>Assignee: {task.assigneeId || "Unassigned"}</span>
                      <span>Estimate: {Math.round((task.estimateMinutes ?? 0) / 60)}h</span>
                      <span>Logged: {Math.round((task.loggedMinutes ?? 0) / 60)}h</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <p>Updated</p>
                    <p>{new Date(task.updatedAt ?? task.createdAt).toLocaleDateString()}</p>
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
