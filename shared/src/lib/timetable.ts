// ============================================================
// EduMyles — Timetable Scheduling Engine
// ============================================================

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  isCore: boolean;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subjects: string[]; // Subject IDs they can teach
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  preferences: {
    preferredDays: number[]; // 0-6 (Sun-Sat)
    preferredTimes: string[]; // "morning", "afternoon", "evening"
    avoidTimes: string[];
  };
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  building: string;
  floor: string;
  isAvailable: boolean;
}

export interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  startTime: string; // "08:00"
  endTime: string; // "09:00"
  period: number; // 1, 2, 3, etc.
}

export interface TimetableEntry {
  id: string;
  tenantId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  timeSlotId: string;
  academicYear: string;
  term: string;
  status: 'scheduled' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimetableConflict {
  type: 'teacher_conflict' | 'classroom_conflict' | 'student_conflict';
  teacherId?: string;
  classroomId?: string;
  classId?: string;
  timeSlotId: string;
  existingEntryId: string;
  newEntryId: string;
  message: string;
}

export interface SchedulingConstraints {
  maxSubjectsPerDay: number;
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  minBreakBetweenClasses: number; // minutes
  preferredSubjectDistribution: Record<string, number>; // subjectId -> max hours per week
  avoidConsecutiveSameSubject: boolean;
  ensureCoreSubjectsPriority: boolean;
}

export class TimetableEngine {
  private static readonly DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  private static readonly TIME_PERIODS = [
    { period: 1, startTime: '08:00', endTime: '09:00' },
    { period: 2, startTime: '09:00', endTime: '10:00' },
    { period: 3, startTime: '10:00', endTime: '11:00' },
    { period: 4, startTime: '11:00', endTime: '12:00' },
    { period: 5, startTime: '12:00', endTime: '13:00' }, // Lunch break
    { period: 6, startTime: '13:00', endTime: '14:00' },
    { period: 7, startTime: '14:00', endTime: '15:00' },
    { period: 8, startTime: '15:00', endTime: '16:00' },
    { period: 9, startTime: '16:00', endTime: '17:00' },
  ];

  /**
   * Generate time slots for a week
   */
  static generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    for (let day = 1; day <= 5; day++) { // Monday to Friday
      for (const period of this.TIME_PERIODS) {
        if (period.period === 5) continue; // Skip lunch break
        
        slots.push({
          id: `slot-${day}-${period.period}`,
          dayOfWeek: day,
          startTime: period.startTime,
          endTime: period.endTime,
          period: period.period,
        });
      }
    }
    
    return slots;
  }

  /**
   * Check for scheduling conflicts
   */
  static detectConflicts(
    entry: Omit<TimetableEntry, 'id' | 'createdAt' | 'updatedAt'>,
    existingEntries: TimetableEntry[],
    teachers: Teacher[],
    classrooms: Classroom[]
  ): TimetableConflict[] {
    const conflicts: TimetableConflict[] = [];

    // Check teacher conflicts
    const teacher = teachers.find(t => t.id === entry.teacherId);
    if (teacher) {
      const teacherEntries = existingEntries.filter(e => 
        e.teacherId === entry.teacherId && 
        e.timeSlotId === entry.timeSlotId &&
        e.status === 'scheduled'
      );

      if (teacherEntries.length > 0) {
        conflicts.push({
          type: 'teacher_conflict',
          teacherId: entry.teacherId,
          timeSlotId: entry.timeSlotId,
          existingEntryId: teacherEntries[0]!.id,
          newEntryId: 'new',
          message: `Teacher ${teacher.firstName} ${teacher.lastName} is already scheduled at this time`,
        });
      }
    }

    // Check classroom conflicts
    const classroom = classrooms.find(c => c.id === entry.classroomId);
    if (classroom) {
      const classroomEntries = existingEntries.filter(e => 
        e.classroomId === entry.classroomId && 
        e.timeSlotId === entry.timeSlotId &&
        e.status === 'scheduled'
      );

      if (classroomEntries.length > 0) {
        conflicts.push({
          type: 'classroom_conflict',
          classroomId: entry.classroomId,
          timeSlotId: entry.timeSlotId,
          existingEntryId: classroomEntries[0]!.id,
          newEntryId: 'new',
          message: `Classroom ${classroom.name} is already occupied at this time`,
        });
      }
    }

    // Check class conflicts (students can't be in two places at once)
    const classEntries = existingEntries.filter(e => 
      e.classId === entry.classId && 
      e.timeSlotId === entry.timeSlotId &&
      e.status === 'scheduled'
    );

    if (classEntries.length > 0) {
      conflicts.push({
        type: 'student_conflict',
        classId: entry.classId,
        timeSlotId: entry.timeSlotId,
        existingEntryId: classEntries[0]!.id,
        newEntryId: 'new',
        message: `Class is already scheduled at this time`,
      });
    }

    return conflicts;
  }

  /**
   * Generate optimal timetable using constraint-based scheduling
   */
  static generateTimetable(
    classId: string,
    subjects: Subject[],
    teachers: Teacher[],
    classrooms: Classroom[],
    constraints: SchedulingConstraints,
    academicYear: string,
    term: string
  ): {
    success: boolean;
    entries: TimetableEntry[];
    conflicts: TimetableConflict[];
    utilization: {
      teacherUtilization: Record<string, number>;
      classroomUtilization: Record<string, number>;
      subjectDistribution: Record<string, number>;
    };
  } {
    const timeSlots = this.generateTimeSlots();
    const entries: TimetableEntry[] = [];
    const conflicts: TimetableConflict[] = [];

    // Initialize tracking
    const teacherHours: Record<string, number> = {};
    const classroomHours: Record<string, number> = {};
    const subjectHours: Record<string, number> = {};

    // Sort subjects by priority (core subjects first)
    const sortedSubjects = subjects.sort((a, b) => {
      if (a.isCore && !b.isCore) return -1;
      if (!a.isCore && b.isCore) return 1;
      return 0;
    });

    // Simple greedy scheduling algorithm
    for (const timeSlot of timeSlots) {
      // Find available teachers for this time slot
      const availableTeachers = teachers.filter(teacher => 
        teacher.subjects.some(subjectId => 
          sortedSubjects.some(subject => subject.id === subjectId)
        ) &&
        teacher.preferences.preferredDays.includes(timeSlot.dayOfWeek) &&
        !teacher.preferences.avoidTimes.includes(this.getTimeOfDay(timeSlot.startTime))
      );

      // Find available classrooms
      const availableClassrooms = classrooms.filter(classroom => 
        classroom.isAvailable && classroom.capacity >= 30 // Minimum class size
      );

      if (availableTeachers.length === 0 || availableClassrooms.length === 0) {
        continue;
      }

      // Select best teacher (based on availability and preferences)
      const bestTeacher = this.selectBestTeacher(availableTeachers, timeSlot, teacherHours, constraints);
      if (!bestTeacher) continue;

      // Select best classroom (based on capacity and equipment)
      const bestClassroom = this.selectBestClassroom(availableClassrooms, bestTeacher);
      if (!bestClassroom) continue;

      // Select subject (prioritize core subjects and balance distribution)
      const bestSubject = this.selectBestSubject(
        sortedSubjects,
        subjectHours,
        constraints,
        bestTeacher.subjects
      );
      if (!bestSubject) continue;

      // Create timetable entry
      const entry: Omit<TimetableEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: '', // Will be set by caller
        classId,
        subjectId: bestSubject.id,
        teacherId: bestTeacher.id,
        classroomId: bestClassroom.id,
        timeSlotId: timeSlot.id,
        academicYear,
        term,
        status: 'scheduled',
      };

      // Check for conflicts before adding
      const entryConflicts = this.detectConflicts(entry, entries, teachers, classrooms);
      if (entryConflicts.length === 0) {
        const entryId = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        entries.push({
          ...entry,
          id: entryId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Update tracking
        teacherHours[bestTeacher.id] = (teacherHours[bestTeacher.id] || 0) + 1;
        classroomHours[bestClassroom.id] = (classroomHours[bestClassroom.id] || 0) + 1;
        subjectHours[bestSubject.id] = (subjectHours[bestSubject.id] || 0) + 1;
      } else {
        conflicts.push(...entryConflicts);
      }
    }

    // Calculate utilization statistics
    const utilization = {
      teacherUtilization: this.calculateTeacherUtilization(teacherHours, constraints),
      classroomUtilization: this.calculateClassroomUtilization(classroomHours, timeSlots.length),
      subjectDistribution: subjectHours,
    };

    return {
      success: conflicts.length === 0,
      entries,
      conflicts,
      utilization,
    };
  }

  /**
   * Select best teacher for a time slot
   */
  private static selectBestTeacher(
    availableTeachers: Teacher[],
    timeSlot: TimeSlot,
    teacherHours: Record<string, number>,
    constraints: SchedulingConstraints
  ): Teacher | undefined {
    return availableTeachers.sort((a, b) => {
      // Prefer teachers with fewer hours
      const aHours = teacherHours[a.id] || 0;
      const bHours = teacherHours[b.id] || 0;
      
      if (aHours < bHours) return -1;
      if (aHours > bHours) return 1;

      // Prefer teachers who prefer this time
      const timeOfDay = this.getTimeOfDay(timeSlot.startTime);
      const aPrefersTime = a.preferences.preferredTimes.includes(timeOfDay);
      const bPrefersTime = b.preferences.preferredTimes.includes(timeOfDay);
      
      if (aPrefersTime && !bPrefersTime) return -1;
      if (!aPrefersTime && bPrefersTime) return 1;

      return 0;
    })[0];
  }

  /**
   * Select best classroom for a teacher
   */
  private static selectBestClassroom(
    availableClassrooms: Classroom[],
    teacher: Teacher
  ): Classroom | undefined {
    return availableClassrooms.sort((a, b) => {
      // Prefer larger classrooms
      if (a.capacity > b.capacity) return -1;
      if (a.capacity < b.capacity) return 1;
      
      // Prefer classrooms with more equipment
      if (a.equipment.length > b.equipment.length) return -1;
      if (a.equipment.length < b.equipment.length) return 1;
      
      return 0;
    })[0];
  }

  /**
   * Select best subject based on constraints and distribution
   */
  private static selectBestSubject(
    subjects: Subject[],
    subjectHours: Record<string, number>,
    constraints: SchedulingConstraints,
    teacherSubjects: string[]
  ): Subject | undefined {
    // Filter subjects teacher can teach
    const teachableSubjects = subjects.filter(subject => 
      teacherSubjects.includes(subject.id)
    );

    return teachableSubjects.sort((a, b) => {
      // Prioritize core subjects
      if (a.isCore && !b.isCore) return -1;
      if (!a.isCore && b.isCore) return 1;
      
      // Balance subject distribution
      const aHours = subjectHours[a.id] || 0;
      const bHours = subjectHours[b.id] || 0;
      const aMax = constraints.preferredSubjectDistribution[a.id] || Infinity;
      const bMax = constraints.preferredSubjectDistribution[b.id] || Infinity;
      
      const aRemaining = aMax - aHours;
      const bRemaining = bMax - bHours;
      
      if (aRemaining > bRemaining) return -1;
      if (aRemaining < bRemaining) return 1;
      
      return 0;
    })[0];
  }

  /**
   * Get time of day from time string
   */
  private static getTimeOfDay(time: string): string {
    const hour = parseInt(time.split(':')[0] ?? '0', 10);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  /**
   * Calculate teacher utilization
   */
  private static calculateTeacherUtilization(
    teacherHours: Record<string, number>,
    constraints: SchedulingConstraints
  ): Record<string, number> {
    const utilization: Record<string, number> = {};
    
    Object.entries(teacherHours).forEach(([teacherId, hours]) => {
      const maxHours = constraints.maxHoursPerWeek;
      utilization[teacherId] = Math.round((hours / maxHours) * 100);
    });
    
    return utilization;
  }

  /**
   * Calculate classroom utilization
   */
  private static calculateClassroomUtilization(
    classroomHours: Record<string, number>,
    totalSlots: number
  ): Record<string, number> {
    const utilization: Record<string, number> = {};
    
    Object.entries(classroomHours).forEach(([classroomId, hours]) => {
      utilization[classroomId] = Math.round((hours / totalSlots) * 100);
    });
    
    return utilization;
  }

  /**
   * Optimize existing timetable
   */
  static optimizeTimetable(
    entries: TimetableEntry[],
    constraints: SchedulingConstraints,
    teachers: Teacher[],
    classrooms: Classroom[]
  ): {
    optimized: boolean;
    improvements: string[];
    newEntries: TimetableEntry[];
  } {
    // Simple optimization: try to reduce conflicts and improve utilization
    const improvements: string[] = [];
    let optimized = false;

    // Check for teacher over-utilization
    const teacherUsage = this.calculateTeacherUtilization(
      entries.reduce((hours, entry) => {
        hours[entry.teacherId] = (hours[entry.teacherId] || 0) + 1;
        return hours;
      }, {} as Record<string, number>),
      constraints
    );

    Object.entries(teacherUsage).forEach(([teacherId, utilization]) => {
      if (utilization > 100) {
        improvements.push(`Teacher ${teacherId} is over-utilized (${utilization}%)`);
        optimized = true;
      }
    });

    // Check for underutilized classrooms
    const classroomUsage = this.calculateClassroomUtilization(
      entries.reduce((hours, entry) => {
        hours[entry.classroomId] = (hours[entry.classroomId] || 0) + 1;
        return hours;
      }, {} as Record<string, number>),
      entries.length
    );

    Object.entries(classroomUsage).forEach(([classroomId, utilization]) => {
      if (utilization < 50) {
        improvements.push(`Classroom ${classroomId} is underutilized (${utilization}%)`);
        optimized = true;
      }
    });

    return {
      optimized,
      improvements,
      newEntries: entries,
    };
  }

  /**
   * Generate timetable statistics
   */
  static generateStatistics(
    entries: TimetableEntry[],
    teachers: Teacher[],
    classrooms: Classroom[],
    subjects: Subject[]
  ): {
    totalEntries: number;
    entriesByDay: Record<string, number>;
    entriesBySubject: Record<string, number>;
    entriesByTeacher: Record<string, number>;
    entriesByClassroom: Record<string, number>;
    averageSubjectsPerDay: number;
    peakUsageTime: string;
    utilization: {
      teachers: Record<string, number>;
      classrooms: Record<string, number>;
    };
  } {
    const entriesByDay: Record<string, number> = {};
    const entriesBySubject: Record<string, number> = {};
    const entriesByTeacher: Record<string, number> = {};
    const entriesByClassroom: Record<string, number> = {};

    entries.forEach(entry => {
      const dayIndex = Number.parseInt(entry.timeSlotId.split('-')[1] ?? '', 10) - 1;
      const day = this.DAYS_OF_WEEK[dayIndex] ?? 'Unknown';
      entriesByDay[day] = (entriesByDay[day] || 0) + 1;
      entriesBySubject[entry.subjectId] = (entriesBySubject[entry.subjectId] || 0) + 1;
      entriesByTeacher[entry.teacherId] = (entriesByTeacher[entry.teacherId] || 0) + 1;
      entriesByClassroom[entry.classroomId] = (entriesByClassroom[entry.classroomId] || 0) + 1;
    });

    const totalDays = Object.keys(entriesByDay).length;
    const averageSubjectsPerDay = entries.length / totalDays;

    // Find peak usage time
    const timeSlotCounts: Record<string, number> = {};
    entries.forEach(entry => {
      const timeSlot = entry.timeSlotId.split('-')[2] ?? 'Unknown';
      timeSlotCounts[timeSlot] = (timeSlotCounts[timeSlot] || 0) + 1;
    });

    const peakUsageTime = Object.entries(timeSlotCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([time]) => time)[0] || 'Unknown';

    return {
      totalEntries: entries.length,
      entriesByDay,
      entriesBySubject,
      entriesByTeacher,
      entriesByClassroom,
      averageSubjectsPerDay,
      peakUsageTime,
      utilization: {
        teachers: this.calculateTeacherUtilization(
          Object.fromEntries(
            Object.entries(entriesByTeacher).map(([id, count]) => [id, count])
          ),
          { maxHoursPerWeek: 40 } as SchedulingConstraints
        ),
        classrooms: this.calculateClassroomUtilization(
          Object.fromEntries(
            Object.entries(entriesByClassroom).map(([id, count]) => [id, count])
          ),
          this.TIME_PERIODS.length * 5
        ),
      },
    };
  }
}
