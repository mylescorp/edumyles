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
import { CalendarRange } from "lucide-react";

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
      <div className="space-y-6">
        <PageHeader
          title={`${project.name} Calendar`}
          description="Scan upcoming due dates and workload shape for this project using live PM task data."
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "PM", href: "/platform/pm" },
            { label: workspaceSlug, href: `/platform/pm/${workspaceSlug}` },
            { label: project.name, href: `/platform/pm/${workspaceSlug}/${projectId}` },
            { label: "Calendar" },
          ]}
          actions={
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}`}>
              <Button variant="outline">Back to Board</Button>
            </Link>
          }
        />

        <PmProjectRail workspaceSlug={workspaceSlug} projectId={projectId} currentHref={`/platform/pm/${workspaceSlug}/${projectId}/calendar`} />

        <Card className="overflow-hidden border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.98))]">
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dated tasks</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{tasksWithDates.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Next due</p>
              <p className="mt-3 text-sm font-medium text-slate-950">
                {tasksWithDates[0]?.dueDate ? new Date(tasksWithDates[0].dueDate).toLocaleDateString() : "Nothing scheduled"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">View posture</p>
              <p className="mt-3 text-sm text-muted-foreground">Calendar surface for delivery planning and deadline reviews.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Due Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksWithDates.length === 0 ? (
              <EmptyState
                icon={CalendarRange}
                title="No scheduled due dates yet"
                description="Add due dates to project tasks and they will appear here in chronological order."
              />
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
  );
}
