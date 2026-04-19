"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { normalizeArray } from "@/lib/normalizeData";
import { BarChart3, Clock, FolderKanban, Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

type WorkspaceSummary = {
  _id: string;
  slug: string;
  icon?: string;
  name: string;
  type: "engineering" | "onboarding" | "bugs" | "okrs";
  projectCount: number;
  defaultStatuses?: string[];
  customFieldSchema?: unknown[];
};

const WORKSPACE_TYPES = ["engineering", "onboarding", "bugs", "okrs"] as const;
const DEFAULT_STATUS_PRESETS: Record<(typeof WORKSPACE_TYPES)[number], string[]> = {
  engineering: ["Backlog", "To Do", "In Progress", "Review", "Done"],
  onboarding: ["Planned", "Queued", "In Progress", "Blocked", "Complete"],
  bugs: ["Reported", "Triaged", "In Progress", "QA", "Resolved"],
  okrs: ["Draft", "Active", "At Risk", "On Track", "Closed"],
};

const TYPE_ICONS: Record<(typeof WORKSPACE_TYPES)[number], string> = {
  engineering: "🛠️",
  onboarding: "🚀",
  bugs: "🐞",
  okrs: "🎯",
};

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  type: z.enum(WORKSPACE_TYPES),
  icon: z.string().trim().min(1, "Icon is required"),
  defaultStatuses: z.string().trim().min(2, "Add at least one status"),
});

type WorkspaceFormData = {
  name: string;
  slug: string;
  type: (typeof WORKSPACE_TYPES)[number];
  icon: string;
  defaultStatuses: string;
};

const EMPTY_FORM: WorkspaceFormData = {
  name: "",
  slug: "",
  type: "engineering",
  icon: TYPE_ICONS.engineering,
  defaultStatuses: DEFAULT_STATUS_PRESETS.engineering.join(", "),
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PMPage() {
  const router = useRouter();
  const { sessionToken, isLoading: authLoading } = useAuth();
  const [isRefreshing, startRefreshing] = useTransition();
  const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] = useState(false);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<WorkspaceFormData>(EMPTY_FORM);

  const workspaces = useQuery(
    api.modules.pm.workspaces.getWorkspaces,
    sessionToken ? { sessionToken } : "skip"
  ) as WorkspaceSummary[] | undefined;

  const pmStats = useQuery(
    api.modules.pm.workspaces.getPmStats,
    sessionToken ? { sessionToken } : "skip"
  );

  const createWorkspace = useMutation(api.modules.pm.workspaces.createWorkspace);
  const updateWorkspace = useMutation(api.modules.pm.workspaces.updateWorkspace);
  const deleteWorkspace = useMutation(api.modules.pm.workspaces.deleteWorkspace);
  const workspaceRows = useMemo(() => normalizeArray<WorkspaceSummary>(workspaces), [workspaces]);

  const totalProjects = useMemo(
    () => workspaceRows.reduce((sum: number, ws: WorkspaceSummary) => sum + ws.projectCount, 0),
    [workspaceRows]
  );

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const setField = (field: keyof WorkspaceFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value as WorkspaceFormData[keyof WorkspaceFormData] }));
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const openCreateDialog = () => {
    setEditingWorkspaceId(null);
    resetForm();
    setIsWorkspaceDialogOpen(true);
  };

  const openEditDialog = (workspace: WorkspaceSummary) => {
    setEditingWorkspaceId(workspace._id);
    setFormData({
      name: workspace.name,
      slug: workspace.slug,
      type: workspace.type,
      icon: workspace.icon || TYPE_ICONS[workspace.type],
      defaultStatuses: (workspace.defaultStatuses ?? DEFAULT_STATUS_PRESETS[workspace.type]).join(", "),
    });
    setFormErrors({});
    setIsWorkspaceDialogOpen(true);
  };

  const handleTypeChange = (value: string) => {
    const type = value as (typeof WORKSPACE_TYPES)[number];
    setFormData((current) => {
      const shouldReplaceStatuses =
        current.defaultStatuses === DEFAULT_STATUS_PRESETS[current.type].join(", ");
      return {
        ...current,
        type,
        icon: current.icon === TYPE_ICONS[current.type] ? TYPE_ICONS[type] : current.icon,
        defaultStatuses: shouldReplaceStatuses
          ? DEFAULT_STATUS_PRESETS[type].join(", ")
          : current.defaultStatuses,
      };
    });
  };

  const handleSaveWorkspace = async () => {
    if (!sessionToken) return;

    const parsed = workspaceSchema.safeParse({
      ...formData,
      slug: slugify(formData.slug),
    });

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

    const statuses = parsed.data.defaultStatuses
      .split(",")
      .map((status) => status.trim())
      .filter(Boolean);

    if (statuses.length === 0) {
      setFormErrors((current) => ({ ...current, defaultStatuses: "Add at least one status" }));
      return;
    }

    setIsSaving(true);
    try {
      if (editingWorkspaceId) {
        await updateWorkspace({
          sessionToken,
          workspaceId: editingWorkspaceId as any,
          name: parsed.data.name,
          slug: parsed.data.slug,
          icon: parsed.data.icon,
          defaultStatuses: statuses,
        });
        toast.success("Workspace updated.");
      } else {
        await createWorkspace({
          sessionToken,
          name: parsed.data.name,
          slug: parsed.data.slug,
          type: parsed.data.type,
          icon: parsed.data.icon,
          defaultStatuses: statuses,
        });
        toast.success("Workspace created.");
      }

      setIsWorkspaceDialogOpen(false);
      setEditingWorkspaceId(null);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Failed to save workspace:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save workspace.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!sessionToken || !deletingWorkspaceId) return;
    if (!deleteReason.trim()) {
      toast.error("Delete reason is required.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteWorkspace({
        sessionToken,
        workspaceId: deletingWorkspaceId as any,
        reason: deleteReason.trim(),
      });
      toast.success("Workspace deleted.");
      setDeletingWorkspaceId(null);
      setDeleteReason("");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete workspace.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || (sessionToken && workspaces === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!sessionToken) {
    return (
      <Card className="max-w-xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sign in with your normal platform session to access project management.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Management"
        description="Manage engineering work, onboarding delivery, bug tracking, and OKRs with live PM workspace data."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing || isSaving || isDeleting}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Across all workspaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pmStats?.activeTasks ?? 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pmStats?.teamMembers ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active contributors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pmStats?.hoursLoggedThisMonth?.toLocaleString() ?? 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workspaceRows.map((workspace: WorkspaceSummary) => (
          <Card key={workspace._id} className="transition-all duration-200 hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{workspace.icon || TYPE_ICONS[workspace.type]}</div>
                  <div>
                    <CardTitle className="text-lg">{workspace.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {workspace.type}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(workspace)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setDeletingWorkspaceId(workspace._id); setDeleteReason(""); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Projects</span>
                  <span className="font-semibold">{workspace.projectCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statuses</span>
                  <span className="font-semibold">{workspace.defaultStatuses?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Custom Fields</span>
                  <span className="font-semibold">{workspace.customFieldSchema?.length || 0}</span>
                </div>
              </div>
              <Link href={`/platform/pm/${workspace.slug}`} className="mt-4 block">
                <Button className="w-full">Open Workspace</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {workspaceRows.length === 0 && (
        <Card>
          <CardContent>
            <EmptyState
              icon={FolderKanban}
              title="No PM workspaces yet"
              description="Create the first PM workspace here so projects, boards, timelines, and task CRUD have a real home in Convex."
              action={
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </Button>
              }
              className="py-12"
            />
          </CardContent>
        </Card>
      )}

      <Dialog
        open={isWorkspaceDialogOpen}
        onOpenChange={(open) => {
          setIsWorkspaceDialogOpen(open);
          if (!open && !isSaving) {
            setEditingWorkspaceId(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingWorkspaceId ? "Edit Workspace" : "Create Workspace"}</DialogTitle>
            <DialogDescription>
              {editingWorkspaceId
                ? "Update the PM workspace configuration stored in Convex."
                : "Provision a new PM workspace so projects and tasks can be created inside it."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                value={formData.name}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setField("name", nextName);
                  if (!editingWorkspaceId) {
                    setField("slug", slugify(nextName));
                  }
                }}
              />
              {formErrors.name ? <p className="text-xs text-destructive">{formErrors.name}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workspace-slug">Slug</Label>
                <Input id="workspace-slug" value={formData.slug} onChange={(event) => setField("slug", slugify(event.target.value))} />
                {formErrors.slug ? <p className="text-xs text-destructive">{formErrors.slug}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={handleTypeChange} disabled={Boolean(editingWorkspaceId)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKSPACE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workspace-icon">Icon</Label>
                <Input id="workspace-icon" value={formData.icon} onChange={(event) => setField("icon", event.target.value)} />
                {formErrors.icon ? <p className="text-xs text-destructive">{formErrors.icon}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-statuses">Statuses</Label>
                <Textarea
                  id="workspace-statuses"
                  rows={3}
                  value={formData.defaultStatuses}
                  onChange={(event) => setField("defaultStatuses", event.target.value)}
                  placeholder="Backlog, To Do, In Progress, Review, Done"
                />
                {formErrors.defaultStatuses ? <p className="text-xs text-destructive">{formErrors.defaultStatuses}</p> : null}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWorkspaceDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveWorkspace()} disabled={isSaving}>
              {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingWorkspaceId ? "Save Workspace" : "Create Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingWorkspaceId)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingWorkspaceId(null);
            setDeleteReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Deleting a workspace is permanent. Workspaces with projects must be cleared first.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-workspace-reason">Reason</Label>
            <Textarea
              id="delete-workspace-reason"
              rows={4}
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Explain why this workspace is being deleted."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletingWorkspaceId(null);
                setDeleteReason("");
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDeleteWorkspace()} disabled={isDeleting}>
              {isDeleting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
