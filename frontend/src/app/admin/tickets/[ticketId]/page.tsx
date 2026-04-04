"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TicketDetail = {
  _id: string;
  title?: string;
  subject?: string;
  body: string;
  category: string;
  priority: "P0" | "P1" | "P2" | "P3";
  status: "open" | "in_progress" | "pending_school" | "resolved" | "closed";
  createdAt: number;
  updatedAt: number;
  comments: Array<{
    _id: string;
    authorEmail: string;
    authorRole: string;
    content: string;
    createdAt: number;
  }>;
};

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId as string;
  const { sessionToken } = useAuth();
  const addComment = useMutation(api.tickets.addTenantTicketComment);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticket = useQuery(
    api.tickets.getTenantTicketDetail,
    sessionToken && ticketId ? { sessionToken, ticketId: ticketId as any } : "skip"
  ) as TicketDetail | undefined | null;

  const canSubmit = useMemo(() => Boolean(sessionToken && comment.trim()), [sessionToken, comment]);

  const handleSubmitComment = async () => {
    if (!sessionToken || !canSubmit) return;

    setIsSubmitting(true);
    try {
      await addComment({
        sessionToken,
        ticketId: ticketId as any,
        content: comment.trim(),
      });
      setComment("");
      toast.success("Comment added");
    } catch (error) {
      console.error("Failed to add ticket comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionToken || ticket === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ticket Not Found" description="The requested ticket could not be located." />
        <Button variant="outline" onClick={() => router.push("/admin/tickets")}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.title ?? ticket.subject ?? "Support Ticket"}
        description={`Ticket #${ticket._id.slice(-6).toUpperCase()}`}
        actions={
          <Button variant="outline" onClick={() => router.push("/admin/tickets")}>
            Back to Tickets
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{ticket.category}</Badge>
              <Badge variant={ticket.priority === "P0" || ticket.priority === "P1" ? "destructive" : "secondary"}>
                {ticket.priority}
              </Badge>
              <Badge variant="secondary">{ticket.status.replace("_", " ")}</Badge>
            </div>
            <div className="rounded-lg border p-4 whitespace-pre-wrap">{ticket.body}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">Created</div>
              <div>{new Date(ticket.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Updated</div>
              <div>{new Date(ticket.updatedAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Category</div>
              <div className="capitalize">{ticket.category}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Priority</div>
              <div>{ticket.priority}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="capitalize">{ticket.status.replace("_", " ")}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {ticket.comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              ticket.comments.map((entry) => (
                <div key={entry._id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{entry.authorEmail}</span>
                    <span className="text-muted-foreground">
                      {entry.authorRole} · {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{entry.content}</p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Add Comment</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share an update or request more information."
              rows={5}
            />
          </div>

          <Button onClick={handleSubmitComment} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

