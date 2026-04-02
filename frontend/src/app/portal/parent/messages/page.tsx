"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ParentMessagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [message, setMessage] = useState("");
  const notificationsResult = useQuery(
    api.notifications.getNotifications,
    user?._id ? { userId: String(user._id), limit: 20 } : "skip"
  ) as Array<{ _id: string; title: string; message: string }> | undefined;
  const notifications = notificationsResult ?? [];
  const notificationsLoading = user?._id ? notificationsResult === undefined : false;

  const sendMessage = useMutation(
    api.modules.portal.parent.mutations.sendMessage
  );

  if (authLoading || notificationsLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleSend = async () => {
    if (!message.trim()) return;
    await sendMessage({
      recipientRole: "school_admin",
      message,
    });
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="View important messages and contact school staff"
      />

      <Card>
        <CardHeader>
          <CardTitle>Send a message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message to the school administration..."
          />
          <Button onClick={handleSend} disabled={!message.trim()}>
            Send
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {notifications.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            notifications.map((n: { _id: string; title: string; message: string }) => (
              <div key={n._id} className="border-b pb-2 last:border-b-0">
                <p className="font-medium">{n.title}</p>
                <p>{n.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

