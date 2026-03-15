"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { hasPermission } from "@/lib/permissions";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import Link from "next/link";
import {
  Plus,
  Bell,
  MessageSquare,
  Send,
  Users,
  Mail,
  Megaphone,
  LayoutTemplate,
  BarChart3,
  Rocket,
  Trash2,
  Eye,
  Radio,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";

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
};

type Campaign = {
  _id: string;
  name: string;
  description?: string;
  channels: string[];
  status: string;
  targetAudience: { type: string; roles?: string[] };
  scheduledFor?: number;
  createdAt: number;
};

type Template = {
  _id: string;
  name: string;
  description?: string;
  category: string;
  channels: string[];
  subject?: string;
  content: string;
  variables: string[];
  createdAt: number;
};

type Conversation = {
  _id: string;
  type: string;
  name?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: number;
  createdAt: number;
};

type Notification = {
  _id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const priorityColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  normal: "outline",
  high: "secondary",
  emergency: "destructive",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  draft: "secondary",
  active: "default",
  paused: "outline",
  completed: "secondary",
  sent: "default",
  scheduled: "outline",
};

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "students", label: "Students" },
  { value: "parents", label: "Parents" },
  { value: "staff", label: "Staff" },
  { value: "teachers", label: "Teachers" },
];

const PRIORITY_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "emergency", label: "Emergency" },
];

const CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push Notification" },
  { value: "in_app", label: "In-App" },
];

const TEMPLATE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "academic", label: "Academic" },
  { value: "finance", label: "Finance" },
  { value: "events", label: "Events" },
  { value: "emergency", label: "Emergency" },
];

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function CommunicationsPage() {
  const { isLoading, sessionToken, role } = useAuth();
  const { toast } = useToast();

  // ---- Queries ----
  const stats = usePlatformQuery(
    api.modules.communications.queries.getCommunicationsStats,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );

  const announcements = usePlatformQuery(
    api.modules.communications.queries.listAnnouncements,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );

  const campaigns = usePlatformQuery(
    api.modules.communications.queries.listCampaigns,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken && hasPermission(role ?? "", "communications:campaigns")
  );

  const templates = usePlatformQuery(
    api.modules.communications.queries.listTemplates,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken && hasPermission(role ?? "", "communications:templates")
  );

  const conversations = usePlatformQuery(
    api.modules.communications.queries.listMyConversations,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken && hasPermission(role ?? "", "communications:messaging")
  );

  const notifications = usePlatformQuery(
    api.modules.communications.queries.listMyNotifications,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );

  // ---- Mutations ----
  const createAnnouncement = useMutation(api.modules.communications.mutations.createAnnouncement);
  const publishAnnouncement = useMutation(api.modules.communications.mutations.publishAnnouncement);
  const deleteAnnouncement = useMutation(api.modules.communications.mutations.deleteAnnouncement);
  const createCampaign = useMutation(api.modules.communications.mutations.createCampaign);
  const launchCampaign = useMutation(api.modules.communications.mutations.launchCampaign);
  const createTemplate = useMutation(api.modules.communications.mutations.createTemplate);
  const deleteTemplate = useMutation(api.modules.communications.mutations.deleteTemplate);
  const sendBroadcast = useMutation(api.modules.communications.mutations.sendBroadcast);
  const createConversation = useMutation(api.modules.communications.mutations.createConversation);
  const sendMessage = useMutation(api.modules.communications.mutations.sendMessage);

  // ---- Local State ----
  const [activeTab, setActiveTab] = useState("dashboard");

  // Announcement form
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annAudience, setAnnAudience] = useState("all");
  const [annPriority, setAnnPriority] = useState("normal");
  const [annStatusFilter, setAnnStatusFilter] = useState("all");
  const [annSubmitting, setAnnSubmitting] = useState(false);

  // Campaign dialog
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campName, setCampName] = useState("");
  const [campDescription, setCampDescription] = useState("");
  const [campChannels, setCampChannels] = useState<string[]>([]);
  const [campMessage, setCampMessage] = useState("");
  const [campSubject, setCampSubject] = useState("");
  const [campAudienceType, setCampAudienceType] = useState("all");
  const [campScheduledFor, setCampScheduledFor] = useState("");
  const [campSubmitting, setCampSubmitting] = useState(false);

  // Broadcast form
  const [bcChannels, setBcChannels] = useState<string[]>([]);
  const [bcSubject, setBcSubject] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [bcAudience, setBcAudience] = useState("all");
  const [bcSubmitting, setBcSubmitting] = useState(false);

  // Template dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplDescription, setTplDescription] = useState("");
  const [tplCategory, setTplCategory] = useState("general");
  const [tplChannels, setTplChannels] = useState<string[]>([]);
  const [tplSubject, setTplSubject] = useState("");
  const [tplContent, setTplContent] = useState("");
  const [tplVariables, setTplVariables] = useState("");
  const [tplSubmitting, setTplSubmitting] = useState(false);

  // Messaging
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [msgSubmitting, setMsgSubmitting] = useState(false);
  const [newConvoDialogOpen, setNewConvoDialogOpen] = useState(false);
  const [newConvoName, setNewConvoName] = useState("");
  const [newConvoParticipants, setNewConvoParticipants] = useState("");
  const [newConvoMessage, setNewConvoMessage] = useState("");
  const [newConvoSubmitting, setNewConvoSubmitting] = useState(false);

  // ---- Loading ----
  if (isLoading) return <LoadingSkeleton variant="page" />;

  // ---- Helpers ----
  const canCampaigns = hasPermission(role ?? "", "communications:campaigns");
  const canBroadcast = hasPermission(role ?? "", "communications:broadcast");
  const canTemplates = hasPermission(role ?? "", "communications:templates");
  const canMessaging = hasPermission(role ?? "", "communications:messaging");

  const toggleChannel = (
    channel: string,
    current: string[],
    setter: (v: string[]) => void
  ) => {
    setter(
      current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel]
    );
  };

  // ---- Handlers ----

  async function handleCreateAnnouncement(status: "draft" | "published") {
    if (!annTitle.trim() || !annBody.trim()) {
      toast({ title: "Validation Error", description: "Title and body are required.", variant: "destructive" });
      return;
    }
    setAnnSubmitting(true);
    try {
      await createAnnouncement({
        title: annTitle.trim(),
        body: annBody.trim(),
        audience: annAudience,
        priority: annPriority,
        status,
      });
      toast({ title: "Announcement Created", description: `Announcement saved as ${status}.` });
      setAnnTitle("");
      setAnnBody("");
      setAnnAudience("all");
      setAnnPriority("normal");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to create announcement.", variant: "destructive" });
    } finally {
      setAnnSubmitting(false);
    }
  }

  async function handlePublishAnnouncement(announcementId: string) {
    try {
      await publishAnnouncement({ announcementId: announcementId as any });
      toast({ title: "Published", description: "Announcement is now live." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to publish.", variant: "destructive" });
    }
  }

  async function handleDeleteAnnouncement(announcementId: string) {
    try {
      await deleteAnnouncement({ announcementId: announcementId as any });
      toast({ title: "Deleted", description: "Announcement removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to delete.", variant: "destructive" });
    }
  }

  async function handleCreateCampaign() {
    if (!campName.trim() || !campMessage.trim() || campChannels.length === 0) {
      toast({ title: "Validation Error", description: "Name, channels, and message are required.", variant: "destructive" });
      return;
    }
    setCampSubmitting(true);
    try {
      await createCampaign({
        name: campName.trim(),
        description: campDescription.trim() || undefined,
        channels: campChannels,
        message: campMessage.trim(),
        subject: campSubject.trim() || undefined,
        targetAudience: { type: campAudienceType },
        scheduledFor: campScheduledFor ? new Date(campScheduledFor).getTime() : undefined,
      });
      toast({ title: "Campaign Created", description: "Your campaign has been saved." });
      setCampaignDialogOpen(false);
      setCampName("");
      setCampDescription("");
      setCampChannels([]);
      setCampMessage("");
      setCampSubject("");
      setCampAudienceType("all");
      setCampScheduledFor("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to create campaign.", variant: "destructive" });
    } finally {
      setCampSubmitting(false);
    }
  }

  async function handleLaunchCampaign(campaignId: string) {
    try {
      await launchCampaign({ campaignId: campaignId as any });
      toast({ title: "Launched", description: "Campaign is now active." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to launch campaign.", variant: "destructive" });
    }
  }

  async function handleSendBroadcast() {
    if (bcChannels.length === 0 || !bcMessage.trim()) {
      toast({ title: "Validation Error", description: "Select at least one channel and enter a message.", variant: "destructive" });
      return;
    }
    setBcSubmitting(true);
    try {
      await sendBroadcast({
        channels: bcChannels,
        subject: bcSubject.trim() || undefined,
        message: bcMessage.trim(),
        audience: bcAudience,
      });
      toast({ title: "Broadcast Sent", description: "Your broadcast has been delivered." });
      setBcChannels([]);
      setBcSubject("");
      setBcMessage("");
      setBcAudience("all");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to send broadcast.", variant: "destructive" });
    } finally {
      setBcSubmitting(false);
    }
  }

  async function handleCreateTemplate() {
    if (!tplName.trim() || !tplContent.trim() || tplChannels.length === 0) {
      toast({ title: "Validation Error", description: "Name, channels, and content are required.", variant: "destructive" });
      return;
    }
    setTplSubmitting(true);
    try {
      await createTemplate({
        name: tplName.trim(),
        description: tplDescription.trim() || undefined,
        category: tplCategory,
        channels: tplChannels,
        subject: tplSubject.trim() || undefined,
        content: tplContent.trim(),
        variables: tplVariables
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      });
      toast({ title: "Template Created", description: "Your template has been saved." });
      setTemplateDialogOpen(false);
      setTplName("");
      setTplDescription("");
      setTplCategory("general");
      setTplChannels([]);
      setTplSubject("");
      setTplContent("");
      setTplVariables("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to create template.", variant: "destructive" });
    } finally {
      setTplSubmitting(false);
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    try {
      await deleteTemplate({ templateId: templateId as any });
      toast({ title: "Deleted", description: "Template removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to delete template.", variant: "destructive" });
    }
  }

  async function handleSendMessage() {
    if (!selectedConversation || !newMessageContent.trim()) return;
    setMsgSubmitting(true);
    try {
      await sendMessage({
        conversationId: selectedConversation as any,
        content: newMessageContent.trim(),
      });
      setNewMessageContent("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to send message.", variant: "destructive" });
    } finally {
      setMsgSubmitting(false);
    }
  }

  async function handleCreateConversation() {
    if (!newConvoParticipants.trim()) {
      toast({ title: "Validation Error", description: "Add at least one participant.", variant: "destructive" });
      return;
    }
    setNewConvoSubmitting(true);
    try {
      await createConversation({
        type: "direct",
        name: newConvoName.trim() || undefined,
        participants: newConvoParticipants
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        initialMessage: newConvoMessage.trim() || undefined,
      });
      toast({ title: "Conversation Created", description: "You can now start messaging." });
      setNewConvoDialogOpen(false);
      setNewConvoName("");
      setNewConvoParticipants("");
      setNewConvoMessage("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to create conversation.", variant: "destructive" });
    } finally {
      setNewConvoSubmitting(false);
    }
  }

  // ---- Filtered announcements ----
  const filteredAnnouncements =
    annStatusFilter === "all"
      ? ((announcements as Announcement[]) ?? [])
      : ((announcements as Announcement[]) ?? []).filter(
          (a) => a.status === annStatusFilter
        );

  // ---- Announcement Columns ----
  const announcementColumns: Column<Announcement>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      cell: (row) => (
        <span className="font-medium">{row.title}</span>
      ),
    },
    {
      key: "audience",
      header: "Audience",
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.audience}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (row) => (
        <Badge variant={priorityColors[row.priority] ?? "outline"} className="capitalize">
          {row.priority}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={statusColors[row.status] ?? "secondary"} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.status === "draft" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePublishAnnouncement(row._id)}
              title="Publish"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteAnnouncement(row._id)}
            title="Delete"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ---- Campaign Columns ----
  const campaignColumns: Column<Campaign>[] = [
    {
      key: "name",
      header: "Campaign",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-medium">{row.name}</span>
          {row.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "channels",
      header: "Channels",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.channels.map((ch) => (
            <Badge key={ch} variant="outline" className="text-xs capitalize">
              {ch}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "targetAudience",
      header: "Audience",
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.targetAudience.type}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={statusColors[row.status] ?? "secondary"} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      key: "scheduledFor",
      header: "Scheduled",
      cell: (row) =>
        row.scheduledFor ? formatDate(row.scheduledFor) : <span className="text-muted-foreground">--</span>,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          {(row.status === "draft" || row.status === "scheduled") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLaunchCampaign(row._id)}
              title="Launch"
            >
              <Rocket className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ---- Template Columns ----
  const templateColumns: Column<Template>[] = [
    {
      key: "name",
      header: "Template",
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-medium">{row.name}</span>
          {row.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.category}
        </Badge>
      ),
    },
    {
      key: "channels",
      header: "Channels",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.channels.map((ch) => (
            <Badge key={ch} variant="outline" className="text-xs capitalize">
              {ch}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "variables",
      header: "Variables",
      cell: (row) =>
        row.variables.length > 0 ? (
          <span className="text-xs text-muted-foreground">
            {row.variables.join(", ")}
          </span>
        ) : (
          <span className="text-muted-foreground">--</span>
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteTemplate(row._id)}
          title="Delete"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // ---- Stats data ----
  const statsData = stats as {
    totalMessages: number;
    activeCampaigns: number;
    deliveryRate: number;
    openRate: number;
    totalNotifications: number;
    unreadNotifications: number;
  } | undefined;

  const notificationsList = (notifications as Notification[]) ?? [];
  const unreadCount = notificationsList.filter((n) => !n.read).length;

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        description="Manage announcements, campaigns, broadcasts, and messaging for your school community"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Communications" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5">
            <Bell className="h-4 w-4" />
            Announcements
          </TabsTrigger>
          {canCampaigns && (
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Megaphone className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
          )}
          {canBroadcast && (
            <TabsTrigger value="broadcast" className="gap-1.5">
              <Radio className="h-4 w-4" />
              Broadcast
            </TabsTrigger>
          )}
          {canTemplates && (
            <TabsTrigger value="templates" className="gap-1.5">
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </TabsTrigger>
          )}
          {canMessaging && (
            <TabsTrigger value="messages" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
          )}
        </TabsList>

        {/* ================================================================
            TAB: Dashboard
        ================================================================ */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <AdminStatsCard
              title="Total Messages"
              value={statsData?.totalMessages?.toLocaleString() ?? "0"}
              description="Messages sent this month"
              icon={MessageSquare}
              trend={{ value: 15, isPositive: true }}
            />
            <AdminStatsCard
              title="Active Campaigns"
              value={statsData?.activeCampaigns ?? 0}
              description="Currently running"
              icon={Megaphone}
              variant="warning"
            />
            <AdminStatsCard
              title="Delivery Rate"
              value={`${statsData?.deliveryRate ?? 0}%`}
              description="Successful deliveries"
              icon={CheckCircle2}
              variant="success"
              trend={{ value: 2, isPositive: true }}
            />
            <AdminStatsCard
              title="Open Rate"
              value={`${statsData?.openRate ?? 0}%`}
              description="Message engagement"
              icon={Eye}
              variant="success"
              trend={{ value: 5, isPositive: true }}
            />
            <AdminStatsCard
              title="Notifications"
              value={statsData?.totalNotifications ?? notificationsList.length}
              description="Total notifications"
              icon={Bell}
            />
            <AdminStatsCard
              title="Unread"
              value={statsData?.unreadNotifications ?? unreadCount}
              description="Unread notifications"
              icon={AlertTriangle}
              variant={unreadCount > 0 ? "danger" : "default"}
            />
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Common communication tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setActiveTab("announcements")}
              >
                <Bell className="h-4 w-4" />
                New Announcement
              </Button>
              <Link href="/admin/communications/sms">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Send SMS
                </Button>
              </Link>
              <Link href="/admin/communications/email">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
              </Link>
              {canBroadcast && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("broadcast")}
                >
                  <Radio className="h-4 w-4" />
                  Send Broadcast
                </Button>
              )}
              {canTemplates && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("templates")}
                >
                  <LayoutTemplate className="h-4 w-4" />
                  Manage Templates
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          {notificationsList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notificationsList.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      className={`flex items-start gap-3 rounded-md border p-3 ${
                        !n.read ? "bg-muted/50 border-primary/20" : ""
                      }`}
                    >
                      <Bell className={`h-4 w-4 mt-0.5 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.read ? "font-medium" : ""}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {n.body}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ================================================================
            TAB: Announcements
        ================================================================ */}
        <TabsContent value="announcements" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left: Create Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Announcement
                </CardTitle>
                <CardDescription>
                  Draft or publish an announcement for your school community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ann-title">Title</Label>
                  <Input
                    id="ann-title"
                    placeholder="Announcement title"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ann-body">Body</Label>
                  <Textarea
                    id="ann-body"
                    placeholder="Write your announcement..."
                    rows={5}
                    value={annBody}
                    onChange={(e) => setAnnBody(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Select value={annAudience} onValueChange={setAnnAudience}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={annPriority} onValueChange={setAnnPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={annSubmitting}
                    onClick={() => handleCreateAnnouncement("draft")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={annSubmitting}
                    onClick={() => handleCreateAnnouncement("published")}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right: Announcement List */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Announcements</h3>
                <Select value={annStatusFilter} onValueChange={setAnnStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DataTable
                data={filteredAnnouncements}
                columns={announcementColumns}
                searchable
                searchPlaceholder="Search announcements..."
                searchKey={(row) => row.title}
                emptyTitle="No announcements"
                emptyDescription="Create an announcement to get started."
              />
            </div>
          </div>
        </TabsContent>

        {/* ================================================================
            TAB: Campaigns
        ================================================================ */}
        {canCampaigns && (
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Campaigns</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage targeted communication campaigns
                </p>
              </div>
              <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[540px]">
                  <DialogHeader>
                    <DialogTitle>Create Campaign</DialogTitle>
                    <DialogDescription>
                      Set up a new communication campaign for your audience.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="camp-name">Campaign Name</Label>
                      <Input
                        id="camp-name"
                        placeholder="e.g. Term 2 Welcome"
                        value={campName}
                        onChange={(e) => setCampName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="camp-desc">Description (optional)</Label>
                      <Input
                        id="camp-desc"
                        placeholder="Brief description"
                        value={campDescription}
                        onChange={(e) => setCampDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Channels</Label>
                      <div className="flex flex-wrap gap-2">
                        {CHANNEL_OPTIONS.map((ch) => (
                          <Button
                            key={ch.value}
                            type="button"
                            variant={campChannels.includes(ch.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleChannel(ch.value, campChannels, setCampChannels)}
                          >
                            {ch.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {campChannels.includes("email") && (
                      <div className="space-y-2">
                        <Label htmlFor="camp-subject">Email Subject</Label>
                        <Input
                          id="camp-subject"
                          placeholder="Email subject line"
                          value={campSubject}
                          onChange={(e) => setCampSubject(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="camp-message">Message</Label>
                      <Textarea
                        id="camp-message"
                        placeholder="Campaign message content..."
                        rows={4}
                        value={campMessage}
                        onChange={(e) => setCampMessage(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <Select value={campAudienceType} onValueChange={setCampAudienceType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AUDIENCE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="camp-schedule">Schedule (optional)</Label>
                        <Input
                          id="camp-schedule"
                          type="datetime-local"
                          value={campScheduledFor}
                          onChange={(e) => setCampScheduledFor(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCampaignDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCampaign}
                      disabled={campSubmitting}
                    >
                      {campSubmitting ? "Creating..." : "Create Campaign"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <DataTable
              data={(campaigns as Campaign[]) ?? []}
              columns={campaignColumns}
              searchable
              searchPlaceholder="Search campaigns..."
              searchKey={(row) => row.name}
              emptyTitle="No campaigns"
              emptyDescription="Create your first campaign to reach your audience."
            />
          </TabsContent>
        )}

        {/* ================================================================
            TAB: Broadcast
        ================================================================ */}
        {canBroadcast && (
          <TabsContent value="broadcast" className="space-y-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Quick Broadcast
                </CardTitle>
                <CardDescription>
                  Send an immediate message to a selected audience across multiple channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Channels</Label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNEL_OPTIONS.map((ch) => (
                      <Button
                        key={ch.value}
                        type="button"
                        variant={bcChannels.includes(ch.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleChannel(ch.value, bcChannels, setBcChannels)}
                      >
                        {ch.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {bcChannels.includes("email") && (
                  <div className="space-y-2">
                    <Label htmlFor="bc-subject">Subject</Label>
                    <Input
                      id="bc-subject"
                      placeholder="Email subject line"
                      value={bcSubject}
                      onChange={(e) => setBcSubject(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bc-message">Message</Label>
                  <Textarea
                    id="bc-message"
                    placeholder="Type your broadcast message..."
                    rows={5}
                    value={bcMessage}
                    onChange={(e) => setBcMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select value={bcAudience} onValueChange={setBcAudience}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIENCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  disabled={bcSubmitting || bcChannels.length === 0 || !bcMessage.trim()}
                  onClick={handleSendBroadcast}
                >
                  <Send className="h-4 w-4" />
                  {bcSubmitting ? "Sending..." : "Send Broadcast"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ================================================================
            TAB: Templates
        ================================================================ */}
        {canTemplates && (
          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Message Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Reusable templates for consistent communications
                </p>
              </div>
              <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[540px]">
                  <DialogHeader>
                    <DialogTitle>Create Template</DialogTitle>
                    <DialogDescription>
                      Create a reusable message template with variable placeholders.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="tpl-name">Template Name</Label>
                      <Input
                        id="tpl-name"
                        placeholder="e.g. Fee Reminder"
                        value={tplName}
                        onChange={(e) => setTplName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tpl-desc">Description (optional)</Label>
                      <Input
                        id="tpl-desc"
                        placeholder="What is this template for?"
                        value={tplDescription}
                        onChange={(e) => setTplDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={tplCategory} onValueChange={setTplCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TEMPLATE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Channels</Label>
                        <div className="flex flex-wrap gap-1">
                          {CHANNEL_OPTIONS.map((ch) => (
                            <Button
                              key={ch.value}
                              type="button"
                              variant={tplChannels.includes(ch.value) ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => toggleChannel(ch.value, tplChannels, setTplChannels)}
                            >
                              {ch.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {tplChannels.includes("email") && (
                      <div className="space-y-2">
                        <Label htmlFor="tpl-subject">Email Subject</Label>
                        <Input
                          id="tpl-subject"
                          placeholder="Subject line with {{variables}}"
                          value={tplSubject}
                          onChange={(e) => setTplSubject(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="tpl-content">Content</Label>
                      <Textarea
                        id="tpl-content"
                        placeholder="Template content. Use {{variable_name}} for placeholders."
                        rows={5}
                        value={tplContent}
                        onChange={(e) => setTplContent(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tpl-variables">
                        Variables{" "}
                        <span className="text-muted-foreground font-normal">(comma-separated)</span>
                      </Label>
                      <Input
                        id="tpl-variables"
                        placeholder="e.g. student_name, amount, due_date"
                        value={tplVariables}
                        onChange={(e) => setTplVariables(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setTemplateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTemplate}
                      disabled={tplSubmitting}
                    >
                      {tplSubmitting ? "Creating..." : "Create Template"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <DataTable
              data={(templates as Template[]) ?? []}
              columns={templateColumns}
              searchable
              searchPlaceholder="Search templates..."
              searchKey={(row) => row.name}
              emptyTitle="No templates"
              emptyDescription="Create templates for consistent messaging across your school."
            />
          </TabsContent>
        )}

        {/* ================================================================
            TAB: Messages
        ================================================================ */}
        {canMessaging && (
          <TabsContent value="messages" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Messages</h3>
                <p className="text-sm text-muted-foreground">
                  Direct and group conversations
                </p>
              </div>
              <Dialog open={newConvoDialogOpen} onOpenChange={setNewConvoDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Conversation
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[440px]">
                  <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                    <DialogDescription>
                      Start a new direct or group conversation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="convo-name">Conversation Name (optional)</Label>
                      <Input
                        id="convo-name"
                        placeholder="e.g. Grade 10 Teachers"
                        value={newConvoName}
                        onChange={(e) => setNewConvoName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="convo-participants">
                        Participants{" "}
                        <span className="text-muted-foreground font-normal">(comma-separated IDs or emails)</span>
                      </Label>
                      <Input
                        id="convo-participants"
                        placeholder="user1@school.com, user2@school.com"
                        value={newConvoParticipants}
                        onChange={(e) => setNewConvoParticipants(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="convo-message">Initial Message (optional)</Label>
                      <Textarea
                        id="convo-message"
                        placeholder="Type your first message..."
                        rows={3}
                        value={newConvoMessage}
                        onChange={(e) => setNewConvoMessage(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setNewConvoDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateConversation}
                      disabled={newConvoSubmitting}
                    >
                      {newConvoSubmitting ? "Creating..." : "Start Conversation"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Conversation List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {((conversations as Conversation[]) ?? []).length === 0 ? (
                    <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
                      No conversations yet.
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto">
                      {((conversations as Conversation[]) ?? []).map((convo) => (
                        <button
                          key={convo._id}
                          onClick={() => setSelectedConversation(convo._id)}
                          className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                            selectedConversation === convo._id ? "bg-muted" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">
                              {convo.name || `Conversation`}
                            </span>
                            <Badge variant="outline" className="text-xs capitalize ml-2">
                              {convo.type}
                            </Badge>
                          </div>
                          {convo.lastMessage && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {convo.lastMessage}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {convo.lastMessageAt
                              ? formatRelativeTime(convo.lastMessageAt)
                              : formatRelativeTime(convo.createdAt)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Message Area */}
              <Card className="lg:col-span-2">
                <CardContent className="p-6">
                  {selectedConversation ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {((conversations as Conversation[]) ?? []).find(
                              (c) => c._id === selectedConversation
                            )?.name ?? "Conversation"}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {((conversations as Conversation[]) ?? []).find(
                            (c) => c._id === selectedConversation
                          )?.participants.length ?? 0}{" "}
                          participants
                        </Badge>
                      </div>

                      <div className="min-h-[300px] rounded-md border bg-muted/30 p-4 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                          Messages will appear here
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type a message..."
                          rows={2}
                          value={newMessageContent}
                          onChange={(e) => setNewMessageContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={msgSubmitting || !newMessageContent.trim()}
                          className="self-end"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Select a conversation
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose a conversation from the list or start a new one
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
