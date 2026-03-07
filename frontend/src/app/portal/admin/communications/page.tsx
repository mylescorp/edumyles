"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Mail, Send, BarChart3, Trash2, Megaphone } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

type Announcement = {
  _id: string;
  title: string;
  body: string;
  audience: string;
  priority: string;
  status: string;
  createdAt: number;
  publishedAt?: number;
};

const TABS = [
  { id: "announcements", label: "Announcements", icon: MessageSquare },
  { id: "templates", label: "Templates", icon: Mail },
  { id: "queue", label: "Queue", icon: Send },
  { id: "reports", label: "Reports", icon: BarChart3 },
] as const;

const TEMPLATE_LIBRARY = [
  { name: "Fee Reminder", body: "Dear Parent, this is a reminder that fees are due by {{dueDate}}." },
  { name: "Exam Notice", body: "Upcoming exams begin on {{startDate}}. Please ensure student readiness." },
  { name: "School Event", body: "You are invited to {{eventName}} on {{eventDate}} at {{location}}." },
];

export default function CommunicationsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("announcements");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);

  const announcementsRaw = useQuery(
    api.modules.communications.queries.listAnnouncements,
    sessionToken ? {} : "skip"
  ) as Announcement[] | undefined;

  const createAnnouncement = useMutation(api.modules.communications.mutations.createAnnouncement);
  const publishAnnouncement = useMutation(api.modules.communications.mutations.publishAnnouncement);
  const deleteAnnouncement = useMutation(api.modules.communications.mutations.deleteAnnouncement);

  const announcements = useMemo(() => {
    const base = announcementsRaw ?? [];
    if (statusFilter === "all") return base;
    return base.filter((a) => a.status === statusFilter);
  }, [announcementsRaw, statusFilter]);

  const metrics = useMemo(() => {
    const all = announcementsRaw ?? [];
    return {
      total: all.length,
      published: all.filter((a) => a.status === "published").length,
      drafts: all.filter((a) => a.status !== "published").length,
      highPriority: all.filter((a) => a.priority === "high" || a.priority === "emergency").length,
    };
  }, [announcementsRaw]);

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Missing details", description: "Title and body are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience,
        priority,
        status: "draft",
      });
      setTitle("");
      setBody("");
      setAudience("all");
      setPriority("normal");
      toast({ title: "Announcement created", description: "Saved as draft." });
    } catch (error) {
      toast({ title: "Failed to create", description: String(error), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (announcementId: any) => {
    try {
      await publishAnnouncement({ announcementId });
      toast({ title: "Published", description: "Announcement has been published." });
    } catch (error) {
      toast({ title: "Publish failed", description: String(error), variant: "destructive" });
    }
  };

  const handleDelete = async (announcementId: any) => {
    try {
      await deleteAnnouncement({ announcementId });
      toast({ title: "Deleted", description: "Announcement was removed." });
    } catch (error) {
      toast({ title: "Delete failed", description: String(error), variant: "destructive" });
    }
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        description="Create announcements, manage queue state, and track delivery-facing signals"
      />

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
              activeTab === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "announcements" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                New Announcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-term exam schedule" />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="parents">Parents</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={submitting}>
                {submitting ? "Creating..." : "Save Draft"}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Announcements</CardTitle>
              <Select value={statusFilter} onValueChange={(v: "all" | "draft" | "published") => setStatusFilter(v)}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements found for this filter.</p>
              ) : (
                announcements.map((announcement) => (
                  <div key={announcement._id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium">{announcement.title}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant={announcement.status === "published" ? "default" : "secondary"}>
                          {announcement.status}
                        </Badge>
                        <Badge variant="outline">{announcement.priority}</Badge>
                      </div>
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">{announcement.body}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{announcement.audience}</span>
                      <span>{formatRelativeTime(announcement.createdAt)}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {announcement.status !== "published" && (
                        <Button size="sm" onClick={() => handlePublish(announcement._id)}>
                          Publish
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(announcement._id)}>
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "templates" && (
        <Card>
          <CardHeader>
            <CardTitle>Message Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {TEMPLATE_LIBRARY.map((template) => (
              <div key={template.name} className="rounded-lg border p-3">
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">{template.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "queue" && (
        <Card>
          <CardHeader>
            <CardTitle>Message Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(announcementsRaw ?? []).slice(0, 20).map((announcement) => (
              <div key={announcement._id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{announcement.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(announcement.createdAt)}</p>
                </div>
                <Badge variant={announcement.status === "published" ? "default" : "secondary"}>
                  {announcement.status}
                </Badge>
              </div>
            ))}
            {(announcementsRaw ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Queue is empty.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "reports" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{metrics.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">Published</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{metrics.published}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">Drafts</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{metrics.drafts}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">High Priority</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{metrics.highPriority}</div></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
