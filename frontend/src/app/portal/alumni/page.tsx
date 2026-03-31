"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import {
  GraduationCap,
  FileText,
  Users,
  Calendar,
  Send,
  Briefcase,
  Mail,
  ArrowRight,
  Megaphone,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  pending:   "text-[#E8A020] bg-[rgba(232,160,32,0.1)] border-[#E8A020]/30",
  processing:"text-[#1565C0] bg-[rgba(21,101,192,0.1)] border-[#1565C0]/30",
  ready:     "text-[#26A65B] bg-[rgba(38,166,91,0.1)] border-[#26A65B]/30",
  rejected:  "text-[#DC2626] bg-[rgba(220,38,38,0.1)] border-[#DC2626]/30",
};

export default function AlumniDashboardPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const [requestType, setRequestType] = useState<"official" | "unofficial">("official");
  const [requestNotes, setRequestNotes] = useState("");
  const [requesting, setRequesting] = useState(false);

  const profile = useQuery(api.modules.portal.alumni.queries.getAlumniProfile, sessionToken ? {} : "skip");
  const transcripts = useQuery(api.modules.portal.alumni.queries.getTranscripts, sessionToken ? {} : "skip");
  const directory = useQuery(api.modules.portal.alumni.queries.getAlumniDirectory, sessionToken ? {} : "skip");
  const events = useQuery(api.modules.portal.alumni.queries.getAlumniEvents, sessionToken ? {} : "skip");
  const announcements = useQuery(api.modules.portal.alumni.queries.getAlumniAnnouncements, sessionToken ? {} : "skip");

  const requestTranscript = useMutation(api.modules.portal.alumni.mutations.requestTranscript);
  const rsvpEvent = useMutation(api.modules.portal.alumni.mutations.rsvpEvent);

  const stats = useMemo(() => ({
    graduationYear: profile?.graduationYear ?? "--",
    transcriptRequests: transcripts?.requests?.length ?? 0,
    networkSize: directory?.length ?? 0,
    upcomingEvents: (events ?? []).filter((e) => e.date >= Date.now()).length,
  }), [profile, transcripts, directory, events]);

  const handleRequestTranscript = async () => {
    setRequesting(true);
    try {
      await requestTranscript({ type: requestType, notes: requestNotes.trim() || undefined });
      setRequestNotes("");
      toast({ title: "Request submitted", description: "Your transcript request is now pending review." });
    } catch (error) {
      toast({ title: "Request failed", description: String(error), variant: "destructive" });
    } finally {
      setRequesting(false);
    }
  };

  const handleRsvp = async (eventId: any) => {
    try {
      const result = await rsvpEvent({ eventId });
      toast({
        title: result?.rsvpd ? "RSVP confirmed" : "RSVP cancelled",
        description: "Your event response has been updated.",
      });
    } catch (error) {
      toast({ title: "RSVP failed", description: String(error), variant: "destructive" });
    }
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const upcomingEvents = (events ?? []).filter((e) => e.date >= Date.now());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni Dashboard"
        description="Access your records and connect with fellow alumni"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Graduation Year" value={stats.graduationYear} icon={GraduationCap} variant="default" />
        <StatCard label="Transcript Requests" value={stats.transcriptRequests} icon={FileText} variant={stats.transcriptRequests > 0 ? "info" : "default"} />
        <StatCard label="Alumni Network" value={stats.networkSize} icon={Users} variant="default" />
        <StatCard label="Upcoming Events" value={stats.upcomingEvents} icon={Calendar} variant={stats.upcomingEvents > 0 ? "success" : "default"} />
      </div>

      {/* Profile + Transcript Request */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Summary */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <GraduationCap className="h-4 w-4 text-[#0F4C2A]" />
              Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {!profile ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No alumni profile found for this account.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {`${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Alumni User"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {profile.program || "Program not set"} · Class of {profile.graduationYear}
                  </p>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4 flex-shrink-0 text-[#6B9E83]" />
                    <span className="truncate">
                      {profile.jobTitle || "Role not set"}
                      {profile.currentEmployer ? ` at ${profile.currentEmployer}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0 text-[#6B9E83]" />
                    <span className="truncate">{profile.contactEmail || "No contact email"}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Transcript */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-[#1565C0]" />
              Request Transcript
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</Label>
              <Select value={requestType} onValueChange={(v: "official" | "unofficial") => setRequestType(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="official">Official</SelectItem>
                  <SelectItem value="unofficial">Unofficial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</Label>
              <Textarea
                rows={3}
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Any special processing notes…"
                className="resize-none text-sm"
              />
            </div>
            <Button onClick={handleRequestTranscript} disabled={requesting} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {requesting ? "Submitting…" : "Submit Request"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transcript requests + Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transcript Requests */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-[#E8A020]" />
              Recent Transcript Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {(transcripts?.requests ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transcript requests yet.</p>
            ) : (
              <div className="space-y-2">
                {(transcripts?.requests ?? []).slice(0, 6).map((request: any) => (
                  <div key={request._id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                    <div>
                      <p className="text-sm font-medium capitalize">{request.type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(request.createdAt)}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-xs capitalize", STATUS_BADGE[request.status] ?? STATUS_BADGE.pending)}>
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4 text-[#7C3AED]" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events right now.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 4).map((event: any) => (
                  <div key={event._id} className="p-3 rounded-lg border border-border/50 bg-muted/20">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium leading-tight">{event.title}</p>
                      <Badge variant="outline" className="text-xs flex-shrink-0 capitalize text-muted-foreground">
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span>{new Date(event.date).toLocaleString()}</span>
                      {event.location && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{event.location}
                          </span>
                        </>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRsvp(event._id)}
                      className="h-7 text-xs"
                    >
                      RSVP{event.rsvps?.length ? ` (${event.rsvps.length})` : ""}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Megaphone className="h-4 w-4 text-[#1565C0]" />
            Recent Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {(announcements ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No announcements available.</p>
          ) : (
            <div className="space-y-2">
              {(announcements ?? []).slice(0, 6).map((notice: any) => (
                <div key={notice._id} className="p-3 rounded-lg border border-border/50 bg-muted/20">
                  <p className="text-sm font-medium">{notice.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{notice.message}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{formatRelativeTime(notice.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
