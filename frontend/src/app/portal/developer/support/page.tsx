"use client";

import { useMemo, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, Search, Send } from "lucide-react";

type SupportTicketList = {
  tickets: Array<{
    _id: Id<"publisher_support_tickets">;
    subject: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    priority: "low" | "medium" | "high" | "critical";
    updatedAt: number;
    createdAt: number;
    thread?: Array<{
      authorEmail?: string;
      content: string;
      createdAt: number;
    }>;
  }>;
  total: number;
};

type SupportTicketDetail = {
  _id: Id<"publisher_support_tickets">;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  thread?: Array<{
    authorEmail?: string;
    content: string;
    createdAt: number;
    authorRole?: string;
  }>;
};

export default function DeveloperSupportPage() {
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [selectedTicketId, setSelectedTicketId] =
    useState<Id<"publisher_support_tickets"> | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    body: "",
    category: "technical" as "technical" | "billing" | "account" | "feature" | "other",
    priority: "P2" as "P0" | "P1" | "P2" | "P3",
  });
  const [reply, setReply] = useState("");

  const tickets = useQuery(api.modules.publisher.mutations.support.getSupportTickets, {}) as
    | SupportTicketList
    | undefined;
  const detail = useQuery(
    api.modules.publisher.mutations.support.getSupportTicketDetail,
    selectedTicketId ? { ticketId: selectedTicketId } : "skip"
  ) as SupportTicketDetail | undefined;
  const createTicket = useMutation(
    api.modules.publisher.mutations.support.createSupportTicket
  );
  const addComment = useMutation(api.modules.publisher.mutations.support.addTicketComment);

  const filtered = useMemo(
    () =>
      (tickets?.tickets ?? []).filter((ticket) =>
        [ticket.subject, ticket.status, ticket.priority]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [tickets, search]
  );

  if (!tickets) return <LoadingSkeleton variant="page" />;

  async function submitTicket() {
    await createTicket(draft);
    setDraft({ title: "", body: "", category: "technical", priority: "P2" });
    setOpenNew(false);
  }

  async function submitReply() {
    if (!selectedTicketId || !reply.trim()) return;
    await addComment({
      ticketId: selectedTicketId,
      content: reply,
      isInternal: false,
    });
    setReply("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Live developer support tickets backed by Convex publisher support records."
        actions={
          <Button onClick={() => setOpenNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Tickets</p><p className="text-2xl font-semibold">{tickets.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Open</p><p className="text-2xl font-semibold">{tickets.tickets.filter((ticket) => ["open", "in_progress"].includes(ticket.status)).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Resolved</p><p className="text-2xl font-semibold">{tickets.tickets.filter((ticket) => ticket.status === "resolved").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search support tickets..."
            className="max-w-xl"
          />
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No tickets found"
              description="Create a developer support ticket when you need help."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((ticket) => (
                <button
                  key={ticket._id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket._id)}
                  className="w-full rounded-md border p-4 text-left hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created {new Date(ticket.createdAt).toLocaleString()} · Updated{" "}
                        {new Date(ticket.updatedAt).toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {ticket.thread?.[0]?.content ?? "No conversation preview"}
                      </p>
                    </div>
                    <div className="space-y-2 text-right">
                      <Badge variant="outline">{ticket.priority}</Badge>
                      <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                        {ticket.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Developer Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={draft.title}
              onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
              placeholder="Ticket title"
            />
            <Textarea
              rows={5}
              value={draft.body}
              onChange={(e) => setDraft((current) => ({ ...current, body: e.target.value }))}
              placeholder="Describe the issue"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    category: e.target.value as typeof draft.category,
                  }))
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="account">Account</option>
                <option value="feature">Feature</option>
                <option value="other">Other</option>
              </select>
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    priority: e.target.value as typeof draft.priority,
                  }))
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
            </div>
            <Button onClick={submitTicket} disabled={!draft.title.trim() || !draft.body.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Submit Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detail?.subject ?? "Ticket"}</DialogTitle>
          </DialogHeader>
          {!detail ? (
            <LoadingSkeleton variant="table" />
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{detail.priority}</Badge>
                    <Badge variant={detail.status === "open" ? "default" : "secondary"}>
                      {detail.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(detail.thread ?? []).length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title="No conversation yet"
                      description="Replies will appear here once the ticket thread starts."
                    />
                  ) : (
                    (detail.thread ?? []).map((entry, index) => (
                      <div key={`${entry.createdAt}-${index}`} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">{entry.authorEmail ?? entry.authorRole ?? "Unknown author"}</p>
                        <p className="mt-1">{entry.content}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                  <div className="space-y-3 border-t pt-3">
                    <Textarea
                      rows={4}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Add a reply"
                    />
                    <Button onClick={submitReply} disabled={!reply.trim()}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
