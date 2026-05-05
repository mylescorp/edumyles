"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Plus, Calendar, MapPin, Clock, Search } from "lucide-react";

const EVENT_TYPE_COLORS: Record<string, string> = {
  academic:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sports:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cultural:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  holiday:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  meeting:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  other:     "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};
const EMPTY_EVENTS: any[] = [];

export default function TimetableEventsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");

  const events = useQuery(
    api.modules.timetable.queries.listEvents,
    sessionToken ? {} : "skip"
  );

  const [now] = useState(() => Date.now());
  const allEvents = (events as any[] | undefined) ?? EMPTY_EVENTS;

  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      const eventTs = new Date(e.startDate ?? e.date ?? "").getTime();
      const matchSearch = !search || (e.title ?? "").toLowerCase().includes(search.toLowerCase()) || (e.location ?? "").toLowerCase().includes(search.toLowerCase());
      const matchType   = typeFilter === "all" || e.eventType === typeFilter;
      const matchTime   = timeFilter === "all" || (timeFilter === "upcoming" ? eventTs >= now : eventTs < now);
      return matchSearch && matchType && matchTime;
    }).sort((a, b) => {
      const aTs = new Date(a.startDate ?? a.date ?? "").getTime();
      const bTs = new Date(b.startDate ?? b.date ?? "").getTime();
      return timeFilter === "past" ? bTs - aTs : aTs - bTs;
    });
  }, [allEvents, search, typeFilter, timeFilter, now]);

  const upcoming = allEvents.filter((e) => new Date(e.startDate ?? e.date ?? "").getTime() >= now);
  const past     = allEvents.filter((e) => new Date(e.startDate ?? e.date ?? "").getTime() < now);

  if (isLoading || events === undefined) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Events"
        description="Manage and view all scheduled school events"
        actions={
          <Link href="/admin/timetable/events/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule Event
            </Button>
          </Link>
        }
      />

      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allEvents.length}</p>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
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
              <p className="text-sm text-muted-foreground">Past</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
            <SelectItem value="cultural">Cultural</SelectItem>
            <SelectItem value="holiday">Holiday</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Event list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium">No events found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {allEvents.length === 0
                ? "Schedule your first event to get started."
                : "Try adjusting your filters."}
            </p>
            {allEvents.length === 0 && (
              <Link href="/admin/timetable/events/create">
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" /> Schedule Event
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((event: any) => {
            const startDate = new Date(event.startDate ?? event.date ?? "");
            const endDate   = event.endDate ? new Date(event.endDate) : null;
            const colorClass = EVENT_TYPE_COLORS[event.eventType] ?? EVENT_TYPE_COLORS.other;

            return (
              <Card key={event._id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          {endDate && endDate.toDateString() !== startDate.toDateString() && (
                            <> – {endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>
                          )}
                        </span>
                        {(event.startTime || event.endTime) && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.startTime}{event.endTime && ` – ${event.endTime}`}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className={`${colorClass} border-0 capitalize shrink-0`}>
                    {event.eventType ?? "Other"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
