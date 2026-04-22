"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PmProjectRail } from "@/components/platform/PmProjectRail";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { KanbanBoard } from "@/components/pm/KanbanBoard";
import { TaskSlideOut } from "@/components/pm/TaskSlideOut";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_STATUSES = ["Backlog", "To Do", "In Progress", "In Review", "Done"];

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.slug as string;
  const projectId = params.projectId as string;
  const { sessionToken, isLoading: authLoading } = useAuth();
  const [isRefreshing, startRefreshing] = useTransition();
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const project = useQuery(
    api.modules.pm.projects.getProject,
    sessionToken ? { sessionToken, projectId: projectId as any } : "skip"
  );
  const moveTask = useMutation(api.modules.pm.tasks.moveTask);

  const tasks = useMemo(() => {
    return (project?.tasks ?? []).map((task: any) => {
      const commentBucket = project?.comments?.find((entry: any) => String(entry.taskId) === String(task._id));
      return {
        ...task,
        commentCount: commentBucket?.comments?.length ?? 0,
      };
    });
  }, [project]);

  const statuses = useMemo(() => {
    const seen = new Set(DEFAULT_STATUSES);
    for (const task of tasks) {
      if (task.status) seen.add(task.status);
    }
    return Array.from(seen);
  }, [tasks]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task: any) => task.status.toLowerCase() === "done").length;
    const active = tasks.filter((task: any) =>
      ["to do", "in progress", "in review"].includes(task.status.toLowerCase())
    ).length;
    const hours = tasks.reduce((sum: number, task: any) => sum + (task.actualHours ?? 0), 0);
    return { total, done, active, hours };
  }, [tasks]);

  if (authLoading || (sessionToken && project === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!sessionToken || !project) {
    return (
      <Card className="mx-auto mt-8 max-w-xl">
        <CardHeader>
          <CardTitle>Project Data Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sign in with your platform session to load this project board.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={project.description || "Track work across backlog, active delivery, review, and completion."}
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "PM", href: "/platform/pm" },
          { label: workspaceSlug, href: `/platform/pm/${workspaceSlug}` },
          { label: project.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/list`}>
              <Button variant="outline">List View</Button>
            </Link>
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/backlog`}>
              <Button variant="outline">Backlog</Button>
            </Link>
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/settings`}>
              <Button variant="outline">Settings</Button>
            </Link>
          </div>
        }
      />

      <PmProjectRail workspaceSlug={workspaceSlug} projectId={projectId} currentHref={`/platform/pm/${workspaceSlug}/${projectId}`} />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Tasks" value={metrics.total} />
        <MetricCard label="Completed" value={metrics.done} />
        <MetricCard label="Active" value={metrics.active} />
        <MetricCard label="Logged Hours" value={metrics.hours} />
      </section>

      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="border-b border-slate-200 bg-slate-50/80">
          <CardTitle className="text-base">Delivery Board</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <KanbanBoard
            statuses={statuses}
            tasks={tasks}
            onOpenTask={(task) => setSelectedTask(task)}
            onMoveTask={async (task, nextStatus) => {
              try {
                await moveTask({
                  sessionToken,
                  taskId: task._id,
                  newStatus: nextStatus,
                  newOrder: Date.now(),
                } as any);
                toast.success(`Moved "${task.title}" to ${nextStatus}.`);
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to move task.");
              }
            }}
          />
        </CardContent>
      </Card>

      <TaskSlideOut
        open={Boolean(selectedTask)}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
        task={selectedTask}
        statuses={statuses}
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-950">{value}</div>
      </CardContent>
    </Card>
  );
}
