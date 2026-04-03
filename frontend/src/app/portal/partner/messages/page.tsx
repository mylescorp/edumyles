"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatRelativeTime } from "@/lib/formatters";

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: number;
};

type Conversation = {
  _id: string;
  name?: string;
  participants: string[];
  lastMessageAt?: number;
  lastMessagePreview?: string;
};

export default function PartnerMessagesPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newConversationMessage, setNewConversationMessage] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const announcements = useQuery(
    api.modules.portal.partner.queries.getPartnerAnnouncements,
    {}
  ) as any[] | undefined;

  const conversations = useQuery(
    api.modules.communications.queries.listMyConversations,
    sessionToken ? { sessionToken } : "skip"
  ) as Conversation[] | undefined;

  const messages = useQuery(
    api.modules.communications.queries.getConversationMessages,
    sessionToken && selectedConversation
      ? { sessionToken, conversationId: selectedConversation as any }
      : "skip"
  ) as any[] | undefined;

  const notifications = useQuery(
    api.modules.communications.queries.listMyNotifications,
    sessionToken ? { sessionToken, limit: 10 } : "skip"
  ) as Notification[] | undefined;

  const createConversation = useMutation(api.modules.communications.mutations.createConversation);
  const sendMessage = useMutation(api.modules.communications.mutations.sendMessage);
  const markConversationRead = useMutation(api.modules.communications.mutations.markConversationRead);

  const unreadCount = useMemo(
    () => (notifications ?? []).filter((notification) => !notification.isRead).length,
    [notifications]
  );

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleCreateConversation = async () => {
    if (!newConversationMessage.trim()) {
      return;
    }

    try {
      const result = (await createConversation({
        type: "direct",
        participants: [],
        name: "Partner Message to School",
        initialMessage: newConversationMessage.trim(),
      })) as { conversationId?: string };

      if (result.conversationId) {
        setSelectedConversation(result.conversationId);
      }

      setNewConversationMessage("");
      toast({
        title: "Message sent",
        description: "The school administration can now reply in this conversation.",
      });
    } catch (error) {
      toast({
        title: "Unable to contact school",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !draftMessage.trim()) {
      return;
    }

    try {
      await sendMessage({
        conversationId: selectedConversation as any,
        content: draftMessage.trim(),
      });
      setDraftMessage("");
    } catch (error) {
      toast({
        title: "Unable to send message",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    try {
      await markConversationRead({ conversationId: conversationId as any });
    } catch {
      // Ignore read failures so the conversation can still open.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Contact school administration and keep sponsorship conversations in one secure thread"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contact School</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={newConversationMessage}
                onChange={(event) => setNewConversationMessage(event.target.value)}
                placeholder="Write a message to school administration about sponsorships, reports, or support..."
                rows={4}
              />
              <Button
                className="w-full"
                onClick={handleCreateConversation}
                disabled={!newConversationMessage.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                Start Conversation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(conversations ?? []).length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No conversations yet. Start one above to contact the school.
                </div>
              ) : (
                (conversations ?? []).map((conversation) => (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => handleSelectConversation(conversation._id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedConversation === conversation._id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">
                      {conversation.name || `Conversation ${conversation._id.slice(-6)}`}
                    </div>
                    {conversation.lastMessagePreview && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {conversation.lastMessagePreview}
                      </p>
                    )}
                    {conversation.lastMessageAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeTime(conversation.lastMessageAt)}
                      </p>
                    )}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4" />
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedConversation ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-sm text-muted-foreground">
                <MessageSquare className="h-10 w-10" />
                <p>Select a conversation to follow school replies.</p>
              </div>
            ) : (
              <div className="flex h-[460px] flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {(messages ?? []).slice().reverse().map((message) => (
                    <div key={message._id} className="rounded-lg border p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {message.senderRole ?? "user"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Input
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Reply to this conversation..."
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void handleSendReply();
                      }
                    }}
                  />
                  <Button onClick={handleSendReply} disabled={!draftMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4" />
              Recent Notifications
              {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(notifications ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              (notifications ?? []).map((notification) => (
                <div
                  key={notification._id}
                  className={`rounded-lg border p-3 ${
                    notification.isRead ? "" : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium text-sm">{notification.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {notification.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">School Updates</CardTitle>
          </CardHeader>
          <CardContent>
            {(announcements ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              <ul className="space-y-3">
                {(announcements ?? []).slice(0, 20).map((announcement: any) => (
                  <li key={announcement._id} className="border-b pb-2 text-sm last:border-0">
                    <p className="font-medium">{announcement.title}</p>
                    <p className="text-muted-foreground">{announcement.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(announcement.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
