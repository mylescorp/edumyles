"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Done"];
const projectSchema = z
  .object({
    name: z.string().min(2, "Project name is required"),
    description: z.string().min(2, "Project description is required"),
    status: z.enum(["active", "paused", "completed", "archived"]),
    startDate: z.string().min(1, "Start date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    githubRepo: z.union([z.string().url("Enter a valid repository URL"), z.literal("")]),
  })
  .refine((value) => new Date(value.dueDate).getTime() >= new Date(value.startDate).getTime(), {
    message: "Due date must be on or after the start date",
    path: ["dueDate"],
  });

function toDateInput(value?: number) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function toTimestamp(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).getTime();
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.slug as string;
  const projectId = params.projectId as string;
  const { sessionToken, isLoading: authLoading } = useAuth();
  const [isRefreshing, startRefreshing] = useTransition();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "paused" | "completed" | "archived",
    startDate: "",
    dueDate: "",
    githubRepo: "",
  });

  const project = useQuery(
    api.modules.pm.projects.getProject,
    sessionToken ? { sessionToken, projectId: projectId as any } : "skip"
  );
  const updateProject = useMutation(api.modules.pm.projects.updateProject);
  const deleteProject = useMutation(api.modules.pm.projects.deleteProject);

  const syncFormFromProject = () => {
    if (!project) return;
    setFormData({
      name: project.name ?? "",
      description: project.description ?? "",
      status: project.status ?? "active",
      startDate: toDateInput(project.startDate),
      dueDate: toDateInput(project.dueDate),
      githubRepo: project.githubRepo ?? "",
    });
    setFormErrors({});
  };

  if (authLoading || (sessionToken && project === undefined)) {
    return <LoadingSkeleton variant="page" />;
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

  const handleUpdate = async () => {
    if (!sessionToken) return;
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

    setIsSaving(true);
    try {
      await updateProject({
        sessionToken,
        projectId: projectId as any,
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status,
        startDate: toTimestamp(parsed.data.startDate),
        dueDate: toTimestamp(parsed.data.dueDate),
        githubRepo: parsed.data.githubRepo || undefined,
      });
      toast.success("Project updated.");
      setIsEditOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update project.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToken) return;
    if (!deleteReason.trim()) {
      toast.error("Delete reason is required.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProject({
        sessionToken,
        projectId: projectId as any,
        reason: deleteReason.trim(),
      });
      toast.success("Project deleted.");
      router.push(`/platform/pm/${workspaceSlug}`);
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete project.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={project.description || "This project does not have a description yet."}
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "PM", href: "/platform/pm" },
          { label: workspaceSlug, href: `/platform/pm/${workspaceSlug}` },
          { label: project.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing || isSaving || isDeleting}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => { syncFormFromProject(); setIsEditOpen(true); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <Link href={`/platform/pm/${workspaceSlug}`}>
              <Button variant="ghost" size="sm">
                Back to Workspace
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={project.status === "active" ? "default" : "secondary"}>{project.status}</Badge>
            {project.githubRepo ? (
              <a href={project.githubRepo} target="_blank" rel="noreferrer" className="text-sm text-primary underline-offset-4 hover:underline">
                Repository
              </a>
            ) : null}
          </div>
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
                    <EmptyState
                      icon={RefreshCw}
                      title="No tasks in this status"
                      description="Tasks will appear here as work moves through the project workflow."
                      className="py-6"
                    />
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

      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setFormErrors({}); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details stored in the PM workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Project name</Label>
              <Input id="edit-project-name" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
              {formErrors.name ? <p className="text-xs text-destructive">{formErrors.name}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-description">Description</Label>
              <Textarea id="edit-project-description" rows={4} value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} />
              {formErrors.description ? <p className="text-xs text-destructive">{formErrors.description}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-status">Status</Label>
              <Input id="edit-project-status" value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value as typeof current.status }))} />
              {formErrors.status ? <p className="text-xs text-destructive">{formErrors.status}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-project-start-date">Start date</Label>
                <Input id="edit-project-start-date" type="date" value={formData.startDate} onChange={(event) => setFormData((current) => ({ ...current, startDate: event.target.value }))} />
                {formErrors.startDate ? <p className="text-xs text-destructive">{formErrors.startDate}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-due-date">Due date</Label>
                <Input id="edit-project-due-date" type="date" value={formData.dueDate} onChange={(event) => setFormData((current) => ({ ...current, dueDate: event.target.value }))} />
                {formErrors.dueDate ? <p className="text-xs text-destructive">{formErrors.dueDate}</p> : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-repo">GitHub repository</Label>
              <Input id="edit-project-repo" value={formData.githubRepo} onChange={(event) => setFormData((current) => ({ ...current, githubRepo: event.target.value }))} placeholder="https://github.com/org/repo" />
              {formErrors.githubRepo ? <p className="text-xs text-destructive">{formErrors.githubRepo}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={() => void handleUpdate()} disabled={isSaving}>
              {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Deleting a project is permanent. Projects with tasks or epics cannot be deleted until those records are cleared.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-project-reason">Reason</Label>
            <Textarea
              id="delete-project-reason"
              rows={4}
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Explain why this project is being deleted."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
              {isDeleting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
