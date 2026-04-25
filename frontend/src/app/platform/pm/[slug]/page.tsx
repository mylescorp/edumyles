"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PmAdminRail } from "@/components/platform/PmAdminRail";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderOpen, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { normalizeArray } from "@/lib/normalizeData";
import { toast } from "sonner";

type ProjectSummary = {
  _id: string;
  name: string;
  status: string;
  description?: string;
  taskCount: number;
  progress: number;
  totalEstimatedMinutes?: number;
  totalLoggedMinutes?: number;
};

const projectSchema = z
  .object({
    name: z.string().min(2, "Project name is required"),
    description: z.string().min(2, "Project description is required"),
    startDate: z.string().min(1, "Start date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    githubRepo: z.union([z.string().url("Enter a valid repository URL"), z.literal("")]),
  })
  .refine((value) => new Date(value.dueDate).getTime() >= new Date(value.startDate).getTime(), {
    message: "Due date must be on or after the start date",
    path: ["dueDate"],
  });

function toTimestamp(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).getTime();
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.slug as string;
  const { sessionToken, isLoading: authLoading } = useAuth();
  const [isRefreshing, startRefreshing] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    dueDate: "",
    githubRepo: "",
  });

  const workspace = useQuery(
    api.modules.pm.workspaces.getWorkspaceBySlug,
    sessionToken ? { slug: workspaceSlug, sessionToken } : "skip"
  );

  const projects = useQuery(
    api.modules.pm.projects.getProjects,
    sessionToken && workspace
      ? {
          workspaceId: workspace._id,
          sessionToken,
        }
      : "skip"
  );
  const createProject = useMutation(api.modules.pm.projects.createProject);
  const projectRows = useMemo(() => normalizeArray<ProjectSummary>(projects), [projects]);

  const setField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      dueDate: "",
      githubRepo: "",
    });
    setFormErrors({});
  };

  const handleCreateProject = async () => {
    if (!sessionToken || !workspace) return;

    const parsed = projectSchema.safeParse(formData);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setFormErrors(nextErrors);
      return;
    }

    setIsCreating(true);
    try {
      const projectId = await createProject({
        sessionToken,
        workspaceId: workspace._id,
        name: parsed.data.name,
        description: parsed.data.description,
        startDate: toTimestamp(parsed.data.startDate),
        dueDate: toTimestamp(parsed.data.dueDate),
        githubRepo: parsed.data.githubRepo || undefined,
      });
      toast.success("Project created.");
      setIsCreateOpen(false);
      resetForm();
      router.push(`/platform/pm/${workspaceSlug}/${projectId}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create project.");
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || (sessionToken && workspace === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!sessionToken) {
    return (
      <>
        <Card className="max-w-xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sign in with your normal platform session to access this workspace.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!workspace) {
    return (
      <>
        <Card className="max-w-xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Workspace Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The requested workspace could not be loaded.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={workspace.name}
        description={`Workspace type: ${workspace.type}. Browse projects and open the detailed PM views that are already backed by Convex.`}
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "PM", href: "/platform/pm" },
          { label: workspace.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing || isCreating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        }
      />

      <PmAdminRail currentHref="/platform/pm/workspaces" />

      <Card className="overflow-hidden border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))]">
        <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
            <div className="text-3xl">{workspace.icon || "📁"}</div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Workspace posture</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{workspace.name}</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              This workspace centralizes delivery lanes for {workspace.type} work. Open any project below to jump into board, list, backlog,
              timeline, calendar, or settings views without losing context.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Type</p>
              <Badge variant="secondary" className="mt-3">{workspace.type}</Badge>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Projects</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{projectRows.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Navigation</p>
              <p className="mt-3 text-sm text-muted-foreground">Board, list, timeline, backlog, calendar, settings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projectRows.map((project: ProjectSummary) => (
            <Card key={project._id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge 
                    variant={project.status === "active" ? "default" : "secondary"}
                  >
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tasks:</span>
                      <span className="ml-2 font-semibold">{project.taskCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Progress:</span>
                      <span className="ml-2 font-semibold">{Math.round(project.progress)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. Hours:</span>
                      <span className="ml-2 font-semibold">
                        {Math.round((project.totalEstimatedMinutes || 0) / 60)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Logged:</span>
                      <span className="ml-2 font-semibold">
                        {Math.round((project.totalLoggedMinutes || 0) / 60)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Button asChild className="w-full">
                    <Link href={`/platform/pm/${workspaceSlug}/${project._id}`}>
                      Open Board
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/platform/pm/${workspaceSlug}/${project._id}/list`}>
                      List
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/platform/pm/${workspaceSlug}/${project._id}/backlog`}>
                      Backlog
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {projectRows.length === 0 && (
        <Card>
          <CardContent>
            <EmptyState
              icon={FolderOpen}
              title="No projects in this workspace"
              description="Create the first project in this workspace to start tracking tasks, timelines, and delivery progress."
              className="py-12"
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open && !isCreating) {
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Provision a new project inside {workspace.name} using the live PM backend.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input id="project-name" value={formData.name} onChange={(event) => setField("name", event.target.value)} />
              {formErrors.name ? <p className="text-xs text-destructive">{formErrors.name}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea id="project-description" rows={4} value={formData.description} onChange={(event) => setField("description", event.target.value)} />
              {formErrors.description ? <p className="text-xs text-destructive">{formErrors.description}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-start-date">Start date</Label>
                <Input id="project-start-date" type="date" value={formData.startDate} onChange={(event) => setField("startDate", event.target.value)} />
                {formErrors.startDate ? <p className="text-xs text-destructive">{formErrors.startDate}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-due-date">Due date</Label>
                <Input id="project-due-date" type="date" value={formData.dueDate} onChange={(event) => setField("dueDate", event.target.value)} />
                {formErrors.dueDate ? <p className="text-xs text-destructive">{formErrors.dueDate}</p> : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-github-repo">GitHub repository</Label>
              <Input id="project-github-repo" value={formData.githubRepo} onChange={(event) => setField("githubRepo", event.target.value)} placeholder="https://github.com/org/repo" />
              {formErrors.githubRepo ? <p className="text-xs text-destructive">{formErrors.githubRepo}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreateProject()} disabled={isCreating}>
              {isCreating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
