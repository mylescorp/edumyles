"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type TimetableSlot = {
  _id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  academicYear?: string;
};

type Conflict = {
  type: string;
  slotIds: string[];
  message: string;
};

export default function TimetablePage() {
  const { isLoading, sessionToken } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [checkConflictsDay, setCheckConflictsDay] = useState<string>("1");

  const classes = useQuery(
    api.modules.sis.queries.listClasses,
    sessionToken ? { sessionToken } : "skip"
  ) as Array<{ _id: string; name: string }> | undefined;

  const schedule = useQuery(
    api.modules.timetable.queries.getClassSchedule,
    sessionToken && selectedClassId ? { classId: selectedClassId } : "skip"
  ) as TimetableSlot[] | undefined;

  const conflicts = useQuery(
    api.modules.timetable.queries.getConflicts,
    sessionToken ? { dayOfWeek: Number(checkConflictsDay) } : "skip"
  ) as Conflict[] | undefined;

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const currentSchedule = schedule ?? [];
  const currentConflicts = conflicts ?? [];

  const stats = {
    totalClasses: (classes ?? []).length,
    selectedClassSlots: currentSchedule.length,
    conflictCount: currentConflicts.length,
    roomsUsed: new Set(currentSchedule.filter((slot) => slot.room).map((slot) => slot.room)).size,
  };

  const scheduleColumns: Column<TimetableSlot>[] = [
    {
      key: "dayOfWeek",
      header: "Day",
      cell: (row) => DAYS[row.dayOfWeek - 1] ?? "—",
      sortable: true,
    },
    {
      key: "time",
      header: "Time",
      cell: (row) => `${row.startTime} - ${row.endTime}`,
    },
    {
      key: "subjectId",
      header: "Subject",
      cell: (row) => row.subjectId,
    },
    {
      key: "teacherId",
      header: "Teacher",
      cell: (row) => row.teacherId,
    },
    {
      key: "room",
      header: "Room",
      cell: (row) => row.room ?? "—",
    },
  ];

  const conflictColumns: Column<Conflict>[] = [
    {
      key: "type",
      header: "Type",
      cell: (row) => <Badge variant="destructive">{row.type.replaceAll("_", " ")}</Badge>,
    },
    {
      key: "message",
      header: "Issue",
      cell: (row) => row.message,
    },
    {
      key: "slotIds",
      header: "Affected Slots",
      cell: (row) => `${row.slotIds.length} slot(s)`,
    },
  ];

  const dailyPreview = useMemo(() => {
    const grouped = new Map<number, number>();
    for (const slot of currentSchedule) {
      grouped.set(slot.dayOfWeek, (grouped.get(slot.dayOfWeek) ?? 0) + 1);
    }
    return grouped;
  }, [currentSchedule]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable Management"
        description="Review class schedules, teacher assignments, and real conflict checks from the timetable module."
        actions={(
          <div className="flex gap-2">
            <Link href="/admin/timetable/schedule">
              <Button variant="outline">Create Slots</Button>
            </Link>
            <Link href="/admin/timetable/assignments">
              <Button variant="outline">Teacher Assignments</Button>
            </Link>
            <Link href="/admin/timetable/events">
              <Button variant="outline">School Events</Button>
            </Link>
          </div>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatsCard title="Classes" value={stats.totalClasses} description="Classes available for scheduling" icon={Users} />
        <AdminStatsCard title="Selected Class Slots" value={stats.selectedClassSlots} description={selectedClassId ? "Slots for the selected class" : "Choose a class to inspect"} icon={Calendar} />
        <AdminStatsCard title="Conflict Checks" value={stats.conflictCount} description={`For ${DAYS[Number(checkConflictsDay) - 1]}`} icon={AlertTriangle} variant={stats.conflictCount > 0 ? "warning" : "success"} />
        <AdminStatsCard title="Rooms Used" value={stats.roomsUsed} description="Rooms referenced by the selected class" icon={MapPin} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {(classes ?? []).map((schoolClass) => (
                    <SelectItem key={schoolClass._id} value={schoolClass._id}>
                      {schoolClass.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conflict Check Day</label>
              <Select value={checkConflictsDay} onValueChange={setCheckConflictsDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, index) => (
                    <SelectItem key={day} value={String(index + 1)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              Slot creation, teacher workload review, and event scheduling are live in the linked pages above. This overview reflects the current backend-backed schedule state and conflict checks.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {DAYS.map((day, index) => (
              <div key={day} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">{day}</p>
                  <Badge variant="outline">{dailyPreview.get(index + 1) ?? 0}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {dailyPreview.get(index + 1) ? `${dailyPreview.get(index + 1)} slot(s) scheduled.` : "No slots for this day in the selected class."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Selected Class Schedule</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!selectedClassId ? (
              <p className="text-sm text-muted-foreground">Select a class to view its timetable slots.</p>
            ) : (
              <DataTable
                data={currentSchedule}
                columns={scheduleColumns}
                searchKey={(row) => `${row.subjectId} ${row.teacherId} ${row.room ?? ""}`}
                searchPlaceholder="Search class schedule..."
                emptyTitle="No slots found"
                emptyDescription="This class has no timetable slots yet."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Conflict Detection</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <DataTable
              data={currentConflicts}
              columns={conflictColumns}
              searchKey={(row) => `${row.type} ${row.message}`}
              searchPlaceholder="Search conflict messages..."
              emptyTitle="No conflicts found"
              emptyDescription="No teacher or room overlaps were detected for the selected day."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
