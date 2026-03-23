"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Download,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type TimetableSlot = {
  _id: string;
  tenantId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  substituteTeacherId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  academicYear?: string;
  createdAt: number;
};

type SchoolEvent = {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type?: string;
};

export default function SchedulePage() {
  const { isLoading, sessionToken } = useAuth();
  const [dayFilter, setDayFilter] = useState<string>("all");

  const slots = useQuery(
    api.modules.timetable.queries.listSlots,
    sessionToken
      ? {
          dayOfWeek: dayFilter !== "all" ? Number(dayFilter) : undefined,
        }
      : "skip"
  );

  const events = useQuery(
    api.modules.timetable.queries.listEvents,
    sessionToken ? {} : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const allSlots = (slots as TimetableSlot[]) || [];

  const stats = {
    totalSlots: allSlots.length,
    uniqueClasses: new Set(allSlots.map((s) => s.classId)).size,
    uniqueTeachers: new Set(allSlots.map((s) => s.teacherId)).size,
    uniqueRooms: new Set(allSlots.filter((s) => s.room).map((s) => s.room)).size,
  };

  const columns: Column<TimetableSlot>[] = [
    {
      key: "dayOfWeek",
      header: "Day",
      sortable: true,
      cell: (row) => (
        <p className="font-medium">{DAYS[(row.dayOfWeek ?? 1) - 1] ?? "—"}</p>
      ),
    },
    {
      key: "time",
      header: "Time",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">
            {row.startTime} – {row.endTime}
          </span>
        </div>
      ),
    },
    {
      key: "subjectId",
      header: "Subject",
      sortable: true,
      cell: (row) => (
        <p className="font-medium">{row.subjectId}</p>
      ),
    },
    {
      key: "classId",
      header: "Class",
      cell: (row) => <span className="text-sm">{row.classId}</span>,
    },
    {
      key: "teacherId",
      header: "Teacher",
      cell: (row) => <span className="text-sm">{row.teacherId}</span>,
    },
    {
      key: "room",
      header: "Room",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span>{row.room ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "academicYear",
      header: "Academic Year",
      cell: (row) => (
        <Badge variant="outline">{row.academicYear ?? "—"}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Builder"
        description="Build and review timetable schedules across classes and rooms"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/timetable">
              <Button variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Timetable Overview
              </Button>
            </Link>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Export Schedule
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total Slots"
          value={stats.totalSlots}
          description="All scheduled periods"
          icon={Calendar}
        />
        <AdminStatsCard
          title="Classes"
          value={stats.uniqueClasses}
          description="Classes with schedules"
          icon={Users}
          variant="success"
        />
        <AdminStatsCard
          title="Teachers"
          value={stats.uniqueTeachers}
          description="Teachers assigned"
          icon={Users}
        />
        <AdminStatsCard
          title="Rooms Used"
          value={stats.uniqueRooms}
          description="Unique rooms allocated"
          icon={MapPin}
        />
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Day of Week</label>
              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="mt-1 w-48">
                  <SelectValue placeholder="All days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {DAYS.map((day, index) => (
                    <SelectItem key={day} value={String(index + 1)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Link href="/admin/timetable/assignments">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Teacher Assignments
              </Button>
            </Link>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Slot
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Schedule Slots</CardTitle>
          <span className="text-sm text-muted-foreground">
            {allSlots.length} slot{allSlots.length !== 1 ? "s" : ""}
          </span>
        </CardHeader>
        <CardContent>
          <DataTable
            data={allSlots}
            columns={columns}
            searchKey={(row) => `${row.subjectId ?? ""} ${row.classId ?? ""} ${row.teacherId ?? ""} ${row.room ?? ""}`}
            searchPlaceholder="Search by subject, class, teacher or room..."
            emptyTitle="No schedule slots found"
            emptyDescription="No timetable slots have been created yet. Use the timetable builder to add slots."
          />
        </CardContent>
      </Card>

      {/* School Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            School Events
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {(events ?? []).length} event{(events ?? []).length !== 1 ? "s" : ""}
          </span>
        </CardHeader>
        <CardContent>
          {!events ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading events...</p>
          ) : (events as SchoolEvent[]).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No school events found. Events added to the timetable will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {(events as SchoolEvent[]).map((event) => (
                <div
                  key={event._id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {event.type && (
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {event.startDate}
                      {event.endDate && event.endDate !== event.startDate
                        ? ` – ${event.endDate}`
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
