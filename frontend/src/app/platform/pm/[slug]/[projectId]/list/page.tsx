"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { ClipboardList, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TASK_STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Done"] as const;
const TASK_PRIORITIES = ["urgent", "high", "medium", "low", "none"] as const;

const taskSchema = z.object({
  title: z.string().trim().min(2, "Task title is required"),
  description: z.string().trim().min(1, "Description is required"),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  assigneeId: z.string().trim().optional(),
  dueDate: z.string().optional(),
  estimateHours: z.string().optional(),
  labels: z.string().optional(),
});

type TaskFormData = {
  title: string;
  description: string;
  status: (typeof TASK_STATUSES)[number];
  priority: (typeof TASK_PRIORITIES)[number];
  assigneeId: string;
  dueDate: string;
  estimateHours: string;
  labels: string;
};

const EMPTY_FORM: TaskFormData = {
  title: "",
  description: "",
  status: "Backlog",
  priority: "medium",
  assigneeId: "",
  dueDate: "",
  estimateHours: "",
  labels: "",
};

function toTimestamp(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).getTime();
}

function toDateInput(value?: number) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function toEstimateHours(minutes?: number) {
  if (!minutes) return "";
  return String(Math.round((minutes / 60) * 10) / 10);
}

function toLabelString(labels?: string[]) {
  return (labels ?? []).join(", ");
}

export default function ListViewPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.slug as string;
  const projectId = params.projectId as string;
  const { sessionToken, isLoading: authLoading } = useAuth();
  const [isRefreshing, startRefreshing] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteReason, setDeleteReason] = useState("");
  const [formData, setFormData] = useState<TaskFormData>(EMPTY_FORM);

  const project = useQuery(
    api.modules.pm.projects.getProject,
    sessionToken ? { sessionToken, projectId: projectId as any } : "skip"
  );
  const createTask = useMutation(api.modules.pm.tasks.createTask);
  const updateTask = useMutation(api.modules.pm.tasks.updateTask);
  const deleteTask = useMutation(api.modules.pm.tasks.deleteTask);

  const tasks = useMemo(
    () =>
      [...(project?.tasks ?? [])].sort(
        (a: any, b: any) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0)
      ),
    [project?.tasks]
  );

  const taskStats = useMemo(
    () => ({
      total: tasks.length,
      done: tasks.filter((task: any) => task.status === "Done").length,
      inProgress: tasks.filter((task: any) => task.status === "In Progress").length,
      unassigned: tasks.filter((task: any) => !task.assigneeId).length,
    }),
    [tasks]
  );

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingTaskId(null);
    setIsCreateOpen(true);
  };

  const openEditDialog = (task: any) => {
    setEditingTaskId(task._id);
    setFormData({
      title: task.title ?? "",
      description: task.description ?? "",
      status: TASK_STATUSES.includes(task.status) ? task.status : "Backlog",
      priority: TASK_PRIORITIES.includes(task.priority) ? task.priority : "medium",
      assigneeId: task.assigneeId ?? "",
      dueDate: toDateInput(task.dueDate),
      estimateHours: toEstimateHours(task.estimateMinutes),
      labels: toLabelString(task.labels),
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const setField = (field: keyof TaskFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const buildMutationPayload = (parsed: z.infer<typeof taskSchema>) => {
    const estimateHours = parsed.estimateHours?.trim() ?? "";
    const labels = parsed.labels
      ?.split(",")
      .map((label) => label.trim())
      .filter(Boolean);

    const payload = {
      title: parsed.title,
      description: parsed.description,
      status: parsed.status,
      priority: parsed.priority,
      assigneeId: parsed.assigneeId?.trim() ? parsed.assigneeId.trim() : "",
      dueDate: parsed.dueDate?.trim() ? toTimestamp(parsed.dueDate) : undefined,
      estimateMinutes: estimateHours ? Math.round(Number(estimateHours) * 60) : undefined,
      labels,
    };

    return payload;
  };

  const handleSaveTask = async () => {
    if (!sessionToken) return;

    const parsed = taskSchema.safeParse(formData);
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

    if (parsed.data.estimateHours?.trim() && Number.isNaN(Number(parsed.data.estimateHours))) {
      setFormErrors((current) => ({ ...current, estimateHours: "Estimate hours must be numeric" }));
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildMutationPayload(parsed.data);

      if (editingTaskId) {
        await updateTask({
          sessionToken,
          taskId: editingTaskId as any,
          ...payload,
        });
        toast.success("Task updated.");
      } else {
        await createTask({
          sessionToken,
          projectId: projectId as any,
          ...payload,
        });
        toast.success("Task created.");
      }

      setIsCreateOpen(false);
      setEditingTaskId(null);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Failed to save task:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save task.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!sessionToken || !deletingTaskId) return;
    if (!deleteReason.trim()) {
      toast.error("Delete reason is required.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTask({
        sessionToken,
        taskId: deletingTaskId as any,
        reason: deleteReason.trim(),
      });
      toast.success("Task deleted.");
      setDeletingTaskId(null);
      setDeleteReason("");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete task.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || (sessionToken && project === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!sessionToken || !project) {
    return (
      <Card className="max-w-xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Project Data Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sign in with your platform session to load this project&apos;s task list.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${project.name} Tasks`}
        description="Create, edit, and retire tasks from the live PM backend without leaving the project workspace."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "PM", href: "/platform/pm" },
          { label: workspaceSlug, href: `/platform/pm/${workspaceSlug}` },
          { label: project.name, href: `/platform/pm/${workspaceSlug}/${projectId}` },
          { label: "List" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing || isSaving || isDeleting}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="mb-2">
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}`}>
              <Button variant="ghost" size="sm">Back to Project</Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            List view stays in sync with the kanban board, calendar, and timeline.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/platform/pm/${workspaceSlug}/${projectId}/calendar`}>
            <Button variant="outline" size="sm">Calendar</Button>
          </Link>
          <Link href={`/platform/pm/${workspaceSlug}/${projectId}/timeline`}>
            <Button variant="outline" size="sm">Timeline</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <TaskStatCard title="Total Tasks" value={taskStats.total} />
        <TaskStatCard title="Done" value={taskStats.done} />
        <TaskStatCard title="In Progress" value={taskStats.inProgress} />
        <TaskStatCard title="Unassigned" value={taskStats.unassigned} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No tasks yet"
              description="Create the first task for this project to start tracking delivery work."
              action={
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              }
              className="py-12"
            />
          ) : (
            tasks.map((task: any) => (
              <div key={task._id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      <Badge variant="secondary">{task.status}</Badge>
                      <Badge variant="outline" className="uppercase">{task.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.description || "No description"}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Assignee: {task.assigneeId || "Unassigned"}</span>
                      <span>Estimate: {task.estimateMinutes ? `${Math.round((task.estimateMinutes / 60) * 10) / 10}h` : "Not set"}</span>
                      <span>Logged: {Math.round((task.loggedMinutes ?? 0) / 60)}h</span>
                      <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not scheduled"}</span>
                    </div>
                    {task.labels?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {task.labels.map((label: string) => (
                          <Badge key={label} variant="outline">{label}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(task)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletingTaskId(task._id);
                        setDeleteReason("");
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open && !isSaving) {
            setEditingTaskId(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTaskId ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>
              {editingTaskId
                ? "Update task details stored in the PM backend."
                : "Add a new task to this project using the live PM workspace."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" value={formData.title} onChange={(event) => setField("title", event.target.value)} />
              {formErrors.title ? <p className="text-xs text-destructive">{formErrors.title}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea id="task-description" rows={4} value={formData.description} onChange={(event) => setField("description", event.target.value)} />
              {formErrors.description ? <p className="text-xs text-destructive">{formErrors.description}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setField("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.status ? <p className="text-xs text-destructive">{formErrors.status}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setField("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.priority ? <p className="text-xs text-destructive">{formErrors.priority}</p> : null}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee ID</Label>
                <Input id="task-assignee" value={formData.assigneeId} onChange={(event) => setField("assigneeId", event.target.value)} placeholder="Leave blank for unassigned" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due date</Label>
                <Input id="task-due-date" type="date" value={formData.dueDate} onChange={(event) => setField("dueDate", event.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-estimate-hours">Estimate hours</Label>
                <Input id="task-estimate-hours" value={formData.estimateHours} onChange={(event) => setField("estimateHours", event.target.value)} placeholder="4" />
                {formErrors.estimateHours ? <p className="text-xs text-destructive">{formErrors.estimateHours}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-labels">Labels</Label>
                <Input id="task-labels" value={formData.labels} onChange={(event) => setField("labels", event.target.value)} placeholder="frontend, urgent" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveTask()} disabled={isSaving}>
              {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingTaskId ? "Save Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingTaskId)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingTaskId(null);
            setDeleteReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Deleting a task is permanent. Tasks with subtasks must be cleared first.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-task-reason">Reason</Label>
            <Textarea
              id="delete-task-reason"
              rows={4}
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Explain why this task is being deleted."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletingTaskId(null);
                setDeleteReason("");
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDeleteTask()} disabled={isDeleting}>
              {isDeleting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskStatCard({ title, value }: { title: string; value: number }) {
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
