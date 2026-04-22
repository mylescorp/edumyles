"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PmAdminRail } from "@/components/platform/PmAdminRail";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { ClipboardList } from "lucide-react";

export default function MyTasksPage() {
  const { sessionToken, isLoading: authLoading, user } = useAuth();
  const tasks = useQuery(api.modules.pm.tasks.getMyTasks, sessionToken ? { sessionToken } : "skip");
  const displayName =
    typeof (user as any)?.firstName === "string" && (user as any).firstName.trim().length > 0
      ? (user as any).firstName
      : "Operator";

  const grouped = useMemo(() => {
    const rows = (tasks ?? []) as any[];
    return rows.reduce((acc: Record<string, any[]>, task: any) => {
      const key = task.project?.name ?? "Unassigned project";
      acc[key] = acc[key] ?? [];
      acc[key].push(task);
      return acc;
    }, {});
  }, [tasks]);

  if (authLoading || (sessionToken && tasks === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${displayName}!`}
        description="Everything assigned to you across PM projects, grouped by project."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "PM", href: "/platform/pm" },
          { label: "My Tasks" },
        ]}
      />

      <PmAdminRail currentHref="/platform/pm/my-tasks" />

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={ClipboardList}
              title="No assigned tasks right now"
              description="When work is assigned to you across active projects, it will appear here grouped by project."
            />
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([projectName, entries]) => (
          <Card key={projectName} className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="text-base">{projectName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {entries.map((task: any) => (
                <Link
                  key={task._id}
                  href={`/platform/pm/${task.project?.slug ?? "workspace"}/${task.projectId}`}
                  className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{task.description || "No description"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{task.status}</Badge>
                      <Badge variant="outline">{task.priority}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
