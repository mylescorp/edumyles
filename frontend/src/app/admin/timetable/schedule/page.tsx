"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Plus, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createTimetableSlotSchema } from "@shared/validators";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type TimetableSlot = {
  _id: Id<"timetables">;
  classId: string;
  subjectId: string;
  teacherId: string;
  substituteTeacherId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  academicYear?: string;
};

type SchoolClass = {
  _id: string;
  name: string;
};

type StaffMember = {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
};

const EMPTY_SLOTS: TimetableSlot[] = [];
const EMPTY_CLASSES: SchoolClass[] = [];
const EMPTY_TEACHERS: StaffMember[] = [];

export default function SchedulePage() {
  const { isLoading, sessionToken } = useAuth();
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [room, setRoom] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slots = useQuery(
    api.modules.timetable.queries.listSlots,
    sessionToken ? { dayOfWeek: dayFilter !== "all" ? Number(dayFilter) : undefined } : "skip"
  );

  const events = useQuery(
    api.modules.timetable.queries.listEvents,
    sessionToken ? {} : "skip"
  );

  const classes = useQuery(
    api.modules.sis.queries.listClasses,
    sessionToken ? { sessionToken } : "skip"
  ) as SchoolClass[] | undefined;

  const teachers = useQuery(
    api.modules.hr.queries.listStaff,
    sessionToken ? { sessionToken, role: "teacher" } : "skip"
  ) as StaffMember[] | undefined;

  const createSlot = useMutation(api.modules.timetable.mutations.createSlot);
  const allSlots = (slots as TimetableSlot[] | undefined) ?? EMPTY_SLOTS;
  const classList = classes ?? EMPTY_CLASSES;
  const teacherList = teachers ?? EMPTY_TEACHERS;
  const classMap = new Map(classList.map((item) => [item._id, item.name]));
  const teacherMap = new Map(teacherList.map((item) => [item._id, `${item.firstName} ${item.lastName}`.trim()]));

  const stats = {
    totalSlots: allSlots.length,
    uniqueClasses: new Set(allSlots.map((slot) => slot.classId)).size,
    uniqueTeachers: new Set(allSlots.map((slot) => slot.teacherId)).size,
    uniqueRooms: new Set(allSlots.filter((slot) => slot.room).map((slot) => slot.room)).size,
  };

  const slotsByDay = useMemo(() => {
    const grouped = new Map<number, TimetableSlot[]>();
    for (const slot of allSlots) {
      const list = grouped.get(slot.dayOfWeek) ?? [];
      list.push(slot);
      grouped.set(slot.dayOfWeek, list);
    }
    for (const [key, list] of grouped.entries()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
      grouped.set(key, list);
    }
    return grouped;
  }, [allSlots]);

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const columns: Column<TimetableSlot>[] = [
    {
      key: "dayOfWeek",
      header: "Day",
      sortable: true,
      cell: (row) => DAYS[(row.dayOfWeek ?? 1) - 1] ?? "—",
    },
    {
      key: "time",
      header: "Time",
      cell: (row) => `${row.startTime} - ${row.endTime}`,
    },
    {
      key: "subjectId",
      header: "Subject",
      sortable: true,
      cell: (row) => row.subjectId,
    },
    {
      key: "classId",
      header: "Class",
      cell: (row) => classMap.get(row.classId) ?? row.classId,
    },
    {
      key: "teacherId",
      header: "Teacher",
      cell: (row) => teacherMap.get(row.teacherId) ?? row.teacherId,
    },
    {
      key: "room",
      header: "Room",
      cell: (row) => row.room ?? "—",
    },
    {
      key: "academicYear",
      header: "Academic Year",
      cell: (row) => row.academicYear ? <Badge variant="outline">{row.academicYear}</Badge> : "—",
    },
  ];

  const handleCreateSlot = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = createTimetableSlotSchema.safeParse({
      classId,
      subjectId,
      teacherId,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      room: room || undefined,
      academicYear: academicYear || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fix the timetable slot details.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSlot(parsed.data);
      toast.success("Timetable slot created.");
      setSubjectId("");
      setStartTime("");
      setEndTime("");
      setRoom("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create timetable slot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Builder"
        description="Create timetable slots that map directly to the Convex timetable module."
        actions={(
          <div className="flex gap-2">
            <Link href="/admin/timetable">
              <Button variant="outline">Timetable Overview</Button>
            </Link>
            <Link href="/admin/timetable/assignments">
              <Button variant="outline">Teacher Assignments</Button>
            </Link>
          </div>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatsCard title="Total Slots" value={stats.totalSlots} description="All timetable entries" icon={Calendar} />
        <AdminStatsCard title="Classes Covered" value={stats.uniqueClasses} description="Classes with at least one slot" icon={Users} />
        <AdminStatsCard title="Teachers Scheduled" value={stats.uniqueTeachers} description="Teachers in active slots" icon={Users} variant="success" />
        <AdminStatsCard title="Rooms In Use" value={stats.uniqueRooms} description="Distinct rooms referenced" icon={MapPin} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Timetable Slot</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateSlot}>
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger id="classId">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classList.map((schoolClass) => (
                      <SelectItem key={schoolClass._id} value={schoolClass._id}>
                        {schoolClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherId">Teacher</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger id="teacherId">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherList.map((teacher) => (
                      <SelectItem key={teacher._id} value={teacher._id}>
                        {teacherMap.get(teacher._id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">Subject ID / Code</Label>
                <Input id="subjectId" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} placeholder="e.g. mathematics" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Day</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger id="dayOfWeek">
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
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input id="academicYear" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} placeholder="e.g. 2026" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Input id="room" value={room} onChange={(event) => setRoom(event.target.value)} placeholder="e.g. Lab 2" />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                <Plus className="h-4 w-4" />
                {isSubmitting ? "Creating..." : "Create Slot"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filter Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="max-w-xs">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Schedule Slots</CardTitle>
              <span className="text-sm text-muted-foreground">{allSlots.length} slots</span>
            </CardHeader>
            <CardContent>
              <DataTable
                data={allSlots}
                columns={columns}
                searchable
                searchPlaceholder="Search by subject, class, teacher or room..."
                searchKey={(row) => `${row.subjectId} ${classMap.get(row.classId) ?? row.classId} ${teacherMap.get(row.teacherId) ?? row.teacherId} ${row.room ?? ""}`}
                emptyTitle="No schedule slots found"
                emptyDescription="Create timetable slots to start building class schedules."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Weekly Snapshot</CardTitle>
          <Link href="/admin/timetable/events">
            <Button variant="outline">View School Events</Button>
          </Link>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {DAYS.map((day, index) => {
            const count = slotsByDay.get(index + 1)?.length ?? 0;
            return (
              <div key={day} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">{day}</p>
                  <Badge variant="outline">{count}</Badge>
                </div>
                <div className="space-y-2">
                  {(slotsByDay.get(index + 1) ?? []).slice(0, 3).map((slot) => (
                    <div key={slot._id} className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                      <p className="font-medium">{slot.subjectId}</p>
                      <p className="text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                  ))}
                  {count === 0 && <p className="text-sm text-muted-foreground">No slots scheduled.</p>}
                  {count > 3 && <p className="text-xs text-muted-foreground">+{count - 3} more slots that day</p>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Events</CardTitle>
          <span className="text-sm text-muted-foreground">{((events as Array<{ _id: string }> | undefined) ?? []).length} events</span>
        </CardHeader>
        <CardContent className="space-y-2">
          {((events as Array<{ _id: string; title: string; startDate: string; eventType?: string }> | undefined) ?? []).slice(0, 5).map((event) => (
            <div key={event._id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-muted-foreground">{event.startDate}</p>
              </div>
              <Badge variant="outline">{event.eventType ?? "other"}</Badge>
            </div>
          ))}
          {(!events || (events as unknown[]).length === 0) && (
            <p className="text-sm text-muted-foreground">No events scheduled yet. Use the events page to add school calendar entries.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
