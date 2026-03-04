"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import Link from "next/link";

export default function AlumniEventsPage() {
    const events = useQuery(api.modules.portal.alumni.queries.getAlumniEvents);
    const profile = useQuery(api.modules.portal.alumni.queries.getAlumniProfile);
    const rsvpEvent = useMutation(api.modules.portal.alumni.mutations.rsvpEvent);

    const now = Date.now();
    const upcomingEvents = events?.filter(e => e.date > now) ?? [];
    const pastEvents = events?.filter(e => e.date <= now) ?? [];

    const handleRsvp = async (eventId: any) => {
        try {
            await rsvpEvent({ eventId });
        } catch (err: any) {
            alert(err.message || "Failed to RSVP");
        }
    };

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        upcoming: "default",
        ongoing: "secondary",
        completed: "outline",
        cancelled: "destructive",
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Alumni Events"
                description="Discover and RSVP to alumni events."
            />

            {upcomingEvents.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Upcoming Events</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingEvents.map((event) => {
                            const isRsvpd = profile ? event.rsvps.includes(profile.userId) : false;
                            const isFull = event.capacity ? event.rsvps.length >= event.capacity : false;

                            return (
                                <Card key={event._id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-lg">{event.title}</CardTitle>
                                            <Badge variant={statusColors[event.status] ?? "default"}>
                                                {event.status}
                                            </Badge>
                                        </div>
                                        <CardDescription className="line-clamp-2">
                                            {event.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(event.date).toLocaleDateString(undefined, {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            {new Date(event.date).toLocaleTimeString(undefined, {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            {event.location}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            {event.rsvps.length} RSVPs
                                            {event.capacity && ` / ${event.capacity} capacity`}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-2">
                                        <Button
                                            variant={isRsvpd ? "outline" : "default"}
                                            className="flex-1"
                                            onClick={() => handleRsvp(event._id)}
                                            disabled={!isRsvpd && isFull}
                                        >
                                            {isRsvpd ? "Cancel RSVP" : isFull ? "Full" : "RSVP"}
                                        </Button>
                                        <Link href={`/portal/alumni/events/${event._id}`}>
                                            <Button variant="ghost">Details</Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {pastEvents.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-muted-foreground">Past Events</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pastEvents.map((event) => (
                            <Card key={event._id} className="opacity-70">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">{event.title}</CardTitle>
                                        <Badge variant="outline">Past</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(event.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        {event.location}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        {event.rsvps.length} attended
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {(!events || events.length === 0) && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No alumni events scheduled yet.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
