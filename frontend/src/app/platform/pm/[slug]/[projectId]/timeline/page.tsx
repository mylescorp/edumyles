"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PmProjectRail } from "@/components/platform/PmProjectRail";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { Milestone } from "lucide-react";

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
    return <LoadingSkeleton variant="page" />;
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
              Sign in with your platform session to load this project&apos;s timeline.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  const timelineTasks = [...(project.tasks ?? [])].sort((a: any, b: any) => {
    const aStart = a.createdAt ?? 0;
    const bStart = b.createdAt ?? 0;
    return aStart - bStart;
  });

  return (
      <div className="space-y-6">
        <PageHeader
          title={`${project.name} Timeline`}
          description="Inspect the project chronology and see how tasks have stacked up over time."
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "PM", href: "/platform/pm" },
            { label: workspaceSlug, href: `/platform/pm/${workspaceSlug}` },
            { label: project.name, href: `/platform/pm/${workspaceSlug}/${projectId}` },
            { label: "Timeline" },
          ]}
          actions={
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}`}>
              <Button variant="outline">Back to Board</Button>
            </Link>
          }
        />

        <PmProjectRail workspaceSlug={workspaceSlug} projectId={projectId} currentHref={`/platform/pm/${workspaceSlug}/${projectId}/timeline`} />

        <Card className="overflow-hidden border-slate-200/80 bg-slate-50/70">
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Timeline items</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{timelineTasks.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">First recorded</p>
              <p className="mt-3 text-sm font-medium text-slate-950">
                {timelineTasks[0]?.createdAt ? new Date(timelineTasks[0].createdAt).toLocaleDateString() : "No history yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Use case</p>
              <p className="mt-3 text-sm text-muted-foreground">Review delivery history, sequencing, and task completion cadence.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {timelineTasks.length === 0 ? (
              <EmptyState
                icon={Milestone}
                title="No project history to display"
                description="As tasks are created and updated, this timeline will show the delivery narrative for the project."
              />
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
  );
}
