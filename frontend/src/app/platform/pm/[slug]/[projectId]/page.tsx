"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";

const DEFAULT_STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Done"];

export default function ProjectPage() {
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

  if (!sessionToken) {
    return (
      <>
        <StateCard
          title="Authentication Required"
          description="Sign in with your platform session to view project data."
        />
      </>
    );
  }

  if (!project) {
    return (
      <>
        <StateCard
          title="Project Unavailable"
          description="The requested project could not be loaded."
        />
      </>
    );
  }

  const tasks = project.tasks ?? [];
  const statuses = Array.from(new Set([...DEFAULT_STATUSES, ...tasks.map((task: any) => task.status)]));
  const totalLoggedHours = Math.round(
    tasks.reduce((sum: number, task: any) => sum + (task.loggedMinutes ?? 0), 0) / 60
  );
  const totalEstimatedHours = Math.round(
    tasks.reduce((sum: number, task: any) => sum + (task.estimateMinutes ?? 0), 0) / 60
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-2">
              <Link href={`/platform/pm/${workspaceSlug}`}>
                <Button variant="ghost" size="sm">
                  Back to Workspace
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              {project.description || "This project does not have a description yet."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/list`}>
              <Button variant="outline" size="sm">List</Button>
            </Link>
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/calendar`}>
              <Button variant="outline" size="sm">Calendar</Button>
            </Link>
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/timeline`}>
              <Button variant="outline" size="sm">Timeline</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Tasks" value={tasks.length} />
          <StatCard
            title="Completed"
            value={tasks.filter((task: any) => task.status === "Done" || task.status === "done").length}
          />
          <StatCard title="Estimated Hours" value={`${totalEstimatedHours}h`} />
          <StatCard title="Logged Hours" value={`${totalLoggedHours}h`} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {statuses.map((status) => {
            const statusTasks = tasks.filter((task: any) => task.status === status);
            return (
              <Card key={status} className="flex flex-col">
                <CardHeader className="pb-3 bg-muted/40">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {status}
                    <Badge variant="secondary">{statusTasks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  {statusTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks in this status.</p>
                  ) : (
                    statusTasks.map((task: any) => (
                      <Card key={task._id}>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.description || "No description"}
                              </p>
                            </div>
                            <Badge variant="outline">{task.priority}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Assignee: {task.assigneeId || "Unassigned"}</span>
                            <span>{Math.round((task.loggedMinutes ?? 0) / 60)}h logged</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function StateCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
