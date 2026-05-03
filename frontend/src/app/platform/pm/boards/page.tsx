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
import {
  ArrowRight,
  Columns3,
  FolderKanban,
  LayoutList,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";

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

type WorkspaceBoardGroup = {
  workspace: WorkspaceSummary;
  projects: ProjectSummary[];
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

  const orderedProjects = useMemo(() => {
    const statusOrder = ["active", "paused", "planning", "draft", "completed", "archived"];
    return [...projectRows].sort((a, b) => {
      const aIndex = statusOrder.indexOf((a.status ?? "").toLowerCase());
      const bIndex = statusOrder.indexOf((b.status ?? "").toLowerCase());
      if (aIndex !== bIndex) return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      return (b.progress ?? 0) - (a.progress ?? 0);
    });
  }, [projectRows]);

  const groupedBoards = useMemo<WorkspaceBoardGroup[]>(() => {
    return workspaceRows
      .map((workspace) => ({
        workspace,
        projects: orderedProjects.filter((project) => project.workspaceId === workspace._id),
      }))
      .filter((group) => group.projects.length > 0);
  }, [orderedProjects, workspaceRows]);

  const featuredProject = orderedProjects[0] ?? null;
  const featuredWorkspace = featuredProject
    ? workspaceRows.find((workspace) => workspace._id === featuredProject.workspaceId) ?? null
    : null;

  const activeBoardCount = useMemo(
    () => orderedProjects.filter((project) => ["active", "paused"].includes((project.status ?? "").toLowerCase())).length,
    [orderedProjects]
  );
  const averageProgress = useMemo(() => {
    if (orderedProjects.length === 0) return 0;
    const total = orderedProjects.reduce((sum, project) => sum + (project.progress ?? 0), 0);
    return Math.round(total / orderedProjects.length);
  }, [orderedProjects]);

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

      {orderedProjects.length === 0 ? (
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
        <>
          <Card className="overflow-hidden border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_32%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))]">
            <CardContent className="grid gap-6 p-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-slate-900 text-white">Kanban Launch Surface</Badge>
                  <Badge variant="outline" className="border-slate-300 bg-white/90 text-slate-700">
                    Live PM data
                  </Badge>
                </div>
                <div className="space-y-3">
                  <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950">
                    Jump straight into delivery lanes, not admin detours.
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                    This board hub is the fast path into project execution. Open the featured board, scan which workspaces are hot,
                    and move directly into board, list, or backlog views from one place.
                  </p>
                </div>
                {featuredProject && featuredWorkspace ? (
                  <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Featured board
                        </p>
                        <div>
                          <h3 className="text-2xl font-semibold text-slate-950">{featuredProject.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{featuredWorkspace.name}</p>
                        </div>
                        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                          {featuredProject.description || "Open the board and move work through backlog, execution, review, and done without losing context."}
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit border-slate-300 bg-slate-50">
                        {featuredProject.status}
                      </Badge>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <Button asChild className="gap-2">
                        <Link href={`/platform/pm/${featuredWorkspace.slug}/${featuredProject._id}`}>
                          <Columns3 className="h-4 w-4" />
                          Open Board
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="gap-2">
                        <Link href={`/platform/pm/${featuredWorkspace.slug}/${featuredProject._id}/list`}>
                          <LayoutList className="h-4 w-4" />
                          List View
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="gap-2">
                        <Link href={`/platform/pm/${featuredWorkspace.slug}/${featuredProject._id}/backlog`}>
                          <Timer className="h-4 w-4" />
                          Backlog
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <StatCard label="Accessible boards" value={String(orderedProjects.length)} icon={Columns3} />
                <StatCard label="Active delivery boards" value={String(activeBoardCount)} icon={TrendingUp} />
                <StatCard label="Average completion" value={`${averageProgress}%`} icon={FolderKanban} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {groupedBoards.map((group) => (
              <section key={group.workspace._id} className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Workspace boards</p>
                    <h3 className="mt-1 text-2xl font-semibold text-slate-950">{group.workspace.name}</h3>
                  </div>
                  <Button asChild variant="outline" className="w-fit gap-2">
                    <Link href={`/platform/pm/${group.workspace.slug}`}>
                      Open workspace
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {group.projects.map((project) => {
                    const boardHref = `/platform/pm/${group.workspace.slug}/${project._id}`;
                    return (
                      <Card
                        key={project._id}
                        className="overflow-hidden border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <CardHeader className="space-y-3 pb-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <CardTitle className="text-lg text-slate-950">{project.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{group.workspace.name}</p>
                            </div>
                            <Badge variant="outline" className="border-slate-300 bg-white/90">
                              {project.status}
                            </Badge>
                          </div>
                          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
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
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Columns3;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/92 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}
