"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Bell, Send, Megaphone, Settings } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";

type Announcement = {
  _id: string; title: string; body: string; audience: string;
  priority: string; status: string; createdAt: number;
};
type Notification = {
  _id: string; title: string; message: string; type: string;
  isRead: boolean; link?: string; createdAt: number;
};
type Conversation = {
  _id: string; type: string; name?: string; participants: string[];
  lastMessageAt?: number; lastMessagePreview?: string;
};

const TABS = [
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export default function ParentCommunicationsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("announcements");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newConvoMessage, setNewConvoMessage] = useState("");

  const announcements = useQuery(
    api.modules.communications.queries.listAnnouncements,
    sessionToken ? { sessionToken, status: "published" } : "skip"
  ) as Announcement[] | undefined;

  const notifications = useQuery(
    api.modules.communications.queries.listMyNotifications,
    sessionToken ? { sessionToken } : "skip"
  ) as Notification[] | undefined;

  const conversations = useQuery(
    api.modules.communications.queries.listMyConversations,
    sessionToken ? { sessionToken } : "skip"
  ) as Conversation[] | undefined;

  const messages = useQuery(
    api.modules.communications.queries.getConversationMessages,
    selectedConversation
      ? { sessionToken: sessionToken ?? "", conversationId: selectedConversation as any }
      : "skip"
  ) as any[] | undefined;

  const preferences = useQuery(
    api.modules.communications.queries.getMyNotificationPreferences,
    sessionToken ? { sessionToken } : "skip"
  ) as any;

  const sendMessageMut = useMutation(api.modules.communications.mutations.sendMessage);
  const markRead = useMutation(api.modules.communications.mutations.markConversationRead);
  const createConversation = useMutation(api.modules.communications.mutations.createConversation);
  const updatePrefs = useMutation(api.modules.communications.mutations.updateNotificationPreferences);

  const unreadCount = useMemo(
    () => (notifications ?? []).filter(n => !n.isRead).length,
    [notifications]
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      await sendMessageMut({ conversationId: selectedConversation as any, content: newMessage.trim() });
      setNewMessage("");
    } catch (e) {
      toast({ title: "Failed to send", description: String(e), variant: "destructive" });
    }
  };

  const handleContactSchool = async () => {
    if (!newConvoMessage.trim()) return;
    try {
      await createConversation({
        type: "direct",
        participants: [],
        name: "Message to School",
        initialMessage: newConvoMessage.trim(),
      });
      setNewConvoMessage("");
      toast({ title: "Message sent to school administration" });
    } catch (e) {
      toast({ title: "Failed", description: String(e), variant: "destructive" });
    }
  };

  const handleSelectConversation = async (id: string) => {
    setSelectedConversation(id);
    try { await markRead({ conversationId: id as any }); } catch {}
  };

  const togglePref = async (key: string, value: boolean) => {
    try {
      await updatePrefs({ [key]: value });
      toast({ title: "Preferences updated" });
    } catch (e) {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "emergency": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Communications" description="Stay connected with your child's school" />

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
            {id === "notifications" && unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">{unreadCount}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Announcements */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          {(announcements ?? []).length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No announcements.</p>
            </CardContent></Card>
          ) : (
            (announcements ?? []).map(ann => (
              <Card key={ann._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{ann.title}</CardTitle>
                    <Badge className={getPriorityColor(ann.priority)}>{ann.priority}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{ann.body}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(ann.createdAt)}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      {activeTab === "messages" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Contact School</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  placeholder="Send a message to school administration..."
                  value={newConvoMessage}
                  onChange={e => setNewConvoMessage(e.target.value)}
                  rows={3}
                />
                <Button size="sm" className="w-full" onClick={handleContactSchool}>
                  <Send className="h-3 w-3 mr-1" /> Send
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Conversations</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {(conversations ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No conversations yet.</p>
                ) : (
                  (conversations ?? []).map(c => (
                    <button
                      key={c._id}
                      onClick={() => handleSelectConversation(c._id)}
                      className={`w-full text-left rounded-lg border p-2 text-sm transition-colors ${
                        selectedConversation === c._id ? "border-primary bg-primary/5" : "hover:bg-muted"
                      }`}
                    >
                      <div className="font-medium">{c.name || `Chat ${c._id.slice(-6)}`}</div>
                      {c.lastMessagePreview && (
                        <p className="text-xs text-muted-foreground truncate">{c.lastMessagePreview}</p>
                      )}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              {!selectedConversation ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a conversation</p>
                </div>
              ) : (
                <div className="flex flex-col h-[500px]">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {(messages ?? []).slice().reverse().map((msg: any) => (
                      <div key={msg._id} className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{msg.senderRole ?? "user"}</Badge>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-3">
          {(notifications ?? []).length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications.</p>
            </CardContent></Card>
          ) : (
            (notifications ?? []).map(n => (
              <Card key={n._id} className={!n.isRead ? "border-primary/30 bg-primary/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                      <span className="font-medium text-sm">{n.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{n.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Settings */}
      {activeTab === "settings" && (
        <Card>
          <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Channels</h4>
              {[
                { key: "emailEnabled", label: "Email Notifications" },
                { key: "smsEnabled", label: "SMS Notifications" },
                { key: "pushEnabled", label: "Push Notifications" },
                { key: "inAppEnabled", label: "In-App Notifications" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">{label}</span>
                  <input
                    type="checkbox"
                    checked={preferences?.[key] ?? true}
                    onChange={e => togglePref(key, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Categories</h4>
              {[
                { key: "announcements", label: "Announcements" },
                { key: "academic", label: "Academic Updates" },
                { key: "finance", label: "Fee & Payment Reminders" },
                { key: "system", label: "System Notifications" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">{label}</span>
                  <input
                    type="checkbox"
                    checked={preferences?.categories?.[key] ?? true}
                    onChange={e => togglePref("categories", { ...preferences?.categories, [key]: e.target.checked } as any)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
