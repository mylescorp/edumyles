"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock3, MessageSquare, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

type SupportTicket = {
  _id: string;
  tenantId: string;
  userId: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  slaDueAt?: number;
  resolvedAt?: number;
  source?: string;
  createdAt: number;
  updatedAt: number;
};

type SupportMessage = {
  _id: string;
  ticketId: string;
  senderId: string;
  body: string;
  attachments?: string[];
  sentAt: number;
  isInternal: boolean;
  createdAt: number;
};

function statusTone(status: SupportTicket["status"]) {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-700";
    case "in_progress":
      return "bg-amber-100 text-amber-700";
    case "resolved":
      return "bg-green-100 text-green-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function priorityTone(priority: SupportTicket["priority"]) {
  switch (priority) {
    case "critical":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "medium":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function PlatformTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = String(params.id);
  const { sessionToken } = useAuth();
  const [replyBody, setReplyBody] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<SupportTicket["status"]>("open");
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, startRefreshing] = useTransition();

  const tickets = usePlatformQuery(
    api.modules.platform.support.getSupportTickets,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  ) as SupportTicket[] | undefined;

  const messages = usePlatformQuery(
    api.modules.platform.support.getSupportTicketMessages,
    { sessionToken: sessionToken || "", ticketId },
    !!sessionToken && Boolean(ticketId)
  ) as SupportMessage[] | undefined;

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any[] | undefined;

  const updateSupportTicket = useMutation(api.modules.platform.support.updateSupportTicket);
  const replySupportTicket = useMutation(api.modules.platform.support.replySupportTicket);

  const ticket = useMemo(() => (tickets ?? []).find((item) => String(item._id) === ticketId) ?? null, [ticketId, tickets]);
  const tenantName = useMemo(() => {
    const match = (tenants ?? []).find((tenant) => tenant.tenantId === ticket?.tenantId);
    return match?.name ?? ticket?.tenantId ?? "Unknown tenant";
  }, [tenants, ticket]);

  const messageRows = useMemo(() => messages ?? [], [messages]);

  useEffect(() => {
    if (ticket) {
      setSelectedStatus(ticket.status);
    }
  }, [ticket]);

  const handleUpdateStatus = async () => {
    if (!sessionToken || !ticket) return;
    try {
      await updateSupportTicket({
        sessionToken,
        ticketId: ticket._id as any,
        status: selectedStatus,
      });
      toast.success("Ticket updated.");
    } catch (error: any) {
      console.error("Failed to update ticket:", error);
      toast.error(error?.message || "Failed to update ticket.");
    }
  };

  const handleReply = async () => {
    if (!sessionToken || !ticket || !replyBody.trim()) return;
    setIsSubmitting(true);
    try {
      await replySupportTicket({
        sessionToken,
        ticketId: String(ticket._id),
        body: replyBody.trim(),
        isInternal,
      });
      setReplyBody("");
      setIsInternal(false);
      toast.success("Reply added.");
    } catch (error: any) {
      console.error("Failed to reply to ticket:", error);
      toast.error(error?.message || "Failed to reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionToken || tickets === undefined || messages === undefined || tenants === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ticket not found"
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "Tickets", href: "/platform/tickets" },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={MessageSquare}
              title="This ticket does not exist"
              description="Return to the queue and select another support ticket."
              action={
                <Link href="/platform/tickets">
                  <Button>Back to tickets</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.subject}
        description={`Support ticket for ${tenantName}`}
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Tickets", href: "/platform/tickets" },
          { label: ticket.subject, href: `/platform/tickets/${ticketId}` },
        ]}
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => startRefreshing(() => router.refresh())}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ticket details</CardTitle>
            <CardDescription>Live status and SLA data from the support module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusTone(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
              <Badge className={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
              <Badge variant="outline">{tenantName}</Badge>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Assigned to {ticket.assignedTo || "Unassigned"}</p>
              <p>Created {new Date(ticket.createdAt).toLocaleString("en-KE")}</p>
              <p>Updated {new Date(ticket.updatedAt).toLocaleString("en-KE")}</p>
              <p>{ticket.slaDueAt ? `SLA due ${new Date(ticket.slaDueAt).toLocaleString("en-KE")}` : "No SLA deadline configured"}</p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as SupportTicket["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateStatus}>Save status</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>Platform replies and tenant-visible ticket messages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messageRows.length === 0 ? (
              <EmptyState
                icon={Clock3}
                title="No replies yet"
                description="Add the first response to start the support thread."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {messageRows.map((message) => (
                  <div key={message._id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={message.isInternal ? "secondary" : "outline"}>
                          {message.isInternal ? "Internal" : "Public"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{message.senderId}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.sentAt).toLocaleString("en-KE")}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm">{message.body}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Reply</Label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(event) => setIsInternal(event.target.checked)}
                    className="rounded"
                  />
                  Internal note
                </label>
              </div>
              <Textarea
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                rows={6}
                placeholder="Add the next update, troubleshooting step, or resolution summary."
              />
              <div className="flex justify-end">
                <Button onClick={handleReply} disabled={isSubmitting || !replyBody.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send reply"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
