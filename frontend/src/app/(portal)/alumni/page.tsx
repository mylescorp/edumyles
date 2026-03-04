"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, FileText, Calendar, Users, Bell } from "lucide-react";

export default function AlumniDashboard() {
    const profile = useQuery(api.modules.portal.alumni.queries.getAlumniProfile);
    const transcripts = useQuery(api.modules.portal.alumni.queries.getTranscripts);
    const events = useQuery(api.modules.portal.alumni.queries.getAlumniEvents);
    const announcements = useQuery(api.modules.portal.alumni.queries.getAlumniAnnouncements);

    const pendingRequests = transcripts?.requests?.filter(r => r.status === "pending").length ?? 0;
    const upcomingEvents = events?.filter(e => e.date > Date.now()).length ?? 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Welcome back, ${profile?.firstName || "Alumni"}!`}
                description="Stay connected with your alma mater. View transcripts, connect with fellow alumni, and join events."
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Graduation Year"
                    value={profile?.graduationYear?.toString() ?? "—"}
                    icon={GraduationCap}
                    trend={profile?.program ?? ""}
                />
                <StatCard
                    title="Transcript Requests"
                    value={pendingRequests.toString()}
                    icon={FileText}
                    trend={`${transcripts?.requests?.length ?? 0} total requests`}
                />
                <StatCard
                    title="Upcoming Events"
                    value={upcomingEvents.toString()}
                    icon={Calendar}
                    trend={`${events?.length ?? 0} total events`}
                />
                <StatCard
                    title="Alumni Network"
                    value="—"
                    icon={Users}
                    trend="Browse the directory"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Latest Announcements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {announcements && announcements.length > 0 ? (
                                announcements.slice(0, 3).map((ann) => (
                                    <div key={ann._id} className="border-b pb-3 last:border-0 last:pb-0">
                                        <h4 className="font-semibold">{ann.title}</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {ann.message}
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(ann.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No recent announcements.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Upcoming Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {events && events.filter(e => e.date > Date.now()).length > 0 ? (
                                events.filter(e => e.date > Date.now()).slice(0, 3).map((event) => (
                                    <div key={event._id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                        <div>
                                            <h4 className="font-semibold">{event.title}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(event.date).toLocaleDateString()} • {event.location}
                                            </p>
                                        </div>
                                        <Badge variant={event.rsvps.length >= (event.capacity ?? Infinity) ? "destructive" : "secondary"}>
                                            {event.rsvps.length} RSVPs
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No upcoming events.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
