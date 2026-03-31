"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Layers,
  AlertCircle,
  ArrowRight,
  Clock,
  Users,
} from "lucide-react";

export default function TimetableIndexPage() {
  const { isLoading, sessionToken } = useAuth();

  const slots = useQuery(
    api.modules.timetable.queries.listSlots,
    sessionToken ? {} : "skip"
  );

  const events = useQuery(
    api.modules.timetable.queries.listEvents,
    sessionToken ? {} : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const slotList  = (slots ?? []) as any[];
  const eventList = (events ?? []) as any[];
  const now = Date.now();
  const upcomingEvents = eventList.filter((e: any) => new Date(e.startDate ?? e.date ?? "").getTime() >= now).length;
  const totalTeachers  = [...new Set(slotList.map((s: any) => s.teacherId).filter(Boolean))].length;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slotsByDay = days.map((d) => ({
    day: d,
    count: slotList.filter((s: any) => s.dayOfWeek === d.toLowerCase() || s.day === d).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description="Visual schedule builder and school calendar management"
        breadcrumbs={[
          { label: "Admin Portal", href: "/portal/admin" },
          { label: "Timetable" },
        ]}
        actions={
          <Link href="/admin/timetable">
            <Button variant="outline" size="sm" className="gap-1.5">
              Full Timetable Panel <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{slotList.length}</p>
              <p className="text-sm text-muted-foreground">Total Slots</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTeachers}</p>
              <p className="text-sm text-muted-foreground">Teachers Assigned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
              <Calendar className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingEvents}</p>
              <p className="text-sm text-muted-foreground">Upcoming Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slot breakdown by day */}
      {slotList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Slots by Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {slotsByDay.map(({ day, count }) => (
                <div key={day} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{day.slice(0, 3)}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main action card */}
      <Card className="hover:shadow-md transition-shadow border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-base">Timetable Builder</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Visually build and assign class schedules with real-time conflict detection for teachers and rooms.
          </p>
          {slotList.length === 0 && (
            <div className="flex items-center gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              No schedule slots configured yet — open the builder to get started.
            </div>
          )}
          <Link href="/portal/admin/timetable/builder">
            <Button className="w-full gap-2">
              Open Timetable Builder <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Admin timetable links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/timetable/schedule">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-sm">Schedule View</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/timetable/events">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium text-sm">School Events</span>
                  {upcomingEvents > 0 && (
                    <Badge className="ml-2 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-0 text-[10px]">
                      {upcomingEvents} upcoming
                    </Badge>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
