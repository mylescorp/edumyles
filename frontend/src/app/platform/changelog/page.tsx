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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@/hooks/useSSRSafeConvex";
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
  const [isRefreshing, startRefreshing] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const entries = usePlatformQuery(
    api.platform.changelog.queries.listChangelogs,
    { sessionToken: sessionToken || "", type: filterType === "all" ? undefined : filterType },
    !!sessionToken
  );

  const createEntry = useMutation(api.platform.changelog.mutations.createChangelogEntry);
  const deleteEntry = useMutation(api.platform.changelog.mutations.deleteChangelogEntry);

  const handleCreate = async () => {
    if (!sessionToken || !version || !title || !type) return;
    setIsSaving(true);
    try {
      await createEntry({
        sessionToken,
        version,
        title,
        description,
        type: type as any,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      });
      setIsCreateOpen(false);
      setVersion("");
      setTitle("");
      setDescription("");
      setType("");
      setTags("");
      toast.success("Changelog entry published.");
    } catch (error) {
      console.error("Failed to create entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to publish changelog entry.");
    } finally {
      setIsSaving(false);
    }
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
        description="Platform release notes and version history"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
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
                            <Badge variant="outline" className="font-mono">v{entry.version}</Badge>
                            <Badge className={config.color}>
                              <Icon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            {entry.tags?.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="h-2.5 w-2.5 mr-1" />{tag}
                              </Badge>
                            ))}
                          </div>
                          <h3 className="text-lg font-semibold">{entry.title}</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.date || entry.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
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
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Changelog Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Version</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.2.0" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What changed?" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="auth, api, ui" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!version || !title || !type || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Publish Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
