"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Users, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Id } from "../../../../../../../convex/_generated/dataModel";

export default function AlumniEventDetailPage() {
    const params = useParams();
    const eventId = params.eventId as string;

    const event = useQuery(api.modules.portal.alumni.queries.getAlumniEvent, {
        eventId: eventId as Id<"alumniEvents">,
    });
    const profile = useQuery(api.modules.portal.alumni.queries.getAlumniProfile);
    const rsvpEvent = useMutation(api.modules.portal.alumni.mutations.rsvpEvent);

    const handleRsvp = async () => {
        if (!event) return;
        try {
            await rsvpEvent({ eventId: event._id });
        } catch (err: any) {
            alert(err.message || "Failed to RSVP");
        }
    };

    if (event === undefined) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (event === null) {
        return (
            <div className="space-y-6">
                <PageHeader title="Event Not Found" description="This event doesn't exist or you don't have access." />
                <Link href="/portal/alumni/events">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Events
                    </Button>
                </Link>
            </div>
        );
    }

    const isRsvpd = profile ? event.rsvps.includes(profile.userId) : false;
    const isFull = event.capacity ? event.rsvps.length >= event.capacity : false;
    const isUpcoming = event.date > Date.now();

    return (
        <div className="space-y-6">
            <PageHeader
                title={event.title}
                description="Alumni Event Details"
                actions={
                    <Link href="/portal/alumni/events">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Events
                        </Button>
                    </Link>
                }
            />

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <CardTitle>{event.title}</CardTitle>
                            <Badge variant={isUpcoming ? "default" : "outline"}>
                                {isUpcoming ? "Upcoming" : "Past"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="prose prose-sm max-w-none">
                            <p className="text-muted-foreground whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </div>

                        <Separator />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Date</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(event.date).toLocaleDateString(undefined, {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Time</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(event.date).toLocaleTimeString(undefined, {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Location</p>
                                    <p className="text-sm text-muted-foreground">{event.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Attendees</p>
                                    <p className="text-sm text-muted-foreground">
                                        {event.rsvps.length} RSVPs
                                        {event.capacity && ` / ${event.capacity} capacity`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">RSVP</CardTitle>
                        <CardDescription>
                            {isUpcoming
                                ? isRsvpd
                                    ? "You're attending this event!"
                                    : "Would you like to attend?"
                                : "This event has already occurred."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isUpcoming && (
                            <Button
                                className="w-full"
                                variant={isRsvpd ? "outline" : "default"}
                                onClick={handleRsvp}
                                disabled={!isRsvpd && isFull}
                            >
                                {isRsvpd
                                    ? "Cancel RSVP"
                                    : isFull
                                        ? "Event Full"
                                        : "RSVP Now"}
                            </Button>
                        )}
                        {isFull && !isRsvpd && (
                            <p className="text-sm text-muted-foreground mt-2 text-center">
                                This event has reached full capacity.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
