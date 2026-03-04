"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  AlertTriangle, 
  Save,
  Plus,
  Trash2,
  Edit,
  Copy,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface TimetableSlot {
  _id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  academicYear?: string;
  subjectName?: string;
  teacherName?: string;
  className?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
];

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
];

export default function TimetableBuilderPage() {
  const { user, isLoading } = useAuth();
  const [selectedDay, setSelectedDay] = useState(1); // Monday
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2024");
  const [conflicts, setConflicts] = useState<any[]>([]);

  const classes = useQuery(
    api.modules.sis.queries.listClasses,
    user ? {} : "skip"
  );

  const slots = useQuery(
    api.modules.timetable.queries.listSlots,
    user ? { 
      classId: selectedClass || undefined,
      dayOfWeek: selectedDay,
      academicYear: selectedAcademicYear
    } : "skip"
  );

  const conflictsData = useQuery(
    api.modules.timetable.queries.getConflicts,
    user ? { 
      dayOfWeek: selectedDay,
      academicYear: selectedAcademicYear 
    } : "skip"
  );

  const createSlot = useMutation(api.modules.timetable.mutations.createSlot);
  const updateSlot = useMutation(api.modules.timetable.mutations.updateSlot);
  const deleteSlot = useMutation(api.modules.timetable.mutations.deleteSlot);

  const handleCreateSlot = async (dayOfWeek: number, timeSlot: string) => {
    const [startTime, endTime] = timeSlot.split('-');
    
    try {
      await createSlot({
        classId: selectedClass,
        subjectId: "default-subject",
        teacherId: "default-teacher",
        dayOfWeek,
        startTime,
        endTime,
        room: "default-room",
        academicYear: selectedAcademicYear,
      });
      
      toast({
        title: "Success",
        description: "New timetable slot created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create timetable slot",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot({ slotId });
      toast({
        title: "Success",
        description: "Timetable slot deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete timetable slot",
        variant: "destructive"
      });
    }
  };

  const getSlotForTime = (dayOfWeek: number, timeSlot: string) => {
    return slots?.filter(slot => 
      slot.dayOfWeek === dayOfWeek && 
      slot.startTime === timeSlot.split('-')[0]
    );
  };

  const getConflictForSlot = (slot: TimetableSlot) => {
    return conflictsData?.find(conflict => 
      conflict.slotIds.includes(slot._id)
    );
  };

  const getColorForSlot = (slot: TimetableSlot) => {
    const conflict = getConflictForSlot(slot);
    if (conflict) {
      return 'bg-red-100 border-red-300 text-red-800';
    }
    const colorIndex = slot.subjectId?.charCodeAt(0) % COLORS.length || 0;
    return COLORS[colorIndex];
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Visual Timetable Builder"
        description="Create and manage class schedules with conflict detection"
      />

      <div className="space-y-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timetable Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Day Filter</Label>
                <div className="flex gap-2">
                  {DAYS.map((day, index) => (
                    <Button
                      key={day}
                      variant={selectedDay === index + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDay(index + 1)}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quick Actions</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Week
                  </Button>
                  <Button size="sm" variant="outline">
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Clear Conflicts
                  </Button>
                  <Button size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conflicts Alert */}
        {conflictsData && conflictsData.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                {conflictsData.length} Conflict{conflictsData.length > 1 ? 's' : ''} Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conflictsData.map((conflict, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Badge variant="destructive">
                      {conflict.type === 'teacher_double_booking' ? 'Teacher Conflict' : 'Room Conflict'}
                    </Badge>
                    <span className="text-red-700">{conflict.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timetable Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {DAYS[selectedDay - 1]} Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header */}
                <div className="grid grid-cols-6 gap-2 mb-2">
                  <div className="font-medium text-sm">Time</div>
                  {DAYS.map(day => (
                    <div key={day} className="font-medium text-sm">{day}</div>
                  ))}
                </div>

                {/* Time Slots */}
                {TIME_SLOTS.map((timeSlot) => (
                  <div key={timeSlot} className="grid grid-cols-6 gap-2">
                    <div className="font-medium text-sm py-2 border-r">
                      {timeSlot}
                    </div>
                    
                    {DAYS.map((day, dayIndex) => {
                      const daySlots = getSlotForTime(dayIndex + 1, timeSlot);
                      const isCurrentDay = dayIndex + 1 === selectedDay;
                      
                      return (
                        <div
                          key={`${dayIndex + 1}-${timeSlot}`}
                          className={`min-h-[60px] border rounded p-1 ${
                            isCurrentDay ? 'bg-gray-50' : 'bg-gray-100 opacity-50'
                          }`}
                        >
                          {daySlots?.map((slot) => {
                            const conflict = getConflictForSlot(slot);
                            return (
                              <div
                                key={slot._id}
                                className={`p-2 rounded transition-all ${
                                  getColorForSlot(slot)
                                }`}
                              >
                                <div className="text-xs font-medium">
                                  {slot.subjectName || 'Subject'}
                                </div>
                                <div className="text-xs opacity-75">
                                  {slot.teacherName || 'Teacher'}
                                </div>
                                {slot.room && (
                                  <div className="text-xs opacity-75 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {slot.room}
                                  </div>
                                )}
                                {conflict && (
                                  <div className="text-xs font-bold text-red-600 mt-1">
                                    ⚠️ Conflict
                                  </div>
                                )}
                                <div className="flex gap-1 mt-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteSlot(slot._id)}
                                    className="h-6 w-6 p-0 text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                          
                          {daySlots?.length === 0 && isCurrentDay && (
                            <div className="flex items-center justify-center h-full">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCreateSlot(dayIndex + 1, timeSlot)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-sm">Regular Class</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-sm">Conflict Detected</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded opacity-50"></div>
                  <span className="text-sm">Non-Selected Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Add New Slot</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
