"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Save,
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useState } from "react";

interface Subject {
  id: string;
  name: string;
  code: string;
  duration: number; // in minutes
  color: string;
}

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  maxHours: number;
  currentHours: number;
  availability: {
    day: number;
    periods: number[];
  }[];
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  type: "classroom" | "lab" | "hall" | "library";
  equipment: string[];
}

interface Class {
  id: string;
  name: string;
  grade: string;
  students: number;
  subjects: string[];
}

interface ScheduleSlot {
  id: string;
  day: number;
  period: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  classId: string;
  status: "scheduled" | "conflict" | "pending";
}

interface Conflict {
  id: string;
  type: "teacher" | "room" | "class" | "subject";
  severity: "low" | "medium" | "high";
  description: string;
  affectedSlots: string[];
  suggestions: string[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  { id: 1, start: "08:00", end: "08:40" },
  { id: 2, start: "08:45", end: "09:25" },
  { id: 3, start: "09:40", end: "10:20" },
  { id: 4, start: "10:35", end: "11:15" },
  { id: 5, start: "11:30", end: "12:10" },
  { id: 6, start: "12:40", end: "13:20" },
  { id: 7, start: "13:25", end: "14:05" },
  { id: 8, start: "14:10", end: "14:50" },
];

export default function ScheduleBuilderPage() {
  const { isLoading } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [autoResolve, setAutoResolve] = useState<boolean>(false);
  const [showConflicts, setShowConflicts] = useState<boolean>(true);

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // Mock data for demonstration
  const subjects: Subject[] = [
    { id: "sub1", name: "Mathematics", code: "MATH", duration: 40, color: "#3B82F6" },
    { id: "sub2", name: "English", code: "ENG", duration: 40, color: "#10B981" },
    { id: "sub3", name: "Science", code: "SCI", duration: 40, color: "#8B5CF6" },
    { id: "sub4", name: "Social Studies", code: "SS", duration: 40, color: "#F59E0B" },
    { id: "sub5", name: "Physical Education", code: "PE", duration: 40, color: "#EF4444" },
  ];

  const teachers: Teacher[] = [
    { id: "t1", name: "Alice Johnson", subjects: ["sub1"], maxHours: 30, currentHours: 24, availability: [] },
    { id: "t2", name: "Bob Wilson", subjects: ["sub2"], maxHours: 30, currentHours: 20, availability: [] },
    { id: "t3", name: "Mary Wanjiku", subjects: ["sub3"], maxHours: 25, currentHours: 18, availability: [] },
    { id: "t4", name: "James Otieno", subjects: ["sub4"], maxHours: 25, currentHours: 15, availability: [] },
    { id: "t5", name: "Grace Kimani", subjects: ["sub5"], maxHours: 20, currentHours: 12, availability: [] },
  ];

  const rooms: Room[] = [
    { id: "r1", name: "Room 101", capacity: 30, type: "classroom", equipment: ["projector", "whiteboard"] },
    { id: "r2", name: "Science Lab", capacity: 25, type: "lab", equipment: ["microscope", "bunsen"] },
    { id: "r3", name: "Computer Lab", capacity: 20, type: "lab", equipment: ["computers", "internet"] },
    { id: "r4", name: "Assembly Hall", capacity: 100, type: "hall", equipment: ["sound", "projector"] },
    { id: "r5", name: "Library", capacity: 40, type: "library", equipment: ["books", "study_areas"] },
  ];

  const classes: Class[] = [
    { id: "c1", name: "Grade 8A", grade: "8", students: 28, subjects: ["sub1", "sub2", "sub3", "sub4", "sub5"] },
    { id: "c2", name: "Grade 8B", grade: "8", students: 26, subjects: ["sub1", "sub2", "sub3", "sub4", "sub5"] },
    { id: "c3", name: "Grade 7A", grade: "7", students: 24, subjects: ["sub1", "sub2", "sub3", "sub4"] },
  ];

  const scheduleSlots: ScheduleSlot[] = [
    {
      id: "s1",
      day: 1,
      period: 1,
      startTime: "08:00",
      endTime: "08:40",
      subjectId: "sub1",
      teacherId: "t1",
      roomId: "r1",
      classId: "c1",
      status: "scheduled",
    },
    {
      id: "s2",
      day: 1,
      period: 2,
      startTime: "08:45",
      endTime: "09:25",
      subjectId: "sub2",
      teacherId: "t2",
      roomId: "r1",
      classId: "c1",
      status: "scheduled",
    },
    {
      id: "s3",
      day: 1,
      period: 3,
      startTime: "09:40",
      endTime: "10:20",
      subjectId: "sub3",
      teacherId: "t3",
      roomId: "r2",
      classId: "c1",
      status: "conflict",
    },
  ];

  const conflicts: Conflict[] = [
    {
      id: "conf1",
      type: "teacher",
      severity: "high",
      description: "Alice Johnson is double-booked in Period 3, Monday",
      affectedSlots: ["s3"],
      suggestions: ["Move to Period 4", "Assign different teacher", "Reschedule to Tuesday"],
    },
    {
      id: "conf2",
      type: "room",
      severity: "medium",
      description: "Science Lab is over capacity for Grade 8A",
      affectedSlots: ["s3"],
      suggestions: ["Use Computer Lab instead", "Split the class", "Move to Assembly Hall"],
    },
  ];

  const stats = {
    totalSlots: scheduleSlots.length,
    scheduledSlots: scheduleSlots.filter(s => s.status === "scheduled").length,
    conflictSlots: scheduleSlots.filter(s => s.status === "conflict").length,
    pendingSlots: scheduleSlots.filter(s => s.status === "pending").length,
    totalConflicts: conflicts.length,
    highSeverityConflicts: conflicts.filter(c => c.severity === "high").length,
    teacherUtilization: Math.round((teachers.reduce((sum, t) => sum + t.currentHours, 0) / teachers.reduce((sum, t) => sum + t.maxHours, 0)) * 100),
    roomUtilization: 75, // Mock calculation
  };

  const getSubjectInfo = (subjectId: string) => subjects.find(s => s.id === subjectId);
  const getTeacherInfo = (teacherId: string) => teachers.find(t => t.id === teacherId);
  const getRoomInfo = (roomId: string) => rooms.find(r => r.id === roomId);
  const getClassInfo = (classId: string) => classes.find(c => c.id === classId);

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getSlotStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "default";
      case "conflict": return "destructive";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Builder"
        description="Advanced timetable creation with intelligent conflict resolution"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Auto-Resolve
            </Button>
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Save Schedule
            </Button>
          </div>
        }
      />

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="class">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.students} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="term">Academic Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term1">Term 1 (Jan-Apr)</SelectItem>
                  <SelectItem value="term2">Term 2 (May-Aug)</SelectItem>
                  <SelectItem value="term3">Term 3 (Sep-Dec)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoResolve"
                  checked={autoResolve}
                  onChange={(e) => setAutoResolve(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="autoResolve">Auto-resolve conflicts</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Scheduled Slots"
          value={stats.scheduledSlots}
          description="Successfully scheduled"
          icon={CheckCircle}
          variant="success"
        />
        <AdminStatsCard
          title="Conflicts"
          value={stats.conflictSlots}
          description="Need resolution"
          icon={AlertTriangle}
          variant="danger"
        />
        <AdminStatsCard
          title="Teacher Utilization"
          value={`${stats.teacherUtilization}%`}
          description="Average workload"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <AdminStatsCard
          title="Room Utilization"
          value={`${stats.roomUtilization}%`}
          description="Space efficiency"
          icon={MapPin}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Schedule Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Weekly Schedule</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Slot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2 bg-gray-50 text-sm font-medium">Period</th>
                      <th className="border border-gray-300 p-2 bg-gray-50 text-sm font-medium">Time</th>
                      {DAYS.map((day) => (
                        <th key={day} className="border border-gray-300 p-2 bg-gray-50 text-sm font-medium">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period) => (
                      <tr key={period.id}>
                        <td className="border border-gray-300 p-2 text-center font-medium text-sm">
                          Period {period.id}
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-sm text-muted-foreground">
                          {period.start} - {period.end}
                        </td>
                        {DAYS.map((day, dayIndex) => {
                          const slot = scheduleSlots.find(
                            s => s.day === dayIndex + 1 && s.period === period.id
                          );
                          const subject = slot ? getSubjectInfo(slot.subjectId) : null;
                          const teacher = slot ? getTeacherInfo(slot.teacherId) : null;
                          const room = slot ? getRoomInfo(slot.roomId) : null;
                          
                          return (
                            <td key={day} className="border border-gray-300 p-1 align-top">
                              {slot ? (
                                <div
                                  className="p-2 rounded text-xs"
                                  style={{ backgroundColor: subject?.color + "20", borderLeft: `4px solid ${subject?.color}` }}
                                >
                                  <div className="font-medium">{subject?.name}</div>
                                  <div className="text-muted-foreground">{teacher?.name}</div>
                                  <div className="text-muted-foreground">{room?.name}</div>
                                  <Badge variant={getSlotStatusColor(slot.status)} className="mt-1 text-xs">
                                    {slot.status}
                                  </Badge>
                                </div>
                              ) : (
                                <div className="p-2 text-center text-muted-foreground text-xs">
                                  Empty
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conflicts Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Conflicts ({conflicts.length})
              </CardTitle>
              <Button size="sm" variant="outline">
                Resolve All
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {conflicts.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-medium">No conflicts detected!</p>
                  <p className="text-sm text-muted-foreground">Schedule is conflict-free</p>
                </div>
              ) : (
                conflicts.map((conflict) => (
                  <div key={conflict.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={getConflictSeverityColor(conflict.severity)}>
                        {conflict.type} - {conflict.severity}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium">{conflict.description}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Suggestions:</p>
                      {conflict.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-xs text-blue-600 cursor-pointer hover:underline">
                          • {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Resources Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Resources Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teachers
                </h4>
                <div className="space-y-2">
                  {teachers.slice(0, 3).map((teacher) => (
                    <div key={teacher.id} className="flex justify-between text-sm">
                      <span>{teacher.name}</span>
                      <span className="text-muted-foreground">
                        {teacher.currentHours}/{teacher.maxHours} hrs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Rooms
                </h4>
                <div className="space-y-2">
                  {rooms.slice(0, 3).map((room) => (
                    <div key={room.id} className="flex justify-between text-sm">
                      <span>{room.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {room.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
