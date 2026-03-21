"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { platformNavItems } from "@/lib/routes";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";

export default function TimelinePage() {
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
      <DashboardLayout navItems={platformNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!sessionToken || !project) {
    return (
      <DashboardLayout navItems={platformNavItems}>
        <Card className="max-w-xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Project Data Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sign in with your platform session to load this project&apos;s timeline.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const timelineTasks = [...(project.tasks ?? [])].sort((a: any, b: any) => {
    const aStart = a.createdAt ?? 0;
    const bStart = b.createdAt ?? 0;
    return aStart - bStart;
  });

  return (
    <DashboardLayout navItems={platformNavItems}>
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
              Timeline view using the project tasks currently stored in PM.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/list`}>
              <Button variant="outline" size="sm">List</Button>
            </Link>
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/calendar`}>
              <Button variant="outline" size="sm">Calendar</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {timelineTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No project tasks are available to show on the timeline yet.
              </p>
            ) : (
              timelineTasks.map((task: any) => (
                <div key={task._id} className="flex gap-4 border-l-2 border-primary/30 pl-4 py-1">
                  <div className="w-36 shrink-0 text-sm text-muted-foreground">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      <Badge variant="secondary">{task.status}</Badge>
                      <Badge variant="outline">{task.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.description || "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not scheduled"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
