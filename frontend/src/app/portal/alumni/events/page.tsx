"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, MapPin, Users, Clock, CheckCircle } from "lucide-react";

export default function AlumniEventsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  const events = useQuery(
    api.modules.portal.alumni.queries.getAlumniEvents,
    sessionToken ? {} : "skip"
  );

  const rsvpEvent = useMutation(api.modules.portal.alumni.mutations.rsvpEvent);

  const now = Date.now();
  const allEvents = (events ?? []) as any[];
  const upcoming = useMemo(() => allEvents.filter((e) => e.date >= now).sort((a, b) => a.date - b.date), [allEvents, now]);
  const past     = useMemo(() => allEvents.filter((e) => e.date < now).sort((a, b) => b.date - a.date),  [allEvents, now]);

  const handleRsvp = async (eventId: string) => {
    setRsvpLoading(eventId);
    try {
      const result = await rsvpEvent({ eventId });
      toast({
        title: (result as any)?.rsvpd ? "RSVP confirmed!" : "RSVP cancelled",
        description: "Your response has been recorded.",
      });
    } catch (err) {
      toast({ title: "RSVP failed", description: String(err), variant: "destructive" });
    } finally {
      setRsvpLoading(null);
    }
  };

  if (isLoading || events === undefined) return <LoadingSkeleton variant="page" />;

  const EventCard = ({ event, isPast }: { event: any; isPast: boolean }) => {
    const eventDate = new Date(event.date);
    const isRsvpd = event.userRsvpd ?? false;

    return (
      <Card className={isPast ? "opacity-75" : "hover:shadow-md transition-shadow"}>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold leading-tight">{event.title}</h3>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
              )}
            </div>
            <Badge
              variant="outline"
              className={
                isPast
                  ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 shrink-0"
                  : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 shrink-0"
              }
            >
              {event.status ?? (isPast ? "Past" : "Upcoming")}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {eventDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
            {event.time && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {event.time}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {event.rsvps?.length ?? 0} attending
            </span>
          </div>

          {!isPast && (
            <Button
              size="sm"
              variant={isRsvpd ? "default" : "outline"}
              className="gap-1.5"
              disabled={rsvpLoading === event._id}
              onClick={() => handleRsvp(event._id)}
            >
              {isRsvpd && <CheckCircle className="h-3.5 w-3.5" />}
              {rsvpLoading === event._id ? "Updating…" : isRsvpd ? "RSVP'd" : "RSVP"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni Events"
        description="Stay connected — reunions, networking nights, and more"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
              <Calendar className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {upcoming.filter((e: any) => e.userRsvpd).length}
              </p>
              <p className="text-sm text-muted-foreground">Your RSVPs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Clock className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{past.length}</p>
              <p className="text-sm text-muted-foreground">Past Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="font-medium">No upcoming events</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon for new alumni events.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map((event: any) => (
                <EventCard key={event._id} event={event} isPast={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Clock className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No past events.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {past.map((event: any) => (
                <EventCard key={event._id} event={event} isPast={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
