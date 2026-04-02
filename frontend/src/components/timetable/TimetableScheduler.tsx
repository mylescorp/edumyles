"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, Plus, Edit, Trash2 } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { toast } from "sonner";

type TimetableSlot = {
  _id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  className: string;
  subjectName: string;
  teacherName: string;
};

type CreateSlotData = {
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
};

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30",
];

export function TimetableScheduler() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [formData, setFormData] = useState<CreateSlotData>({
    classId: "",
    subjectId: "",
    teacherId: "",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:00",
    room: "",
  });

  // Fetch timetable slots
  const timetableSlots = useQuery(api.modules.timetable.listSlots, {}) || [];
  
  // Fetch classes, subjects, and teachers for dropdowns
  const classes = useQuery(api.modules.sis.listClasses, {}) || [];
  const subjects = useQuery(api.modules.academics.getSubjects, {}) || [];
  const teachers = useQuery(api.modules.hr.listStaff, {}) || [];

  // Mutations
  const createSlot = useMutation(api.modules.timetable.createSlot);
  const updateSlot = useMutation(api.modules.timetable.updateSlot);
  const deleteSlot = useMutation(api.modules.timetable.deleteSlot);
  const generateTimetable = useMutation(api.modules.timetable.generateTimetable);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSlot) {
        await updateSlot({
          slotId: editingSlot._id as any,
          updates: {
            classId: formData.classId,
            subjectId: formData.subjectId,
            teacherId: formData.teacherId,
            dayOfWeek: formData.dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime,
            room: formData.room,
          },
        });
        toast.success("Timetable slot updated successfully");
      } else {
        await createSlot(formData);
        toast.success("Timetable slot created successfully");
      }
      
      setIsCreateDialogOpen(false);
      setEditingSlot(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to save timetable slot");
    }
  };

  const handleEdit = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setFormData({
      classId: slot.classId,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (slotId: string) => {
    if (confirm("Are you sure you want to delete this timetable slot?")) {
      try {
        await deleteSlot({ slotId: slotId as any });
        toast.success("Timetable slot deleted successfully");
      } catch (error) {
        toast.error("Failed to delete timetable slot");
      }
    }
  };

  const handleGenerateTimetable = async (classId: string) => {
    if (confirm("This will replace the existing timetable for this class. Continue?")) {
      try {
        await generateTimetable({
          classId,
          academicYear: "2025", // Should be dynamic
          subjects: [], // Would need to be populated
        });
        toast.success("Timetable generated successfully");
      } catch (error) {
        toast.error("Failed to generate timetable");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      classId: "",
      subjectId: "",
      teacherId: "",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      room: "",
    });
  };

  const getSlotsForDay = (day: number) => {
    return timetableSlots.filter(slot => slot.dayOfWeek === day);
  };

  const getConflictStatus = (slot: TimetableSlot) => {
    // Simple conflict detection - can be enhanced
    const daySlots = getSlotsForDay(slot.dayOfWeek);
    const hasConflict = daySlots.some(otherSlot => 
      otherSlot._id !== slot._id &&
      ((slot.startTime >= otherSlot.startTime && slot.startTime < otherSlot.endTime) ||
       (slot.endTime > otherSlot.startTime && slot.endTime <= otherSlot.endTime) ||
       (slot.startTime <= otherSlot.startTime && slot.endTime >= otherSlot.endTime))
    );
    
    return hasConflict;
  };

  const getSlotColor = (slot: TimetableSlot) => {
    if (getConflictStatus(slot)) {
      return "bg-red-50 border-red-200 text-red-800";
    }
    return "bg-green-50 border-green-200 text-green-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Timetable Scheduler</h1>
          <p className="text-muted-foreground">Manage class schedules and room allocations</p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingSlot(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSlot ? "Edit Timetable Slot" : "Create New Slot"}
                </DialogTitle>
                <DialogDescription>
                  {editingSlot 
                    ? "Update the timetable slot details below."
                    : "Fill in the details to create a new timetable slot."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Day *</Label>
                  <Select
                    value={formData.dayOfWeek.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Select
                      value={formData.startTime}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Select
                      value={formData.endTime}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classId">Class *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: any) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjectId">Subject *</Label>
                    <Select
                      value={formData.subjectId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject: any) => (
                          <SelectItem key={subject._id} value={subject._id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teacherId">Teacher *</Label>
                    <Select
                      value={formData.teacherId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, teacherId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher: any) => (
                          <SelectItem key={teacher._id} value={teacher._id}>
                            {teacher.firstName} {teacher.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="Room number or name"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSlot ? "Update Slot" : "Create Slot"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex space-x-2 border-b">
        {DAYS.map(day => (
          <Button
            key={day.value}
            variant={selectedDay === day.value ? "default" : "ghost"}
            onClick={() => setSelectedDay(day.value)}
            className="rounded-b-none"
          >
            {day.label}
          </Button>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 gap-4">
        {DAYS.filter(day => day.value === selectedDay).map(day => {
          const daySlots = getSlotsForDay(day.value);
          
          return (
            <Card key={day.value} className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{day.label} Schedule</span>
                  <Badge variant="outline">{daySlots.length} slots</Badge>
                </CardTitle>
                <CardDescription>
                  {daySlots.length > 0 
                    ? `Schedule for ${day.label}`
                    : `No classes scheduled for ${day.label}`
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {daySlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="mx-auto h-12 w-12 mb-4" />
                    <p>No classes scheduled</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsCreateDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Slot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {daySlots.map((slot: TimetableSlot) => (
                      <div 
                        key={slot._id} 
                        className={`p-4 rounded-lg border ${getSlotColor(slot)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span className="font-semibold">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              {getConflictStatus(slot) && (
                                <Badge variant="destructive" className="ml-2">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Conflict
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-sm">
                              <p><strong>Class:</strong> {slot.className}</p>
                              <p><strong>Subject:</strong> {slot.subjectName}</p>
                              <p><strong>Teacher:</strong> {slot.teacherName}</p>
                              {slot.room && <p><strong>Room:</strong> {slot.room}</p>}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(slot)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(slot._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Auto-generation Section */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Timetable Generation</CardTitle>
          <CardDescription>
            Generate a complete timetable automatically for a class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls: any) => (
                <div key={cls._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{cls.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {cls.level || "N/A"} • {cls.stream || "N/A"}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleGenerateTimetable(cls._id)}
                    disabled={false}
                  >
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
