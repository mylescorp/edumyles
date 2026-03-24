"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ComposeDialog } from "./ComposeDialog";

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

function formatTime(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "scheduled" | "sent">("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const allMessages = usePlatformQuery<PlatformMessage[]>(
    api.platform.communications.queries.listMessages,
    { sessionToken: sessionToken ?? "" }
  );

  const deleteMutation = useMutation(api.platform.communications.mutations.deletePlatformMessage);
  const sendNowMutation = useMutation(api.platform.communications.mutations.sendPlatformMessageNow);

  const handleDelete = async (messageId: string) => {
    if (!sessionToken) return;
    try {
      await deleteMutation({ sessionToken, messageId: messageId as any });
    } catch (e) {
      console.error("Failed to delete message:", e);
    }
  };

  const handleSendNow = async (messageId: string) => {
    if (!sessionToken) return;
    try {
      await sendNowMutation({ sessionToken, messageId: messageId as any });
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  };

  if (allMessages === undefined) return <LoadingSkeleton variant="page" />;

  const messages: PlatformMessage[] = allMessages ?? [];

  const filtered =
    activeTab === "all" ? messages : messages.filter((m) => m.status === activeTab);

  const counts = {
    all: messages.length,
    draft: messages.filter((m) => m.status === "draft").length,
    scheduled: messages.filter((m) => m.status === "scheduled").length,
    sent: messages.filter((m) => m.status === "sent").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications Center"
        description="Platform-wide messaging and broadcast management"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Communications", href: "/platform/communications" },
        ]}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.all}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{counts.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{counts.draft}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Bar + New Message button */}
      <div className="flex items-center justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1"
        >
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="draft">Drafts ({counts.draft})</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled ({counts.scheduled})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({counts.sent})</TabsTrigger>
            </TabsList>
            <Button onClick={() => setIsComposeOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>

          <TabsContent value={activeTab} className="mt-4">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <MessageSquare className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No {activeTab === "all" ? "" : activeTab + " "}messages yet.</p>
                  <Button variant="outline" size="sm" onClick={() => setIsComposeOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Compose Message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="divide-y">
                  {filtered.map((msg) => (
                    <div
                      key={msg._id}
                      className="flex items-start justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate max-w-xs">
                            {msg.subject}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${TYPE_COLORS[msg.type] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {msg.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${STATUS_COLORS[msg.status]}`}
                          >
                            {msg.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <ChannelIcons channels={msg.channels} />
                          {msg.status === "sent" && msg.sentAt ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              Sent {formatTime(msg.sentAt)}
                            </span>
                          ) : msg.status === "scheduled" && msg.scheduledAt ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-blue-500" />
                              Scheduled for {formatTime(msg.scheduledAt)}
                            </span>
                          ) : (
                            <span>Created {formatTime(msg.createdAt)}</span>
                          )}
                          {msg.status === "sent" && (
                            <span>{msg.stats.delivered} delivered</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        {msg.status !== "sent" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendNow(msg._id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                        {msg.status !== "sent" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(msg._id)}
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
        </Tabs>
      </div>

      <ComposeDialog open={isComposeOpen} onOpenChange={setIsComposeOpen} />
    </div>
  );
}
