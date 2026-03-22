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
  Users,
  MapPin,
  Clock,
  Calendar,
  BarChart3,
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

type TeacherAssignment = {
  teacherId: string;
  slots: TimetableSlot[];
  totalPeriods: number;
  subjects: string[];
  rooms: string[];
  days: string[];
};

export default function AssignmentsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [viewMode, setViewMode] = useState<"teacher" | "room">("teacher");

  const slots = useQuery(
    api.modules.timetable.queries.listSlots,
    sessionToken ? {} : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const allSlots = (slots as TimetableSlot[]) || [];

  // Group slots by teacher
  const teacherMap = new Map<string, TimetableSlot[]>();
  for (const slot of allSlots) {
    if (!teacherMap.has(slot.teacherId)) teacherMap.set(slot.teacherId, []);
    teacherMap.get(slot.teacherId)!.push(slot);
  }

  const teacherAssignments: TeacherAssignment[] = Array.from(teacherMap.entries()).map(
    ([teacherId, teacherSlots]) => ({
      teacherId,
      slots: teacherSlots,
      totalPeriods: teacherSlots.length,
      subjects: Array.from(new Set(teacherSlots.map((s) => s.subjectId))),
      rooms: Array.from(new Set(teacherSlots.filter((s) => s.room).map((s) => s.room as string))),
      days: Array.from(new Set(teacherSlots.map((s) => DAYS[(s.dayOfWeek ?? 1) - 1] ?? ""))).filter(Boolean),
    })
  );

  // Group slots by room
  const roomMap = new Map<string, TimetableSlot[]>();
  for (const slot of allSlots) {
    const room = slot.room ?? "(No Room)";
    if (!roomMap.has(room)) roomMap.set(room, []);
    roomMap.get(room)!.push(slot);
  }

  type RoomAssignment = { room: string; slots: TimetableSlot[]; totalPeriods: number; teachers: string[]; subjects: string[] };
  const roomAssignments: RoomAssignment[] = Array.from(roomMap.entries()).map(
    ([room, roomSlots]) => ({
      room,
      slots: roomSlots,
      totalPeriods: roomSlots.length,
      teachers: Array.from(new Set(roomSlots.map((s) => s.teacherId))),
      subjects: Array.from(new Set(roomSlots.map((s) => s.subjectId))),
    })
  );

  const stats = {
    totalTeachers: teacherAssignments.length,
    totalRooms: roomAssignments.filter((r) => r.room !== "(No Room)").length,
    avgPeriodsPerTeacher:
      teacherAssignments.length > 0
        ? Math.round(allSlots.length / teacherAssignments.length)
        : 0,
    unassignedSlots: allSlots.filter((s) => !s.room).length,
  };

  const teacherColumns: Column<TeacherAssignment>[] = [
    {
      key: "teacherId",
      header: "Teacher",
      sortable: true,
      cell: (row) => <p className="font-medium">{row.teacherId}</p>,
    },
    {
      key: "totalPeriods",
      header: "Periods",
      sortable: true,
      cell: (row) => (
        <Badge variant="secondary">{row.totalPeriods} period{row.totalPeriods !== 1 ? "s" : ""}</Badge>
      ),
    },
    {
      key: "subjects",
      header: "Subjects",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.subjects.slice(0, 3).map((subject) => (
            <Badge key={subject} variant="outline" className="text-xs">
              {subject}
            </Badge>
          ))}
          {row.subjects.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.subjects.length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "rooms",
      header: "Rooms",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.rooms.join(", ") || "—"}</span>
        </div>
      ),
    },
    {
      key: "days",
      header: "Days",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.days.map((day) => (
            <Badge key={day} variant="outline" className="text-xs">
              {day.slice(0, 3)}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  const roomColumns: Column<RoomAssignment>[] = [
    {
      key: "room",
      header: "Room",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">{row.room}</p>
        </div>
      ),
    },
    {
      key: "totalPeriods",
      header: "Total Periods",
      sortable: true,
      cell: (row) => (
        <Badge variant="secondary">{row.totalPeriods} period{row.totalPeriods !== 1 ? "s" : ""}</Badge>
      ),
    },
    {
      key: "teachers",
      header: "Teachers",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.teachers.slice(0, 3).map((teacher) => (
            <Badge key={teacher} variant="outline" className="text-xs">
              {teacher}
            </Badge>
          ))}
          {row.teachers.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.teachers.length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "subjects",
      header: "Subjects",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.subjects.slice(0, 3).map((subject) => (
            <Badge key={subject} variant="outline" className="text-xs">
              {subject}
            </Badge>
          ))}
          {row.subjects.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.subjects.length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Assignments"
        description="Manage teacher workload and room allocations across the timetable"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/timetable/schedule">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Builder
              </Button>
            </Link>
            <Link href="/admin/timetable">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Timetable Overview
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Teachers Assigned"
          value={stats.totalTeachers}
          description="With active timetable slots"
          icon={Users}
          variant="success"
        />
        <AdminStatsCard
          title="Rooms in Use"
          value={stats.totalRooms}
          description="Allocated rooms"
          icon={MapPin}
        />
        <AdminStatsCard
          title="Avg Periods / Teacher"
          value={stats.avgPeriodsPerTeacher}
          description="Weekly teaching load"
          icon={Clock}
        />
        <AdminStatsCard
          title="Unassigned Rooms"
          value={stats.unassignedSlots}
          description="Slots without a room"
          icon={MapPin}
          variant={stats.unassignedSlots > 0 ? "warning" : "default"}
        />
      </div>

      {/* View Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>View Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as "teacher" | "room")}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">By Teacher</SelectItem>
              <SelectItem value="room">By Room</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      {viewMode === "teacher" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teacher Workload
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {teacherAssignments.length} teacher{teacherAssignments.length !== 1 ? "s" : ""}
            </span>
          </CardHeader>
          <CardContent>
            <DataTable
              data={teacherAssignments}
              columns={teacherColumns}
              searchKey={(row) => `${row.teacherId ?? ""} ${row.subjects.join(" ")} ${row.rooms.join(" ")}`}
              searchPlaceholder="Search by teacher, subject or room..."
              emptyTitle="No teacher assignments found"
              emptyDescription="No timetable slots have been assigned to teachers yet."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Room Assignments
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {roomAssignments.length} room{roomAssignments.length !== 1 ? "s" : ""}
            </span>
          </CardHeader>
          <CardContent>
            <DataTable
              data={roomAssignments}
              columns={roomColumns}
              searchKey={(row) => `${row.room ?? ""} ${row.teachers.join(" ")} ${row.subjects.join(" ")}`}
              searchPlaceholder="Search by room, teacher or subject..."
              emptyTitle="No room assignments found"
              emptyDescription="No timetable slots with room assignments exist yet."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
