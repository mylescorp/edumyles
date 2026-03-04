"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function PartnerMessagesPage() {
  const { isLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const announcements = useQuery(api.modules.portal.partner.queries.getPartnerAnnouncements, {});
  const sendMessage = useMutation(api.modules.portal.partner.mutations.sendPartnerMessage);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendMessage({ message: message.trim() });
      setMessage("");
      setSent(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description="School updates and send a message to the school"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send message to school</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="message">Your message</Label>
              <Textarea
                id="message"
                placeholder="Type your message to the school administration..."
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <Button onClick={handleSend} disabled={!message.trim()}>
              Send message
            </Button>
            {sent && (
              <p className="text-sm text-green-600">Message sent successfully.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>School updates</CardTitle>
          </CardHeader>
          <CardContent>
            {!announcements?.length ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              <ul className="space-y-3">
                {announcements.slice(0, 20).map((n: any) => (
                  <li key={n._id} className="text-sm border-b pb-2 last:border-0">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleString()}
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
