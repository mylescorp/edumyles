"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { CheckCircle2, MessageCircle, MessagesSquare, PhoneCall, SearchX } from "lucide-react";

type EngagementStatus = "new" | "open" | "contacted" | "qualified" | "closed" | "spam";
type EngagementChannel = "live_chat" | "whatsapp";

type LandingEngagement = {
  _id: string;
  channel: EngagementChannel;
  status: EngagementStatus;
  priority: "normal" | "high";
  topic: string;
  name: string;
  email?: string;
  phone?: string;
  schoolName?: string;
  role?: string;
  country?: string;
  message: string;
  composedWhatsAppMessage?: string;
  whatsappUrl?: string;
  pagePath?: string;
  referrer?: string;
  assignedTo?: string;
  adminNotes?: Array<{ body: string; authorEmail?: string; createdAt: number }>;
  lastContactedAt?: number;
  createdAt: number;
  updatedAt: number;
};

type Stats = {
  total: number;
  new: number;
  open: number;
  contacted: number;
  qualified: number;
  whatsapp: number;
  liveChat: number;
};

const STATUS_OPTIONS: Array<EngagementStatus | "all"> = [
  "all",
  "new",
  "open",
  "contacted",
  "qualified",
  "closed",
  "spam",
];
const CHANNEL_OPTIONS: Array<EngagementChannel | "all"> = ["all", "live_chat", "whatsapp"];

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusClass(status: EngagementStatus) {
  switch (status) {
    case "new":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    case "open":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700";
    case "contacted":
      return "border-indigo-500/20 bg-indigo-500/10 text-indigo-700";
    case "qualified":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "closed":
      return "border-slate-500/20 bg-slate-500/10 text-slate-700";
    case "spam":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
  }
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

export default function LandingEngagementsPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [channelFilter, setChannelFilter] = useState<(typeof CHANNEL_OPTIONS)[number]>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LandingEngagement | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const rawStats = usePlatformQuery(
    api.publicEngagements.getLandingEngagementStats,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as Stats | undefined;

  const rawEngagements = usePlatformQuery(
    api.publicEngagements.listLandingEngagements,
    sessionToken
      ? {
          sessionToken,
          status: statusFilter === "all" ? undefined : statusFilter,
          channel: channelFilter === "all" ? undefined : channelFilter,
          limit: 150,
        }
      : "skip",
    !!sessionToken
  ) as LandingEngagement[] | undefined;

  const updateEngagement = useMutation(api.publicEngagements.updateLandingEngagement);

  const engagements = useMemo(() => (Array.isArray(rawEngagements) ? rawEngagements : []), [rawEngagements]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return engagements;
    return engagements.filter((item) =>
      [item.name, item.email, item.phone, item.schoolName, item.topic, item.message]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle))
    );
  }, [engagements, search]);

  async function changeStatus(engagement: LandingEngagement, status: EngagementStatus) {
    if (!sessionToken) return;
    setSaving(true);
    try {
      await updateEngagement({
        sessionToken,
        engagementId: engagement._id as never,
        status,
      });
      toast({ title: "Landing engagement updated" });
      if (selected?._id === engagement._id) setSelected({ ...engagement, status });
    } catch (error) {
      toast({ title: "Unable to update engagement", description: String(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!sessionToken || !selected || !note.trim()) return;
    setSaving(true);
    try {
      await updateEngagement({
        sessionToken,
        engagementId: selected._id as never,
        note,
      });
      toast({ title: "Note added" });
      setNote("");
      setSelected(null);
    } catch (error) {
      toast({ title: "Unable to add note", description: String(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !rawStats || !rawEngagements) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Landing Inbox"
        description="Track WhatsApp intents and live-chat messages from the public landing site."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Landing Inbox" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total engagements" value={rawStats.total} />
        <MetricCard title="New" value={rawStats.new} />
        <MetricCard title="WhatsApp" value={rawStats.whatsapp} />
        <MetricCard title="Live chat" value={rawStats.liveChat} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, school, phone, email, or message"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {labelize(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value as typeof channelFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {labelize(channel)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={SearchX} title="No landing engagements found" description="New WhatsApp and live-chat submissions will appear here." />
          ) : (
            <div className="space-y-3">
              {filtered.map((engagement) => (
                <div
                  key={engagement._id}
                  className="rounded-xl border bg-card p-4 shadow-sm transition hover:border-emerald-500/40"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={statusClass(engagement.status)}>
                          {labelize(engagement.status)}
                        </Badge>
                        <Badge variant="outline">
                          {engagement.channel === "whatsapp" ? (
                            <MessageCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <MessagesSquare className="mr-1 h-3 w-3" />
                          )}
                          {labelize(engagement.channel)}
                        </Badge>
                        {engagement.priority === "high" && <Badge variant="destructive">High priority</Badge>}
                      </div>
                      <h2 className="mt-3 text-base font-semibold">{engagement.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[engagement.schoolName, engagement.role, engagement.country].filter(Boolean).join(" · ") || "No organization details"}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm leading-6">{engagement.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatRelativeTime(engagement.createdAt)} · {engagement.topic}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {engagement.whatsappUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={engagement.whatsappUrl} target="_blank" rel="noreferrer">
                            <PhoneCall className="mr-2 h-4 w-4" />
                            WhatsApp
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setSelected(engagement)}>
                        View
                      </Button>
                      <Button size="sm" disabled={saving} onClick={() => changeStatus(engagement, "contacted")}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark contacted
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                  <p><span className="font-medium">Email:</span> {selected.email || "Not provided"}</p>
                  <p><span className="font-medium">Phone:</span> {selected.phone || "Not provided"}</p>
                  <p><span className="font-medium">School:</span> {selected.schoolName || "Not provided"}</p>
                  <p><span className="font-medium">Role:</span> {selected.role || "Not provided"}</p>
                  <p><span className="font-medium">Country:</span> {selected.country || "Not provided"}</p>
                  <p><span className="font-medium">Created:</span> {formatDateTime(selected.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Message</p>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm leading-6">{selected.message}</p>
                </div>
                {selected.pagePath && (
                  <p className="text-sm text-muted-foreground">
                    Source page: <span className="font-medium text-foreground">{selected.pagePath}</span>
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Select value={selected.status} onValueChange={(value) => changeStatus(selected, value as EngagementStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((status) => status !== "all").map((status) => (
                        <SelectItem key={status} value={status}>
                          {labelize(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selected.whatsappUrl && (
                    <Button asChild>
                      <a href={selected.whatsappUrl} target="_blank" rel="noreferrer">Open WhatsApp</a>
                    </Button>
                  )}
                </div>
                <div>
                  <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add an internal follow-up note" />
                  <Button className="mt-3" disabled={saving || !note.trim()} onClick={addNote}>Save note</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
