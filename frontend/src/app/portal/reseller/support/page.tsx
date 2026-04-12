"use client";

import { useEffect, useMemo, useState } from "react";
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
import { BookOpen, MessageSquare, Plus, Search, Send } from "lucide-react";

type SupportTicket = {
  _id: Id<"tickets">;
  title: string;
  body: string;
  category: string;
  priority: "P0" | "P1" | "P2" | "P3";
  status: string;
  updatedAt: number;
  createdAt: number;
  replyCount: number;
};

type TicketDetail = SupportTicket & {
  comments: Array<{
    _id: Id<"ticketComments">;
    authorEmail: string;
    content: string;
    createdAt: number;
  }>;
};

type MarketingMaterialsResult = {
  materials: Array<{
    materialId: string;
    name: string;
    description: string;
    type: string;
    language: string;
    targetAudience: string;
    usage: {
      downloads: number;
      views: number;
    };
  }>;
};

export default function ResellerSupportPage() {
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"tickets"> | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: "",
    body: "",
    category: "technical",
    priority: "P2" as "P0" | "P1" | "P2" | "P3",
  });
  const [reply, setReply] = useState("");

  const tickets = useQuery((api as any)["modules/reseller/queries/support"].getTickets, {}) as
    | SupportTicket[]
    | undefined;
  const selectedTicket = useQuery(
    (api as any)["modules/reseller/queries/support"].getTicketDetail,
    selectedTicketId ? { ticketId: selectedTicketId } : "skip"
  ) as TicketDetail | undefined;
  const resources = useQuery(api.modules.reseller.mutations.marketing.getMarketingMaterials, {}) as
    | MarketingMaterialsResult
    | undefined;

  const createTicket = useMutation((api as any)["modules/reseller/queries/support"].createTicket);
  const addComment = useMutation((api as any)["modules/reseller/queries/support"].addTicketComment);

  const filteredTickets = useMemo(
    () =>
      (tickets ?? []).filter((ticket) =>
        [ticket.title, ticket.body, ticket.category]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [tickets, search]
  );

  async function submitTicket() {
    await createTicket(newTicket);
    setOpenNew(false);
    setNewTicket({ title: "", body: "", category: "technical", priority: "P2" });
  }

  async function submitReply() {
    if (!selectedTicketId || !reply.trim()) return;
    await addComment({ ticketId: selectedTicketId, content: reply });
    setReply("");
  }

  if (!tickets || !resources) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Live reseller support tickets plus published reseller resources from backend data."
        actions={
          <Button onClick={() => setOpenNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
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
            {filteredTickets.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No support tickets"
                description="Create a ticket when you need help from the EduMyles team."
              />
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    type="button"
                    className="w-full rounded-md border p-4 text-left hover:bg-muted/40"
                    onClick={() => setSelectedTicketId(ticket._id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{ticket.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{ticket.body}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {ticket.replyCount} replies · {new Date(ticket.updatedAt).toLocaleString()}
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

        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent>
            {resources.materials.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No published resources"
                description="Published reseller marketing materials will appear here."
              />
            ) : (
              <div className="space-y-3">
                {resources.materials.map((resource) => (
                  <div key={resource.materialId} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{resource.name}</p>
                    <p className="mt-1 text-muted-foreground">{resource.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {resource.type} · {resource.language} · {resource.targetAudience}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {resource.usage.views} views · {resource.usage.downloads} downloads
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Ticket title"
              value={newTicket.title}
              onChange={(e) => setNewTicket((t) => ({ ...t, title: e.target.value }))}
            />
            <Textarea
              placeholder="Describe the issue"
              rows={5}
              value={newTicket.body}
              onChange={(e) => setNewTicket((t) => ({ ...t, body: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={newTicket.category}
                onChange={(e) => setNewTicket((t) => ({ ...t, category: e.target.value }))}
              >
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="feature">Feature</option>
                <option value="account">Account</option>
                <option value="other">Other</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={newTicket.priority}
                onChange={(e) => setNewTicket((t) => ({ ...t, priority: e.target.value as any }))}
              >
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
            </div>
            <Button onClick={submitTicket} disabled={!newTicket.title.trim() || !newTicket.body.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Submit Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.title ?? "Ticket"}</DialogTitle>
          </DialogHeader>
          {!selectedTicket ? (
            <LoadingSkeleton variant="table" />
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-3 p-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedTicket.priority}</Badge>
                    <Badge variant={selectedTicket.status === "open" ? "default" : "secondary"}>
                      {selectedTicket.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p>{selectedTicket.body}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedTicket.comments.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title="No comments yet"
                      description="Replies will appear here as the conversation progresses."
                    />
                  ) : (
                    selectedTicket.comments.map((comment) => (
                      <div key={comment._id} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">{comment.authorEmail}</p>
                        <p className="mt-1">{comment.content}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                  <div className="space-y-3 border-t pt-3">
                    <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Add a reply" />
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
