"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import {
  History,
  Plus,
  Sparkles,
  Bug,
  Zap,
  AlertTriangle,
  Loader2,
  Trash2,
  Tag,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  feature: { icon: Sparkles, color: "bg-blue-100 text-blue-800", label: "Feature" },
  fix: { icon: Bug, color: "bg-red-100 text-red-800", label: "Bug Fix" },
  improvement: { icon: Zap, color: "bg-green-100 text-green-800", label: "Improvement" },
  breaking: { icon: AlertTriangle, color: "bg-orange-100 text-orange-800", label: "Breaking" },
};

const defaultTypeConfig = TYPE_CONFIG.improvement!;

function toLocalDateTimeInput(timestamp?: number) {
  if (timestamp === undefined) return "";
  const date = new Date(timestamp);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function ChangelogPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("");
  const [tags, setTags] = useState("");
  const [panels, setPanels] = useState<string[]>(["admin"]);
  const [moduleSlug, setModuleSlug] = useState("");
  const [workspaceIdsText, setWorkspaceIdsText] = useState("");
  const [linksText, setLinksText] = useState("");
  const [publishState, setPublishState] = useState<"draft" | "scheduled" | "published">(
    "published"
  );
  const [scheduledAt, setScheduledAt] = useState("");
  const [isRefreshing, startRefreshing] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [auditEntryId, setAuditEntryId] = useState<string | null>(null);

  const resetForm = () => {
    setVersion("");
    setTitle("");
    setDescription("");
    setType("");
    setTags("");
    setPanels(["admin"]);
    setModuleSlug("");
    setWorkspaceIdsText("");
    setLinksText("");
    setPublishState("published");
    setScheduledAt("");
    setEditingId(null);
  };

  const entries = usePlatformQuery(
    api.platform.changelog.queries.listChangelogs,
    { sessionToken: sessionToken || "", type: filterType === "all" ? undefined : filterType },
    !!sessionToken
  );

  const createEntry = useMutation(api.platform.changelog.mutations.createChangelogEntry);
  const updateEntry = useMutation(api.platform.changelog.mutations.updateChangelogEntry);
  const deleteEntry = useMutation(api.platform.changelog.mutations.deleteChangelogEntry);
  const audit = useQuery(
    api.platform.changelog.queries.getEntryAudit,
    auditEntryId && sessionToken ? { sessionToken, entryId: auditEntryId as never } : undefined,
    Boolean(auditEntryId && sessionToken)
  );

  const handleCreate = async () => {
    if (!sessionToken || !version || !title || !type) return;
    setIsSaving(true);
    try {
      const input = {
        sessionToken,
        version,
        title,
        description,
        type: type as any,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        panels,
        module: moduleSlug || undefined,
        workspaceIds: workspaceIdsText
          ? workspaceIdsText.split(",").map((value) => value.trim()).filter(Boolean)
          : editingId
            ? []
            : undefined,
        links: linksText
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [label, ...url] = line.split("|");
            return { label: label?.trim() ?? "Learn more", url: url.join("|").trim() };
          })
          .filter((link) => link.url),
        status: publishState,
        scheduledAt: publishState === "scheduled" ? new Date(scheduledAt).getTime() : undefined,
      };
      if (editingId)
        await updateEntry({ ...input, module: moduleSlug || null, entryId: editingId as never });
      else await createEntry(input);
      setIsCreateOpen(false);
      resetForm();
      toast.success(editingId ? "Changelog entry updated." : "Changelog entry saved.");
    } catch (error) {
      console.error("Failed to create entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to publish changelog entry.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (entry: any) => {
    setEditingId(String(entry._id));
    setVersion(entry.version);
    setTitle(entry.title);
    setDescription(entry.description);
    setType(entry.type);
    setTags((entry.tags ?? []).join(", "));
    setPanels(entry.panels ?? [entry.panel ?? "admin"]);
    setModuleSlug(entry.module ?? "");
    setWorkspaceIdsText((entry.workspaceIds ?? []).join(", "));
    setLinksText((entry.links ?? []).map((link: any) => `${link.label} | ${link.url}`).join("\n"));
    setPublishState(entry.status ?? "published");
    setScheduledAt(toLocalDateTimeInput(entry.scheduledAt));
    setIsCreateOpen(true);
  };

  const handleDelete = async (entryId: string) => {
    if (!sessionToken) return;
    setPendingDeleteId(entryId);
    try {
      await deleteEntry({ sessionToken, entryId: entryId as never });
      toast.success("Changelog entry deleted.");
    } catch (error) {
      console.error("Failed to delete entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete changelog entry.");
    } finally {
      setPendingDeleteId(null);
    }
  };

  if (entries === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Changelog"
        description="Draft, preview, schedule, and publish versioned updates for product panels."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => startRefreshing(() => router.refresh())}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Entry
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 mb-4">
        {["all", "feature", "fix", "improvement", "breaking"].map((t) => (
          <Button
            key={t}
            variant={filterType === t ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(t)}
          >
            {t === "all" ? "All" : TYPE_CONFIG[t]?.label || t}
          </Button>
        ))}
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={History}
              title="No changelog entries yet"
              description="Publish the first release note to start building the platform release timeline."
              className="py-12"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {entries.map((entry: any) => {
              const config = TYPE_CONFIG[entry.type] || defaultTypeConfig;
              const Icon = config.icon;
              return (
                <div key={entry._id} className="relative pl-14">
                  <div className="absolute left-4 top-2 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              v{entry.version}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {entry.status ?? "published"}
                            </Badge>
                            {(entry.panels ?? [entry.panel ?? "admin"]).map((panel: string) => (
                              <Badge key={panel} variant="secondary" className="capitalize">
                                {panel}
                              </Badge>
                            ))}
                            <Badge className={config.color}>
                              <Icon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            {entry.tags?.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <h3 className="text-lg font-semibold">{entry.title}</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {entry.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.date || entry.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(entry)}
                            aria-label="Edit release note"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAuditEntryId(String(entry._id))}
                            aria-label="View release note history"
                          >
                            History
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleDelete(String(entry._id))}
                            disabled={pendingDeleteId === String(entry._id)}
                          >
                            {pendingDeleteId === String(entry._id) ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Changelog Entry" : "New Changelog Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Version</Label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.2.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="fix">Bug Fix</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="breaking">Breaking Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What changed?"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="auth, api, ui"
              />
            </div>
            <div className="space-y-2">
              <Label>Panel audience</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3">
                {[
                  "admin",
                  "teacher",
                  "student",
                  "parent",
                  "alumni",
                  "partner",
                  "developer",
                  "affiliate",
                  "reseller",
                  "platform",
                ].map((panel) => (
                  <label key={panel} className="flex items-center gap-2 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={panels.includes(panel)}
                      onChange={(event) =>
                        setPanels((current) =>
                          event.target.checked
                            ? [...current, panel]
                            : current.filter((item) => item !== panel)
                        )
                      }
                    />
                    {panel}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Related module (optional)</Label>
                <Input
                  value={moduleSlug}
                  onChange={(event) => setModuleSlug(event.target.value)}
                  placeholder="finance"
                />
              </div>
              <div className="space-y-2">
                <Label>Publication</Label>
                <Select
                  value={publishState}
                  onValueChange={(value) => setPublishState(value as typeof publishState)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Save draft</SelectItem>
                    <SelectItem value="published">Publish now</SelectItem>
                    <SelectItem value="scheduled">Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Workspace IDs (optional; comma-separated)</Label><Input value={workspaceIdsText} onChange={(event) => setWorkspaceIdsText(event.target.value)} placeholder="Leave empty to show in every matching panel workspace" /></div>
            {publishState === "scheduled" && (
              <div className="space-y-2">
                <Label>Publish at</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Useful links (one per line: label | URL)</Label>
              <Textarea
                value={linksText}
                onChange={(event) => setLinksText(event.target.value)}
                placeholder="Try it | https://app.example.com/admin/finance"
                rows={2}
              />
            </div>
            {title && (
              <Card>
                <CardContent className="space-y-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Preview
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">v{version || "0.0.0"}</Badge>
                    <Badge variant="secondary">{TYPE_CONFIG[type]?.label ?? "Update"}</Badge>
                    <span className="font-medium">{title}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {description || "Your update description will appear here."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Visible in: {panels.join(", ") || "Select at least one panel"}
                  </p>
                </CardContent>
              </Card>
            )}
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={
                !version ||
                !title ||
                !type ||
                panels.length === 0 ||
                (publishState === "scheduled" && !scheduledAt) ||
                isSaving
              }
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isSaving
                ? "Saving…"
                : publishState === "draft"
                  ? "Save Draft"
                  : publishState === "scheduled"
                    ? "Schedule Entry"
                    : editingId
                      ? "Save Changes"
                      : "Publish Entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!auditEntryId} onOpenChange={(open) => !open && setAuditEntryId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publication history</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-auto">
            {audit === undefined ? (
              <p className="text-sm text-muted-foreground">Loading history…</p>
            ) : audit.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history is available.</p>
            ) : (
              audit.map((event: any) => (
                <div key={event._id} className="rounded-lg border p-3">
                  <p className="font-medium capitalize">{event.action.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.actorId} · {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
