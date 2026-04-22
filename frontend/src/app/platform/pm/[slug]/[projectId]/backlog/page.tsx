"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PmProjectRail } from "@/components/platform/PmProjectRail";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { FolderKanban } from "lucide-react";
import { toast } from "sonner";

export default function BacklogPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.slug as string;
  const projectId = params.projectId as string;
  const { sessionToken, isLoading: authLoading } = useAuth();
  const [name, setName] = useState("Sprint");

  const project = useQuery(
    api.modules.pm.projects.getProject,
    sessionToken ? { sessionToken, projectId: projectId as any } : "skip"
  );
  const sprints = useQuery(
    api.modules.pm.sprints.getSprints,
    sessionToken ? { sessionToken, projectId: projectId as any } : "skip"
  );
  const createSprint = useMutation(api.modules.pm.sprints.createSprint);
  const closeSprint = useMutation(api.modules.pm.sprints.closeSprint);
  const updateTask = useMutation(api.modules.pm.tasks.updateTask);

  if (authLoading || (sessionToken && (project === undefined || sprints === undefined))) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!sessionToken || !project) {
    return null;
  }

  const activeSprint = (sprints ?? []).find((entry: any) => entry.status === "active");
  const sprintTasks = (project.tasks ?? []).filter((task: any) => String(task.sprintId) === String(activeSprint?._id));
  const backlogTasks = (project.tasks ?? []).filter((task: any) => !task.sprintId);
  const chartData = (sprints ?? []).slice(0, 5).reverse().map((entry: any) => ({
    name: entry.name,
    velocity: entry.velocity ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${project.name} Backlog`}
        description="Manage active sprint scope, park overflow in backlog, and review velocity."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "PM", href: "/platform/pm" },
          { label: workspaceSlug, href: `/platform/pm/${workspaceSlug}` },
          { label: project.name, href: `/platform/pm/${workspaceSlug}/${projectId}` },
          { label: "Backlog" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}`}>
              <Button variant="outline">Board</Button>
            </Link>
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/settings`}>
              <Button variant="outline">Settings</Button>
            </Link>
          </div>
        }
      />

      <PmProjectRail workspaceSlug={workspaceSlug} projectId={projectId} currentHref={`/platform/pm/${workspaceSlug}/${projectId}/backlog`} />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Active Sprint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSprint ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{activeSprint.name}</p>
                    <p className="text-sm text-muted-foreground">{activeSprint.goal || "No sprint goal set yet."}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await closeSprint({ sessionToken, sprintId: activeSprint._id } as any);
                        toast.success("Sprint closed.");
                        router.refresh();
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to close sprint.");
                      }
                    }}
                  >
                    Close Sprint
                  </Button>
                </div>
                <div className="space-y-3">
                  {sprintTasks.map((task: any) => (
                    <div key={task._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">{task.description || "No description"}</p>
                        </div>
                        <Badge variant="secondary">{task.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">No active sprint right now.</p>
                <div className="flex gap-2">
                  <Input value={name} onChange={(event) => setName(event.target.value)} />
                  <Button
                    onClick={async () => {
                      try {
                        const start = Date.now();
                        const end = start + 14 * 24 * 60 * 60 * 1000;
                        const result = await createSprint({
                          sessionToken,
                          projectId: project._id,
                          name,
                          startDate: start,
                          endDate: end,
                        } as any);
                        await updateTask({ sessionToken, taskId: backlogTasks[0]?._id, sprintId: result.sprintId } as any).catch(() => null);
                        toast.success("Sprint created.");
                        router.refresh();
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to create sprint.");
                      }
                    }}
                  >
                    Create Sprint
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Velocity</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" hide />
                <YAxis allowDecimals={false} />
                <Bar dataKey="velocity" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backlog</CardTitle>
        </CardHeader>
          <CardContent className="space-y-3">
          {backlogTasks.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No backlog tasks waiting"
              description="All current work is already assigned into active delivery lanes or there are no tasks in this project yet."
            />
          ) : (
            backlogTasks.map((task: any) => (
              <div key={task._id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.description || "No description"}</p>
                </div>
                <Badge variant="outline">{task.priority}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
