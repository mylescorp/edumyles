import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

// Conflict types
export type ConflictType = 
  | "teacher_double_booking"
  | "room_double_booking"
  | "class_double_booking"
  | "student_overload"
  | "invalid_time_slot";

export interface TimetableConflict {
  type: ConflictType;
  severity: "error" | "warning";
  message: string;
  conflictingSlots: string[];
  suggestedResolution: string;
}

export interface TimetableSlot {
  _id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  academicYear: string;
  term: string;
}

// Helper function to convert time string to minutes
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + (minutes || 0);
}

// Helper function to check time overlap
function hasTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  
  return s1 < e2 && s2 < e1 && (s1 < e2 ? s1 < s2 : s1 < e2);
}

// Check for teacher conflicts
export const detectTeacherConflicts = query({
  args: {
    teacherId: v.string(),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    excludeSlotId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:read");

    const existingSlots = await ctx.db
      .query("timetables")
      .withIndex("by_teacher_day", (q) =>
        q.eq("teacherId", args.teacherId).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();

    const conflicts: TimetableConflict[] = [];

    for (const slot of existingSlots) {
      if (args.excludeSlotId && slot._id === args.excludeSlotId) {
        continue;
      }

      if (hasTimeOverlap(slot.startTime, slot.endTime, args.startTime, args.endTime)) {
        conflicts.push({
          type: "teacher_double_booking",
          severity: "error",
          message: `Teacher is already scheduled during this time`,
          conflictingSlots: [slot._id],
          suggestedResolution: "Choose a different time slot or reassign the teacher",
        });
      }
    }

    return conflicts;
  },
});

// Check for room conflicts
export const detectRoomConflicts = query({
  args: {
    roomId: v.string(),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    excludeSlotId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:read");

    const existingSlots = await ctx.db
      .query("timetables")
      .withIndex("by_room_day", (q) =>
        q.eq("roomId", args.roomId).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();

    const conflicts: TimetableConflict[] = [];

    for (const slot of existingSlots) {
      if (args.excludeSlotId && slot._id === args.excludeSlotId) {
        continue;
      }

      if (hasTimeOverlap(slot.startTime, slot.endTime, args.startTime, args.endTime)) {
        conflicts.push({
          type: "room_double_booking",
          severity: "error",
          message: `Room is already occupied during this time`,
          conflictingSlots: [slot._id],
          suggestedResolution: "Choose a different room or time slot",
        });
      }
    }

    return conflicts;
  },
});

// Check for class conflicts (students in multiple places at same time)
export const detectClassConflicts = query({
  args: {
    classId: v.string(),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    excludeSlotId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:read");

    const existingSlots = await ctx.db
      .query("timetables")
      .withIndex("by_class_day", (q) =>
        q.eq("classId", args.classId).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();

    const conflicts: TimetableConflict[] = [];

    for (const slot of existingSlots) {
      if (args.excludeSlotId && slot._id === args.excludeSlotId) {
        continue;
      }

      if (hasTimeOverlap(slot.startTime, slot.endTime, args.startTime, args.endTime)) {
        conflicts.push({
          type: "class_double_booking",
          severity: "warning",
          message: `Class may have conflicting subjects during this time`,
          conflictingSlots: [slot._id],
          suggestedResolution: "Verify this is intentional (e.g., split class for different subjects)",
        });
      }
    }

    return conflicts;
  },
});

// Comprehensive conflict detection for a new slot
export const detectAllConflicts = query({
  args: {
    classId: v.string(),
    subjectId: v.string(),
    teacherId: v.string(),
    roomId: v.optional(v.string()),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    academicYear: v.string(),
    term: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:read");

    const allConflicts: TimetableConflict[] = [];

    // Check teacher availability
    const teacherConflicts = await ctx.runQuery(
      (ctx as any).internal.modules.timetable.conflicts.detectTeacherConflicts,
      {
        teacherId: args.teacherId,
        dayOfWeek: args.dayOfWeek,
        startTime: args.startTime,
        endTime: args.endTime,
      }
    );

    allConflicts.push(...teacherConflicts);

    // Check room availability if room is specified
    if (args.roomId) {
      const roomConflicts = await ctx.runQuery(
        (ctx as any).internal.modules.timetable.conflicts.detectRoomConflicts,
        {
          roomId: args.roomId,
          dayOfWeek: args.dayOfWeek,
          startTime: args.startTime,
          endTime: args.endTime,
        }
      );

      allConflicts.push(...roomConflicts);
    }

    // Check class scheduling
    const classConflicts = await ctx.runQuery(
      (ctx as any).internal.modules.timetable.conflicts.detectClassConflicts,
      {
        classId: args.classId,
        dayOfWeek: args.dayOfWeek,
        startTime: args.startTime,
        endTime: args.endTime,
      }
    );

    allConflicts.push(...classConflicts);

    // Validate time format and logic
    const startMinutes = timeToMinutes(args.startTime);
    const endMinutes = timeToMinutes(args.endTime);

    if (startMinutes >= endMinutes) {
      allConflicts.push({
        type: "invalid_time_slot",
        severity: "error",
        message: "End time must be after start time",
        conflictingSlots: [],
        suggestedResolution: "Choose a valid time range",
      });
    }

    // Check for reasonable time slots (e.g., not too early/late)
    if (startMinutes < 420 || endMinutes > 1320) { // Before 7:00 AM or after 10:00 PM
      allConflicts.push({
        type: "invalid_time_slot",
        severity: "warning",
        message: "Time slot is outside normal school hours",
        conflictingSlots: [],
        suggestedResolution: "Consider scheduling within school hours (7:00 AM - 10:00 PM)",
      });
    }

    return allConflicts;
  },
});

// Suggest optimal time slots
export const suggestAvailableSlots = query({
  args: {
    teacherId: v.string(),
    roomId: v.optional(v.string()),
    dayOfWeek: v.number(),
    duration: v.number(), // in minutes
    preferredTime: v.optional(v.string()), // preferred start time
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:read");

    // Get all existing slots for the day
    const existingSlots = await ctx.db
      .query("timetables")
      .withIndex("by_teacher_day", (q) =>
        q.eq("teacherId", args.teacherId).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();

    // Convert to minutes for easier calculation
    const occupiedRanges = existingSlots.map(slot => ({
      start: timeToMinutes(slot.startTime),
      end: timeToMinutes(slot.endTime),
    }));

    // Sort by start time
    occupiedRanges.sort((a, b) => a.start - b.start);

    // Find available slots
    const availableSlots: { start: number; end: number }[] = [];
    const schoolStart = 420; // 7:00 AM
    const schoolEnd = 1320; // 10:00 PM

    let currentTime = schoolStart;
    
    for (const occupied of occupiedRanges) {
      if (currentTime < occupied.start) {
        availableSlots.push({
          start: currentTime,
          end: occupied.start,
        });
      }
      currentTime = Math.max(currentTime, occupied.end);
    }

    if (currentTime < schoolEnd) {
      availableSlots.push({
        start: currentTime,
        end: schoolEnd,
      });
    }

    // Filter slots that can accommodate the requested duration
    const suitableSlots = availableSlots.filter(slot => 
      (slot.end - slot.start) >= args.duration
    );

    // Convert back to time strings
    return suitableSlots.map(slot => ({
      startTime: `${Math.floor(slot.start / 60).toString().padStart(2, '0')}:${(slot.start % 60).toString().padStart(2, '0')}`,
      endTime: `${Math.floor(slot.end / 60).toString().padStart(2, '0')}:${(slot.end % 60).toString().padStart(2, '0')}`,
    }));
  },
});

// Validate and fix timetable conflicts
export const validateAndFixTimetable = mutation({
  args: {
    academicYear: v.string(),
    term: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:write");

    // Get all timetable slots for the term
    const allSlots = await ctx.db
      .query("timetables")
      .withIndex("by_term", (q) =>
        q.eq("academicYear", args.academicYear).eq("term", args.term)
      )
      .collect();

    const allConflicts: TimetableConflict[] = [];
    const fixedSlots: string[] = [];

    // Check each slot for conflicts
    for (const slot of allSlots) {
      const conflicts = await ctx.runQuery(
        (ctx as any).internal.modules.timetable.conflicts.detectAllConflicts,
        {
          classId: slot.classId,
          subjectId: slot.subjectId,
          teacherId: slot.teacherId,
          roomId: slot.roomId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          academicYear: args.academicYear,
          term: args.term,
        }
      );

      if (conflicts.length > 0) {
        allConflicts.push(...conflicts);
        
        // Auto-fix simple conflicts by suggesting alternative times
        if (conflicts.every(c => c.severity === "warning")) {
          // This is a warning, not an error - log it but don't auto-fix
          continue;
        }
      }
    }

    return {
      totalSlots: allSlots.length,
      conflictsFound: allConflicts.length,
      conflicts: allConflicts,
      fixedSlots: fixedSlots.length,
      recommendations: generateFixRecommendations(allConflicts),
    };
  },
});

function generateFixRecommendations(conflicts: TimetableConflict[]): string[] {
  const recommendations: string[] = [];
  
  const teacherConflicts = conflicts.filter(c => c.type === "teacher_double_booking");
  const roomConflicts = conflicts.filter(c => c.type === "room_double_booking");
  const classConflicts = conflicts.filter(c => c.type === "class_double_booking");

  if (teacherConflicts.length > 0) {
    recommendations.push("Consider reassigning some classes to available teachers");
  }

  if (roomConflicts.length > 0) {
    recommendations.push("Utilize alternative classrooms or stagger break times");
  }

  if (classConflicts.length > 0) {
    recommendations.push("Review class scheduling to avoid subject conflicts");
  }

  return recommendations;
}
