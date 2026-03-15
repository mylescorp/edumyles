"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Megaphone,
  MessageSquare,
  Bell,
  FileText,
  Radio,
  Settings,
  Send,
  Plus,
  Trash2,
  Eye,
  CheckCheck,
  Circle,
  Users,
  Mail,
  Smartphone,
  BellRing,
  Monitor,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";
import { hasPermission } from "@/lib/permissions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Announcement = {
  _id: string;
  title: string;
  body: string;
  audience: string;
  priority: string;
  status: string;
  createdAt: number;
  publishedAt?: number;
  authorName?: string;
};

type Conversation = {
  _id: string;
  type: string;
  name?: string;
  participants: string[];
  lastMessageAt?: number;
  lastMessagePreview?: string;
  unreadCount?: number;
};

type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: number;
};

type Notification = {
  _id: string;
  title: string;
  body: string;
  category?: string;
  isRead: boolean;
  link?: string;
  createdAt: number;
};

type Template = {
  _id: string;
  name: string;
  body: string;
  category?: string;
  isGlobal?: boolean;
  createdAt: number;
};

type NotificationPreferences = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  categories?: Record<string, boolean>;
};

type CommunicationsStats = {
  totalAnnouncements: number;
  publishedAnnouncements: number;
  draftAnnouncements: number;
  totalConversations: number;
  unreadNotifications: number;
  totalMessages: number;
};

// ---------------------------------------------------------------------------
// Priority badge color helper
// ---------------------------------------------------------------------------

function priorityVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "emergency":
      return "destructive";
    case "high":
      return "default";
    case "normal":
      return "secondary";
    default:
      return "outline";
  }
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId = "announcements" | "messages" | "notifications" | "templates" | "broadcast" | "settings";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ElementType;
  permission?: string; // if undefined, visible to all
}

const ALL_TABS: TabDef[] = [
  { id: "announcements", label: "Announcements", icon: Megaphone, permission: "communications:read" },
  { id: "messages", label: "Messages", icon: MessageSquare, permission: "communications:messaging" },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "templates", label: "Templates", icon: FileText, permission: "communications:templates" },
  { id: "broadcast", label: "Broadcast", icon: Radio, permission: "communications:broadcast" },
  { id: "settings", label: "Settings", icon: Settings },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CommunicationsPage() {
  const { isLoading, sessionToken, role } = useAuth();
  const { toast } = useToast();

  // Determine which tabs are visible based on role
  const visibleTabs = useMemo(() => {
    if (!role) return [];
    return ALL_TABS.filter((tab) => {
      if (!tab.permission) return true;
      return hasPermission(role, tab.permission);
    });
  }, [role]);

  const [activeTab, setActiveTab] = useState<TabId>("announcements");

  // Reset to first visible tab if active tab is not visible
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  const canWrite = role ? hasPermission(role, "communications:write") : false;

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const announcements = useQuery(
    api.modules.communications.queries.listAnnouncements,
    sessionToken ? { sessionToken } : "skip"
  ) as Announcement[] | undefined;

  const notifications = useQuery(
    api.modules.communications.queries.listMyNotifications,
    sessionToken ? { sessionToken, limit: 50 } : "skip"
  ) as Notification[] | undefined;

  const conversations = useQuery(
    api.modules.communications.queries.listMyConversations,
    sessionToken ? { sessionToken, limit: 50 } : "skip"
  ) as Conversation[] | undefined;

  const preferences = useQuery(
    api.modules.communications.queries.getMyNotificationPreferences,
    sessionToken ? { sessionToken } : "skip"
  ) as NotificationPreferences | undefined;

  const stats = useQuery(
    api.modules.communications.queries.getCommunicationsStats,
    sessionToken ? { sessionToken } : "skip"
  ) as CommunicationsStats | undefined;

  const templates = useQuery(
    api.modules.communications.queries.listTemplates,
    sessionToken && role && hasPermission(role, "communications:templates")
      ? { sessionToken }
      : "skip"
  ) as Template[] | undefined;

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const createAnnouncement = useMutation(api.modules.communications.mutations.createAnnouncement);
  const publishAnnouncement = useMutation(api.modules.communications.mutations.publishAnnouncement);
  const deleteAnnouncement = useMutation(api.modules.communications.mutations.deleteAnnouncement);
  const createConversation = useMutation(api.modules.communications.mutations.createConversation);
  const sendMessage = useMutation(api.modules.communications.mutations.sendMessage);
  const markConversationRead = useMutation(api.modules.communications.mutations.markConversationRead);
  const updateNotificationPreferences = useMutation(
    api.modules.communications.mutations.updateNotificationPreferences
  );
  const sendBroadcast = useMutation(api.modules.communications.mutations.sendBroadcast);

  // -------------------------------------------------------------------------
  // Announcements state
  // -------------------------------------------------------------------------

  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annAudience, setAnnAudience] = useState("all");
  const [annPriority, setAnnPriority] = useState("normal");
  const [annSubmitting, setAnnSubmitting] = useState(false);

  const filteredAnnouncements = useMemo(() => {
    const base = announcements ?? [];
    if (statusFilter === "all") return base;
    return base.filter((a) => a.status === statusFilter);
  }, [announcements, statusFilter]);

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) {
      toast({ title: "Missing details", description: "Title and body are required.", variant: "destructive" });
      return;
    }
    setAnnSubmitting(true);
    try {
      await createAnnouncement({
        title: annTitle.trim(),
        body: annBody.trim(),
        audience: annAudience,
        priority: annPriority,
        status: "draft",
      });
      setAnnTitle("");
      setAnnBody("");
      setAnnAudience("all");
      setAnnPriority("normal");
      toast({ title: "Announcement created", description: "Saved as draft." });
    } catch (error) {
      toast({ title: "Failed to create", description: String(error), variant: "destructive" });
    } finally {
      setAnnSubmitting(false);
    }
  };

  const handlePublish = async (announcementId: string) => {
    try {
      await publishAnnouncement({ announcementId });
      toast({ title: "Published", description: "Announcement is now live." });
    } catch (error) {
      toast({ title: "Publish failed", description: String(error), variant: "destructive" });
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      await deleteAnnouncement({ announcementId });
      toast({ title: "Deleted", description: "Announcement removed." });
    } catch (error) {
      toast({ title: "Delete failed", description: String(error), variant: "destructive" });
    }
  };

  // -------------------------------------------------------------------------
  // Messages state
  // -------------------------------------------------------------------------

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConvoName, setNewConvoName] = useState("");
  const [newConvoParticipants, setNewConvoParticipants] = useState("");
  const [newConvoMessage, setNewConvoMessage] = useState("");
  const [creatingConvo, setCreatingConvo] = useState(false);

  const conversationMessages = useQuery(
    api.modules.communications.queries.getConversationMessages,
    sessionToken && selectedConversationId
      ? { sessionToken, conversationId: selectedConversationId, limit: 100 }
      : "skip"
  ) as Message[] | undefined;

  // Mark conversation as read when opened
  useEffect(() => {
    if (selectedConversationId && sessionToken) {
      markConversationRead({ conversationId: selectedConversationId }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId) return;
    setSendingMessage(true);
    try {
      await sendMessage({ conversationId: selectedConversationId, content: messageInput.trim() });
      setMessageInput("");
    } catch (error) {
      toast({ title: "Send failed", description: String(error), variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!newConvoParticipants.trim()) {
      toast({ title: "Missing participants", description: "Add at least one participant.", variant: "destructive" });
      return;
    }
    setCreatingConvo(true);
    try {
      const participants = newConvoParticipants.split(",").map((p) => p.trim()).filter(Boolean);
      await createConversation({
        type: participants.length > 1 ? "group" : "direct",
        name: newConvoName.trim() || undefined,
        participants,
        initialMessage: newConvoMessage.trim() || undefined,
      });
      setShowNewConversation(false);
      setNewConvoName("");
      setNewConvoParticipants("");
      setNewConvoMessage("");
      toast({ title: "Conversation created" });
    } catch (error) {
      toast({ title: "Failed", description: String(error), variant: "destructive" });
    } finally {
      setCreatingConvo(false);
    }
  };

  // -------------------------------------------------------------------------
  // Broadcast state
  // -------------------------------------------------------------------------

  const [bcChannels, setBcChannels] = useState<string[]>(["in_app"]);
  const [bcSubject, setBcSubject] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [bcAudience, setBcAudience] = useState("all");
  const [bcSending, setBcSending] = useState(false);

  const toggleChannel = (channel: string) => {
    setBcChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handleSendBroadcast = async () => {
    if (!bcMessage.trim()) {
      toast({ title: "Missing message", description: "Broadcast message is required.", variant: "destructive" });
      return;
    }
    if (bcChannels.length === 0) {
      toast({ title: "No channels", description: "Select at least one channel.", variant: "destructive" });
      return;
    }
    setBcSending(true);
    try {
      await sendBroadcast({
        channels: bcChannels,
        subject: bcSubject.trim() || undefined,
        message: bcMessage.trim(),
        audience: bcAudience,
      });
      setBcSubject("");
      setBcMessage("");
      setBcChannels(["in_app"]);
      setBcAudience("all");
      toast({ title: "Broadcast sent", description: "Your message has been dispatched." });
    } catch (error) {
      toast({ title: "Broadcast failed", description: String(error), variant: "destructive" });
    } finally {
      setBcSending(false);
    }
  };

  // -------------------------------------------------------------------------
  // Settings state
  // -------------------------------------------------------------------------

  const [prefsLocal, setPrefsLocal] = useState<NotificationPreferences | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (preferences && !prefsLocal) {
      setPrefsLocal({ ...preferences });
    }
  }, [preferences, prefsLocal]);

  const handleTogglePref = (key: keyof Omit<NotificationPreferences, "categories">) => {
    setPrefsLocal((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  const handleToggleCategory = (category: string) => {
    setPrefsLocal((prev) => {
      if (!prev) return prev;
      const cats = { ...(prev.categories ?? {}) };
      cats[category] = !cats[category];
      return { ...prev, categories: cats };
    });
  };

  const handleSavePrefs = async () => {
    if (!prefsLocal) return;
    setSavingPrefs(true);
    try {
      await updateNotificationPreferences({
        emailEnabled: prefsLocal.emailEnabled,
        smsEnabled: prefsLocal.smsEnabled,
        pushEnabled: prefsLocal.pushEnabled,
        inAppEnabled: prefsLocal.inAppEnabled,
        categories: prefsLocal.categories,
      });
      toast({ title: "Preferences saved" });
    } catch (error) {
      toast({ title: "Save failed", description: String(error), variant: "destructive" });
    } finally {
      setSavingPrefs(false);
    }
  };

  // -------------------------------------------------------------------------
  // Category labels for settings
  // -------------------------------------------------------------------------

  const NOTIFICATION_CATEGORIES = [
    { id: "announcements", label: "Announcements" },
    { id: "academic", label: "Academic" },
    { id: "finance", label: "Finance" },
    { id: "system", label: "System" },
    { id: "marketing", label: "Marketing" },
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        description="Manage announcements, messages, notifications, and broadcasts"
      />

      {/* Stats summary row */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.publishedAnnouncements}</p>
                <p className="text-xs text-muted-foreground">Published Announcements</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
                <p className="text-xs text-muted-foreground">Conversations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.unreadNotifications}</p>
                <p className="text-xs text-muted-foreground">Unread Notifications</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Send className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
                <p className="text-xs text-muted-foreground">Total Messages</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* =============================================================== */}
        {/* ANNOUNCEMENTS TAB                                               */}
        {/* =============================================================== */}
        <TabsContent value="announcements" className="mt-6">
          <div className={`grid gap-6 ${canWrite ? "lg:grid-cols-3" : ""}`}>
            {/* Create form (admin roles only) */}
            {canWrite && (
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="h-4 w-4" />
                    New Announcement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Mid-term exam schedule"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={annBody}
                      onChange={(e) => setAnnBody(e.target.value)}
                      rows={5}
                      placeholder="Write your announcement..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Select value={annAudience} onValueChange={setAnnAudience}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All users</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                        <SelectItem value="teachers">Teachers</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={annPriority} onValueChange={setAnnPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleCreateAnnouncement} disabled={annSubmitting}>
                    {annSubmitting ? "Creating..." : "Save Draft"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Announcement list */}
            <Card className={canWrite ? "lg:col-span-2" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Announcements</CardTitle>
                {canWrite && (
                  <Select
                    value={statusFilter}
                    onValueChange={(v: "all" | "draft" | "published") => setStatusFilter(v)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="draft">Drafts</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredAnnouncements.length === 0 ? (
                  <EmptyState
                    icon={Megaphone}
                    title="No announcements"
                    description="There are no announcements to display."
                    className="py-12"
                  />
                ) : (
                  filteredAnnouncements.map((announcement) => (
                    <div
                      key={announcement._id}
                      className={`rounded-lg border p-4 ${
                        announcement.priority === "emergency"
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
                          : announcement.priority === "high"
                            ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
                            : ""
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={priorityVariant(announcement.priority)}>
                            {announcement.priority}
                          </Badge>
                          <Badge variant={announcement.status === "published" ? "default" : "secondary"}>
                            {announcement.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="mb-3 text-sm text-muted-foreground whitespace-pre-wrap">
                        {announcement.body}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {announcement.audience}
                          </span>
                          {announcement.authorName && <span>by {announcement.authorName}</span>}
                        </div>
                        <span>{formatRelativeTime(announcement.createdAt)}</span>
                      </div>

                      {/* Admin actions */}
                      {canWrite && (
                        <div className="mt-3 flex gap-2 border-t pt-3">
                          {announcement.status !== "published" && (
                            <Button size="sm" onClick={() => handlePublish(announcement._id)}>
                              <Eye className="mr-1 h-3 w-3" />
                              Publish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteAnnouncement(announcement._id)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =============================================================== */}
        {/* MESSAGES TAB                                                    */}
        {/* =============================================================== */}
        <TabsContent value="messages" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-3" style={{ minHeight: 500 }}>
            {/* Conversation list sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">Conversations</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowNewConversation(true)}>
                  <Plus className="mr-1 h-3 w-3" />
                  New
                </Button>
              </CardHeader>
              <CardContent className="space-y-1 p-2">
                {/* New conversation form */}
                {showNewConversation && (
                  <div className="mb-3 space-y-3 rounded-lg border bg-muted/50 p-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Group Name (optional)</Label>
                      <Input
                        value={newConvoName}
                        onChange={(e) => setNewConvoName(e.target.value)}
                        placeholder="e.g. Study Group"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Participants (comma-separated IDs)</Label>
                      <Input
                        value={newConvoParticipants}
                        onChange={(e) => setNewConvoParticipants(e.target.value)}
                        placeholder="user1, user2"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">First Message (optional)</Label>
                      <Textarea
                        value={newConvoMessage}
                        onChange={(e) => setNewConvoMessage(e.target.value)}
                        rows={2}
                        placeholder="Hello..."
                        className="text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCreateConversation} disabled={creatingConvo}>
                        {creatingConvo ? "Creating..." : "Create"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowNewConversation(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Conversation list */}
                {!conversations || conversations.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No conversations"
                    description="Start a new conversation to begin messaging."
                    className="py-10"
                  />
                ) : (
                  conversations.map((convo) => (
                    <button
                      key={convo._id}
                      onClick={() => setSelectedConversationId(convo._id)}
                      className={`w-full rounded-lg p-3 text-left transition-colors ${
                        selectedConversationId === convo._id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {convo.name || `Conversation`}
                        </span>
                        {(convo.unreadCount ?? 0) > 0 && (
                          <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0">
                            {convo.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {convo.lastMessagePreview && (
                        <p className="mt-1 text-xs text-muted-foreground truncate">
                          {convo.lastMessagePreview}
                        </p>
                      )}
                      {convo.lastMessageAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatRelativeTime(convo.lastMessageAt)}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Message thread */}
            <Card className="lg:col-span-2 flex flex-col">
              {selectedConversationId ? (
                <>
                  <CardHeader className="border-b pb-3">
                    <CardTitle className="text-base">
                      {conversations?.find((c) => c._id === selectedConversationId)?.name ||
                        "Conversation"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 400 }}>
                    {!conversationMessages || conversationMessages.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        No messages yet. Start the conversation!
                      </p>
                    ) : (
                      conversationMessages.map((msg) => (
                        <div key={msg._id} className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium">
                              {msg.senderName || msg.senderId}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm mt-0.5 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                  <div className="border-t p-3 flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={sendingMessage || !messageInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <EmptyState
                    icon={MessageSquare}
                    title="Select a conversation"
                    description="Choose a conversation from the list or start a new one."
                    className="py-10"
                  />
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* =============================================================== */}
        {/* NOTIFICATIONS TAB                                               */}
        {/* =============================================================== */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {notifications && notifications.filter((n) => !n.isRead).length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {notifications.filter((n) => !n.isRead).length} unread
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!notifications || notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No notifications"
                  description="You're all caught up! New notifications will appear here."
                  className="py-12"
                />
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      notification.isRead ? "opacity-70" : "bg-primary/5 border-primary/20"
                    } ${notification.link ? "cursor-pointer hover:bg-muted" : ""}`}
                    onClick={() => {
                      if (notification.link) {
                        window.location.href = notification.link;
                      }
                    }}
                  >
                    <div className="mt-1 shrink-0">
                      {notification.isRead ? (
                        <CheckCheck className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Circle className="h-4 w-4 fill-primary text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm ${notification.isRead ? "" : "font-medium"}`}>
                          {notification.title}
                        </h4>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{notification.body}</p>
                      {notification.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {notification.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============================================================== */}
        {/* TEMPLATES TAB                                                   */}
        {/* =============================================================== */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Message Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!templates || templates.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No templates"
                  description="Templates for common messages will appear here."
                  className="py-12"
                />
              ) : (
                templates.map((template) => (
                  <div key={template._id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <div className="flex items-center gap-2">
                        {template.isGlobal && (
                          <Badge variant="outline" className="text-xs">
                            Global
                          </Badge>
                        )}
                        {template.category && (
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {template.body}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Created {formatDate(template.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============================================================== */}
        {/* BROADCAST TAB                                                   */}
        {/* =============================================================== */}
        <TabsContent value="broadcast" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Radio className="h-4 w-4" />
                Send Broadcast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Channels */}
              <div className="space-y-3">
                <Label>Channels</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "email", label: "Email", icon: Mail },
                    { id: "sms", label: "SMS", icon: Smartphone },
                    { id: "push", label: "Push", icon: BellRing },
                    { id: "in_app", label: "In-App", icon: Monitor },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleChannel(id)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        bcChannels.includes(id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience */}
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={bcAudience} onValueChange={setBcAudience}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="parents">Parents</SelectItem>
                    <SelectItem value="teachers">Teachers</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label>Subject (optional)</Label>
                <Input
                  value={bcSubject}
                  onChange={(e) => setBcSubject(e.target.value)}
                  placeholder="e.g. Important Update"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={bcMessage}
                  onChange={(e) => setBcMessage(e.target.value)}
                  rows={5}
                  placeholder="Write your broadcast message..."
                />
              </div>

              <Button onClick={handleSendBroadcast} disabled={bcSending} className="w-full">
                {bcSending ? "Sending..." : "Send Broadcast"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============================================================== */}
        {/* SETTINGS TAB                                                    */}
        {/* =============================================================== */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Channel preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "emailEnabled" as const, label: "Email Notifications", description: "Receive notifications via email", icon: Mail },
                  { key: "smsEnabled" as const, label: "SMS Notifications", description: "Receive notifications via text message", icon: Smartphone },
                  { key: "pushEnabled" as const, label: "Push Notifications", description: "Receive browser push notifications", icon: BellRing },
                  { key: "inAppEnabled" as const, label: "In-App Notifications", description: "Receive notifications within the app", icon: Monitor },
                ].map(({ key, label, description, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={prefsLocal?.[key] ?? true}
                      onCheckedChange={() => handleTogglePref(key)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Category preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {NOTIFICATION_CATEGORIES.map(({ id, label }) => (
                  <div key={id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        Receive {label.toLowerCase()} notifications
                      </p>
                    </div>
                    <Switch
                      checked={prefsLocal?.categories?.[id] ?? true}
                      onCheckedChange={() => handleToggleCategory(id)}
                    />
                  </div>
                ))}

                <Button onClick={handleSavePrefs} disabled={savingPrefs} className="w-full mt-4">
                  {savingPrefs ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
