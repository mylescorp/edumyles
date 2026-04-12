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

type Ticket = {
  _id: Id<"tickets">;
  title: string;
  body: string;
  category: string;
  priority: "P0" | "P1" | "P2" | "P3";
  status: string;
  updatedAt: number;
  replyCount: number;
};

type TicketDetail = Ticket & {
  comments: Array<{
    _id: Id<"ticketComments">;
    authorEmail: string;
    content: string;
    createdAt: number;
  }>;
};

export default function AffiliateSupportPage() {
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"tickets"> | null>(null);
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState({ title: "", body: "", category: "account", priority: "P2" as "P0"|"P1"|"P2"|"P3" });

  const tickets = useQuery((api as any)["modules/reseller/queries/support"].getTickets, {}) as Ticket[] | undefined;
  const detail = useQuery((api as any)["modules/reseller/queries/support"].getTicketDetail, selectedTicketId ? { ticketId: selectedTicketId } : "skip") as TicketDetail | undefined;
  const createTicket = useMutation((api as any)["modules/reseller/queries/support"].createTicket);
  const addComment = useMutation((api as any)["modules/reseller/queries/support"].addTicketComment);

  const filtered = useMemo(
    () => (tickets ?? []).filter((ticket) => [ticket.title, ticket.body, ticket.category].join(" ").toLowerCase().includes(search.toLowerCase())),
    [tickets, search]
  );

  if (!tickets) return <LoadingSkeleton variant="page" />;

  async function submitTicket() {
    await createTicket(draft);
    setOpenNew(false);
    setDraft({ title: "", body: "", category: "account", priority: "P2" });
  }

  async function submitReply() {
    if (!selectedTicketId || !reply.trim()) return;
    await addComment({ ticketId: selectedTicketId, content: reply });
    setReply("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate Support"
        description="Live support tickets for your affiliate account."
        actions={<Button onClick={() => setOpenNew(true)}><Plus className="mr-2 h-4 w-4" />New Ticket</Button>}
      />

      <Card>
        <CardHeader><CardTitle>Tickets</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tickets..." className="max-w-xl" />
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No tickets found" description="Your affiliate support requests will show here." />
          ) : (
            <div className="space-y-3">
              {filtered.map((ticket) => (
                <button key={ticket._id} type="button" onClick={() => setSelectedTicketId(ticket._id)} className="w-full rounded-md border p-4 text-left hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{ticket.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{ticket.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{ticket.replyCount} replies · {new Date(ticket.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="space-y-2 text-right">
                      <Badge variant="outline">{ticket.priority}</Badge>
                      <Badge variant={ticket.status === "open" ? "default" : "secondary"}>{ticket.status.replaceAll("_", " ")}</Badge>
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
          <DialogHeader><DialogTitle>Create Affiliate Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Brief description of your issue" />
            <Textarea rows={5} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} placeholder="Detailed description of your issue" />
            <div className="grid grid-cols-2 gap-3">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>
                <option value="account">Account</option>
                <option value="billing">Billing</option>
                <option value="feature">Feature</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as any }))}>
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
            </div>
            <Button onClick={submitTicket} disabled={!draft.title.trim() || !draft.body.trim()}><Send className="mr-2 h-4 w-4" />Submit Ticket</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{detail?.title ?? "Ticket"}</DialogTitle></DialogHeader>
          {!detail ? <LoadingSkeleton variant="table" /> : (
            <div className="space-y-4">
              <Card><CardContent className="space-y-3 p-4 text-sm"><div className="flex items-center gap-2"><Badge variant="outline">{detail.priority}</Badge><Badge variant={detail.status === "open" ? "default" : "secondary"}>{detail.status.replaceAll("_", " ")}</Badge></div><p>{detail.body}</p></CardContent></Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Conversation</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {detail.comments.length === 0 ? <EmptyState icon={MessageSquare} title="No comments yet" description="Replies will appear here." /> : detail.comments.map((comment) => (
                    <div key={comment._id} className="rounded-md border p-3 text-sm">
                      <p className="font-medium">{comment.authorEmail}</p>
                      <p className="mt-1">{comment.content}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="space-y-3 border-t pt-3">
                    <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Describe your issue..." />
                    <Button onClick={submitReply} disabled={!reply.trim()}><Send className="mr-2 h-4 w-4" />Send Reply</Button>
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
