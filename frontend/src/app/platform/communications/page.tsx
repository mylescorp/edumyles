"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Send,
  FileText,
  Plus,
  Trash2,
  Mail,
  Smartphone,
  Bell,
  CheckCircle,
  Clock,
  LayoutTemplate,
  Users,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ComposeDialog } from "./ComposeDialog";
import { toast } from "sonner";

type MessageStatus = "draft" | "scheduled" | "sent";

interface PlatformMessage {
  _id: string;
  type: string;
  subject: string;
  channels: string[];
  status: MessageStatus;
  scheduledAt?: number;
  sentAt?: number;
  createdAt: number;
  stats: {
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}

const STATUS_COLORS: Record<MessageStatus, string> = {
  draft: "bg-purple-100 text-purple-700 border-purple-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  sent: "bg-green-100 text-green-700 border-green-200",
};

const TYPE_COLORS: Record<string, string> = {
  broadcast: "bg-orange-100 text-orange-700 border-orange-200",
  targeted: "bg-cyan-100 text-cyan-700 border-cyan-200",
  alert: "bg-red-100 text-red-700 border-red-200",
  campaign: "bg-violet-100 text-violet-700 border-violet-200",
  transactional: "bg-teal-100 text-teal-700 border-teal-200",
  drip_step: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

function formatTime(timestamp?: number): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPercent(value?: number) {
  return `${value ?? 0}%`;
}

function ChannelIcons({ channels }: { channels: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {channels.includes("in_app") && (
        <span title="In-App">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </span>
      )}
      {channels.includes("email") && (
        <span title="Email">
          <Mail className="h-4 w-4 text-muted-foreground" />
        </span>
      )}
      {channels.includes("sms") && (
        <span title="SMS">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
        </span>
      )}
    </div>
  );
}

export default function CommunicationsPage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"messages" | "analytics" | "templates" | "recipients">("messages");
  const [messageFilter, setMessageFilter] = useState<"all" | "draft" | "scheduled" | "sent">("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const allMessages = usePlatformQuery<PlatformMessage[]>(
    api.platform.communications.queries.listMessages,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  const deliveryAnalytics = usePlatformQuery(
    api.platform.communications.queries.getDeliveryAnalytics,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  const templates = usePlatformQuery(
    api.platform.communications.queries.listTemplates,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  const recipientLists = usePlatformQuery(
    api.platform.communications.queries.getRecipientLists,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  const campaigns = usePlatformQuery(
    api.platform.communications.queries.listCampaigns,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  const deleteMutation = useMutation(api.platform.communications.mutations.deletePlatformMessage);
  const sendNowMutation = useMutation(api.platform.communications.mutations.sendPlatformMessageNow);

  const handleDelete = async (messageId: string) => {
    if (!sessionToken) return;
    try {
      await deleteMutation({ sessionToken, messageId: messageId as any });
      toast.success("Message deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete message.");
    }
  };

  const handleSendNow = async (messageId: string) => {
    if (!sessionToken) return;
    try {
      await sendNowMutation({ sessionToken, messageId: messageId as any });
      toast.success("Message sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message.");
    }
  };

  if (
    allMessages === undefined ||
    deliveryAnalytics === undefined ||
    templates === undefined ||
    recipientLists === undefined ||
    campaigns === undefined
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  const messages: PlatformMessage[] = allMessages ?? [];
  const filteredMessages =
    messageFilter === "all" ? messages : messages.filter((message) => message.status === messageFilter);

  const counts = {
    all: messages.length,
    draft: messages.filter((message) => message.status === "draft").length,
    scheduled: messages.filter((message) => message.status === "scheduled").length,
    sent: messages.filter((message) => message.status === "sent").length,
  };

  const analyticsOverview = deliveryAnalytics?.overview;
  const channelBreakdown = deliveryAnalytics?.byChannel ?? [];
  const recentTemplates = templates ?? [];
  const recentRecipientLists = recipientLists ?? [];
  const recentCampaigns = campaigns ?? [];

  const templateSummary = useMemo(() => {
    const countsByChannel = recentTemplates.reduce((acc: Record<string, number>, template: any) => {
      (template.channels ?? []).forEach((channel: string) => {
        acc[channel] = (acc[channel] ?? 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    return countsByChannel;
  }, [recentTemplates]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications Center"
        description="Platform-wide messaging, templates, recipient targeting, and delivery analytics."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Communications", href: "/platform/communications" },
        ]}
        actions={
          <Button onClick={() => setIsComposeOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.all}</div>
            <p className="text-xs text-muted-foreground">{counts.sent} sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercent(analyticsOverview?.deliveryRate)}
            </div>
            <p className="text-xs text-muted-foreground">{analyticsOverview?.totalDelivered ?? 0} delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{recentTemplates.length}</div>
            <p className="text-xs text-muted-foreground">{Object.keys(templateSummary).length} channels covered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipient Lists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{recentRecipientLists.length}</div>
            <p className="text-xs text-muted-foreground">{recentRecipientLists.reduce((sum: number, list: any) => sum + (list.count ?? 0), 0)} users reachable</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={messageFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setMessageFilter("all")}>
              All ({counts.all})
            </Button>
            <Button variant={messageFilter === "draft" ? "default" : "outline"} size="sm" onClick={() => setMessageFilter("draft")}>
              Drafts ({counts.draft})
            </Button>
            <Button variant={messageFilter === "scheduled" ? "default" : "outline"} size="sm" onClick={() => setMessageFilter("scheduled")}>
              Scheduled ({counts.scheduled})
            </Button>
            <Button variant={messageFilter === "sent" ? "default" : "outline"} size="sm" onClick={() => setMessageFilter("sent")}>
              Sent ({counts.sent})
            </Button>
          </div>

          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <MessageSquare className="h-10 w-10 opacity-30" />
                <p className="text-sm">No {messageFilter === "all" ? "" : `${messageFilter} `}messages yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="divide-y">
                {filteredMessages.map((message) => (
                  <div
                    key={message._id}
                    className="flex items-start justify-between p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="max-w-xs truncate text-sm font-medium">{message.subject}</span>
                        <Badge variant="outline" className={`text-xs ${TYPE_COLORS[message.type] ?? "bg-gray-100 text-gray-700"}`}>
                          {message.type}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[message.status]}`}>
                          {message.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <ChannelIcons channels={message.channels} />
                        {message.status === "sent" && message.sentAt ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            Sent {formatTime(message.sentAt)}
                          </span>
                        ) : message.status === "scheduled" && message.scheduledAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            Scheduled for {formatTime(message.scheduledAt)}
                          </span>
                        ) : (
                          <span>Created {formatTime(message.createdAt)}</span>
                        )}
                        {message.status === "sent" && (
                          <>
                            <span>{message.stats.delivered} delivered</span>
                            <span>{message.stats.opened} opened</span>
                            <span>{message.stats.clicked} clicked</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex shrink-0 items-center gap-2">
                      {message.status !== "sent" && (
                        <Button variant="outline" size="sm" onClick={() => handleSendNow(message._id)}>
                          <Send className="mr-1 h-4 w-4" />
                          Send
                        </Button>
                      )}
                      {message.status !== "sent" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDelete(message._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsOverview?.totalSent ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsOverview?.totalDelivered ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Opened</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsOverview?.totalOpened ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clicked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsOverview?.totalClicked ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Channel Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {channelBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No delivery records are available yet.</p>
                ) : (
                  channelBreakdown.map((channel: any) => (
                    <div key={channel.channel} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium capitalize">{channel.channel.replace("_", " ")}</div>
                        <Badge variant="outline">{channel.sent} sent</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-3 text-sm text-muted-foreground">
                        <div>Delivery {formatPercent(channel.deliveryRate)}</div>
                        <div>Open {formatPercent(channel.openRate)}</div>
                        <div>Click {formatPercent(channel.clickRate)}</div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentCampaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No platform campaigns have been created yet.</p>
                ) : (
                  recentCampaigns.slice(0, 6).map((campaign: any) => (
                    <div key={campaign._id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">{campaign.description}</p>
                        </div>
                        <Badge variant="outline">{campaign.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {recentTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-sm text-muted-foreground">
                  No global communication templates are available.
                </CardContent>
              </Card>
            ) : (
              recentTemplates.map((template: any) => (
                <Card key={template._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{template.subject || template.description || "Template available for reuse."}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <ChannelIcons channels={template.channels ?? []} />
                      {(template.channels ?? []).map((channel: string) => (
                        <Badge key={channel} variant="secondary">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {recentRecipientLists.map((list: any) => (
              <Card key={list._id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{list.name}</CardTitle>
                    <Badge variant="outline">{list.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{list.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reachable users</span>
                    <span className="font-medium">{list.count}</span>
                  </div>
                  <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    {JSON.stringify(list.criteria)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ComposeDialog open={isComposeOpen} onOpenChange={setIsComposeOpen} />
    </div>
  );
}
