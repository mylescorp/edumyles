"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { ComposeDialog } from "../ComposeDialog";
import {
  Bell,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Send,
  Smartphone,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { OperationsAdminRail } from "@/components/platform/OperationsAdminRail";

type MessageStatus = "all" | "draft" | "scheduled" | "sent";

function formatTime(timestamp?: number) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPercent(value?: number) {
  return `${value ?? 0}%`;
}

function ChannelIcons({ channels }: { channels: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {channels.includes("in_app") ? <Bell className="h-4 w-4 text-muted-foreground" /> : null}
      {channels.includes("email") ? <Mail className="h-4 w-4 text-muted-foreground" /> : null}
      {channels.includes("sms") ? <Smartphone className="h-4 w-4 text-muted-foreground" /> : null}
    </div>
  );
}

export default function BroadcastPage() {
  const { sessionToken } = useAuth();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MessageStatus>("all");
  const [search, setSearch] = useState("");

  const allMessages = usePlatformQuery(
    api.platform.communications.queries.listMessages,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );
  const deliveryAnalytics = usePlatformQuery(
    api.platform.communications.queries.getDeliveryAnalytics,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );
  const recipientLists = usePlatformQuery(
    api.platform.communications.queries.getRecipientLists,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

  const sendNowMutation = useMutation(api.platform.communications.mutations.sendPlatformMessageNow);
  const deleteMutation = useMutation(api.platform.communications.mutations.deletePlatformMessage);

  const isLoading =
    allMessages === undefined || deliveryAnalytics === undefined || recipientLists === undefined;

  const broadcastMessages = useMemo(() => {
    const messages = (allMessages ?? []).filter((message: any) => message.type === "broadcast");
    const query = search.trim().toLowerCase();
    return messages.filter((message: any) => {
      const matchesStatus = statusFilter === "all" || message.status === statusFilter;
      const haystack = [message.subject, ...(message.channels ?? [])].join(" ").toLowerCase();
      return matchesStatus && (query.length === 0 || haystack.includes(query));
    });
  }, [allMessages, search, statusFilter]);

  const broadcastStats = useMemo(() => {
    const messages = (allMessages ?? []).filter((message: any) => message.type === "broadcast");
    return {
      total: messages.length,
      sent: messages.filter((message: any) => message.status === "sent").length,
      scheduled: messages.filter((message: any) => message.status === "scheduled").length,
      reachable:
        (recipientLists ?? []).find((list: any) => list._id === "list_all_users")?.count ??
        (recipientLists ?? []).reduce((max: number, list: any) => Math.max(max, list.count ?? 0), 0),
    };
  }, [allMessages, recipientLists]);

  const handleSendNow = async (messageId: string) => {
    if (!sessionToken) return;
    try {
      await sendNowMutation({ sessionToken, messageId: messageId as any });
      toast.success("Broadcast sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send broadcast.");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!sessionToken) return;
    try {
      await deleteMutation({ sessionToken, messageId: messageId as any });
      toast.success("Broadcast deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete broadcast.");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  const analyticsOverview = deliveryAnalytics?.overview;
  const lists = recipientLists ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcast Messaging"
        description="Create, schedule, and monitor platform-wide broadcasts across in-app, email, and SMS channels."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Communications", href: "/platform/communications" },
          { label: "Broadcast", href: "/platform/communications/broadcast" },
        ]}
        actions={
          <Button onClick={() => setIsComposeOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New broadcast
          </Button>
        }
      />

      <OperationsAdminRail currentHref="/platform/communications/broadcast" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{broadcastStats.total}</div>
            <p className="text-sm text-muted-foreground">Total broadcasts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{broadcastStats.sent}</div>
            <p className="text-sm text-muted-foreground">Sent broadcasts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{broadcastStats.scheduled}</div>
            <p className="text-sm text-muted-foreground">Scheduled broadcasts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{broadcastStats.reachable}</div>
            <p className="text-sm text-muted-foreground">Reachable users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="gap-4">
            <CardTitle>Broadcast queue</CardTitle>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search broadcasts"
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MessageStatus)}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {broadcastMessages.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={(allMessages ?? []).some((message: any) => message.type === "broadcast") ? "No broadcasts match this view" : "No broadcasts yet"}
                description={
                  (allMessages ?? []).some((message: any) => message.type === "broadcast")
                    ? "Adjust your search or status filter to find a broadcast."
                    : "Create a broadcast to reach schools across the platform."
                }
                action={
                  <Button onClick={() => setIsComposeOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create broadcast
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {broadcastMessages.map((message: any) => (
                  <div key={message._id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{message.subject}</span>
                          <Badge variant="outline">{message.status}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <ChannelIcons channels={message.channels ?? []} />
                          {message.status === "scheduled" ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Scheduled for {formatTime(message.scheduledAt)}
                            </span>
                          ) : message.status === "sent" ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Sent {formatTime(message.sentAt)}
                            </span>
                          ) : (
                            <span>Created {formatTime(message.createdAt)}</span>
                          )}
                        </div>
                        {message.status === "sent" ? (
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>{message.stats?.delivered ?? 0} delivered</span>
                            <span>{message.stats?.opened ?? 0} opened</span>
                            <span>{message.stats?.clicked ?? 0} clicked</span>
                            <span>{message.stats?.bounced ?? 0} bounced</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        {message.status !== "sent" ? (
                          <Button variant="outline" size="sm" onClick={() => handleSendNow(message._id)}>
                            <Send className="mr-1 h-4 w-4" />
                            Send now
                          </Button>
                        ) : null}
                        {message.status !== "sent" ? (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(message._id)}>
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivery rate</span>
                <span className="font-medium">{formatPercent(analyticsOverview?.deliveryRate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Open rate</span>
                <span className="font-medium">{formatPercent(analyticsOverview?.openRate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Click rate</span>
                <span className="font-medium">{formatPercent(analyticsOverview?.clickRate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivered</span>
                <span className="font-medium">{analyticsOverview?.totalDelivered ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target segments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lists.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No recipient segments"
                  description="Recipient segments will appear here when the communications backend exposes active lists."
                  className="py-8"
                />
              ) : (
                lists.slice(0, 4).map((list: any) => (
                  <div key={list._id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{list.name}</p>
                        <p className="text-xs text-muted-foreground">{list.description}</p>
                      </div>
                      <Badge variant="secondary">{list.count}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ComposeDialog
        open={isComposeOpen}
        onOpenChange={setIsComposeOpen}
        initialType="broadcast"
        title="Compose Broadcast"
      />
    </div>
  );
}
