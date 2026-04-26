"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PmAdminRail } from "@/components/platform/PmAdminRail";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { normalizeArray } from "@/lib/normalizeData";
import { Columns3, FolderKanban, LayoutList, Timer } from "lucide-react";

type WorkspaceSummary = {
  _id: string;
  slug: string;
  name: string;
};

type ProjectSummary = {
  _id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: string;
  progress?: number;
  memberIds?: string[];
};

export default function PMBoardsPage() {
  const { sessionToken, isLoading: authLoading } = useAuth();
  const workspaces = useQuery(
    api.modules.pm.workspaces.getWorkspaces,
    sessionToken ? { sessionToken } : "skip"
  ) as WorkspaceSummary[] | undefined;
  const projects = useQuery(
    api.modules.pm.projects.getProjects,
    sessionToken ? { sessionToken } : "skip"
  ) as ProjectSummary[] | undefined;

  const workspaceRows = useMemo(() => normalizeArray<WorkspaceSummary>(workspaces), [workspaces]);
  const projectRows = useMemo(() => normalizeArray<ProjectSummary>(projects), [projects]);

  if (authLoading || (sessionToken && (workspaces === undefined || projects === undefined))) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Boards"
        description="Open the kanban view for any accessible project without first drilling through workspace lists."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "PM", href: "/platform/pm" },
          { label: "Boards" },
        ]}
      />

      <PmAdminRail currentHref="/platform/pm/boards" />

      {projectRows.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Columns3}
              title="No project boards available"
              description="Create or join a PM project and its board will appear here automatically."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projectRows.map((project) => {
            const workspace = workspaceRows.find((row) => row._id === project.workspaceId);
            const workspaceSlug = workspace?.slug ?? "workspace";
            const boardHref = `/platform/pm/${workspaceSlug}/${project._id}`;
            return (
              <Card key={project._id} className="border-slate-200/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-slate-950">{project.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{workspace?.name ?? "Workspace"}</p>
                    </div>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {project.description || "Open the board to move tasks across backlog, delivery, review, and completion lanes."}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{Math.round(project.progress ?? 0)}%</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Members</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{project.memberIds?.length ?? 0}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button asChild className="gap-2">
                      <Link href={boardHref}>
                        <Columns3 className="h-4 w-4" />
                        Board
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link href={`${boardHref}/list`}>
                        <LayoutList className="h-4 w-4" />
                        List
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link href={`${boardHref}/backlog`}>
                        <Timer className="h-4 w-4" />
                        Backlog
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
