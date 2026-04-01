import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

// Timetable scheduling algorithm and conflict detection
export const generateTimetable = mutation({
  args: {
    classId: v.string(),
    academicYear: v.string(),
    term: v.string(),
    subjects: v.array(v.object({
      subjectId: v.string(),
      teacherId: v.string(),
      hoursPerWeek: v.number(),
      preferredRooms: v.optional(v.array(v.string())),
      preferredDays: v.optional(v.array(v.number())), // 1-7 (Mon-Sun)
      preferredTimes: v.optional(v.array(v.string())), // "09:00-10:00"
    })),
    constraints: v.optional(v.object({
      maxHoursPerDay: v.optional(v.number()),
      breakTimes: v.optional(v.array(v.object({
        startTime: v.string(),
        endTime: v.string(),
        days: v.array(v.number()),
      }))),
      roomConstraints: v.optional(v.array(v.object({
        roomId: v.string(),
        capacity: v.number(),
        equipment: v.optional(v.array(v.string())),
        availableTimes: v.array(v.object({
          day: v.number(),
          startTime: v.string(),
          endTime: v.string(),
        })),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:write");

    // Get existing slots to avoid conflicts
    const existingSlots = await ctx.db
      .query("timetables")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("academicYear"), args.academicYear))
      .collect();

    // Clear existing timetable for regeneration
    for (const slot of existingSlots) {
      await ctx.db.delete(slot._id);
    }

    // Generate timetable using simple algorithm
    const generatedSlots = await generateTimetableSlots(args, tenant.tenantId);

    // Insert generated slots
    const slotIds = [];
    for (const slot of generatedSlots) {
      const slotId = await ctx.db.insert("timetables", {
        tenantId: tenant.tenantId,
        ...slot,
        createdAt: Date.now(),
      });
      slotIds.push(slotId);
    }

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "timetable.generated" as any,
      entityType: "timetables",
      entityId: slotIds[0], // Log first slot ID as reference
      after: {
        classId: args.classId,
        slotsGenerated: slotIds.length,
        academicYear: args.academicYear,
      },
    });

    return {
      success: true,
      slotsGenerated: slotIds.length,
      slotIds,
    };
  },
});

// Check for conflicts in timetable
export const checkConflicts = query({
  args: {
    classId: v.optional(v.string()),
    teacherId: v.optional(v.string()),
    room: v.optional(v.string()),
    dayOfWeek: v.optional(v.number()),
    startTime: v.string(),
    endTime: v.string(),
    excludeSlotId: v.optional(v.id("timetables")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:read");

    const conflicts = [];

    // Check class conflicts
    if (args.classId) {
      const classSlots = await ctx.db
        .query("timetables")
        .withIndex("by_class", (q) => q.eq("classId", args.classId))
        .collect();

      for (const slot of classSlots) {
        if (args.excludeSlotId && slot._id === args.excludeSlotId) continue;
        if (slot.dayOfWeek === args.dayOfWeek && 
            isTimeOverlap(slot.startTime, slot.endTime, args.startTime, args.endTime)) {
          conflicts.push({
            type: "class_conflict",
            slotId: slot._id,
            message: `Class ${args.classId} has conflicting schedule`,
          });
        }
      }
    }

    // Check teacher conflicts
    if (args.teacherId) {
      const teacherSlots = await ctx.db
        .query("timetables")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
        .collect();

      for (const slot of teacherSlots) {
        if (args.excludeSlotId && slot._id === args.excludeSlotId) continue;
        if (slot.dayOfWeek === args.dayOfWeek && 
            isTimeOverlap(slot.startTime, slot.endTime, args.startTime, args.endTime)) {
          conflicts.push({
            type: "teacher_conflict",
            slotId: slot._id,
            message: `Teacher has conflicting schedule`,
          });
        }
      }
    }

    // Check room conflicts
    if (args.room) {
      const roomSlots = await ctx.db
        .query("timetables")
        .withIndex("by_room", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("room", args.room).eq("dayOfWeek", args.dayOfWeek)
        )
        .collect();

      for (const slot of roomSlots) {
        if (args.excludeSlotId && slot._id === args.excludeSlotId) continue;
        if (isTimeOverlap(slot.startTime, slot.endTime, args.startTime, args.endTime)) {
          conflicts.push({
            type: "room_conflict",
            slotId: slot._id,
            message: `Room ${args.room} is already booked`,
          });
        }
      }
    }

    return { conflicts };
  },
});

// Get available rooms for a time slot
export const getAvailableRooms = query({
  args: {
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    capacity: v.optional(v.number()),
    equipment: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:read");

    // Get all rooms (assuming rooms table exists)
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const availableRooms = [];

    for (const room of rooms) {
      // Check capacity requirement
      if (args.capacity && (room as any).capacity < args.capacity) {
        continue;
      }

      // Check equipment requirements
      if (args.equipment && args.equipment.length > 0) {
        const roomEquipment = (room as any).equipment || [];
        const hasAllEquipment = args.equipment.every(eq => roomEquipment.includes(eq));
        if (!hasAllEquipment) continue;
      }

      // Check if room is available at requested time
      const existingBookings = await ctx.db
        .query("timetables")
        .withIndex("by_room", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("room", room._id).eq("dayOfWeek", args.dayOfWeek)
        )
        .collect();

      const hasConflict = existingBookings.some(booking =>
        isTimeOverlap(booking.startTime, booking.endTime, args.startTime, args.endTime)
      );

      if (!hasConflict) {
        availableRooms.push(room);
      }
    }

    return availableRooms;
  },
});

// Get teacher availability
export const getTeacherAvailability = query({
  args: {
    teacherId: v.string(),
    academicYear: v.string(),
    term: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "timetable");
    requirePermission(tenant, "timetable:read");

    // Get teacher's current schedule
    const teacherSlots = await ctx.db
      .query("timetables")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .filter((q) => q.eq(q.field("academicYear"), args.academicYear))
      .collect();

    // Group by day of week
    const scheduleByDay = {};
    for (const slot of teacherSlots) {
      if (!scheduleByDay[slot.dayOfWeek]) {
        scheduleByDay[slot.dayOfWeek] = [];
      }
      scheduleByDay[slot.dayOfWeek].push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subjectId,
        class: slot.classId,
        room: slot.room,
      });
    }

    // Generate availability for each day (1-7 = Monday-Sunday)
    const availability = {};
    for (let day = 1; day <= 7; day++) {
      const daySchedule = scheduleByDay[day] || [];
      const busySlots = daySchedule.map(slot => ({
        start: timeToMinutes(slot.startTime),
        end: timeToMinutes(slot.endTime),
      }));

      // Generate available slots in 30-minute increments from 08:00 to 17:00
      const availableSlots = [];
      let currentTime = 8 * 60; // 08:00 in minutes
      const endTime = 17 * 60; // 17:00 in minutes

      while (currentTime < endTime) {
        const slotEnd = Math.min(currentTime + 30, endTime);
        const isBusy = busySlots.some(busy =>
          currentTime < busy.end && slotEnd > busy.start
        );

        if (!isBusy) {
          availableSlots.push({
            startTime: minutesToTime(currentTime),
            endTime: minutesToTime(slotEnd),
          });
        }

        currentTime = slotEnd;
      }

      availability[day] = {
        dayName: getDayName(day),
        busy: daySchedule,
        available: availableSlots,
      };
    }

    return availability;
  },
});

// Helper functions
function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function getDayName(day: number): string {
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[day] || 'Unknown';
}

// Simple timetable generation algorithm
async function generateTimetableSlots(args: any, tenantId: string): Promise<any[]> {
  const slots = [];
  const { subjects, constraints } = args;
  
  // Simple round-robin assignment
  const days = [1, 2, 3, 4, 5]; // Monday to Friday
  const timeSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:30', end: '11:30' },
    { start: '11:30', end: '12:30' },
    { start: '13:30', end: '14:30' },
    { start: '14:30', end: '15:30' },
    { start: '15:30', end: '16:30' },
  ];

  let subjectIndex = 0;
  let dayIndex = 0;
  let timeIndex = 0;

  // Assign subjects to slots
  for (const subject of subjects) {
    let hoursAssigned = 0;
    
    while (hoursAssigned < subject.hoursPerWeek) {
      const day = days[dayIndex % days.length];
      const timeSlot = timeSlots[timeIndex % timeSlots.length];
      
      slots.push({
        classId: args.classId,
        subjectId: subject.subjectId,
        teacherId: subject.teacherId,
        dayOfWeek: day,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        room: subject.preferredRooms?.[0] || `Room-${Math.floor(Math.random() * 100)}`,
        academicYear: args.academicYear,
      });

      hoursAssigned++;
      timeIndex++;
      
      // Move to next day after a full day's schedule
      if (timeIndex >= timeSlots.length) {
        timeIndex = 0;
        dayIndex++;
      }
    }
    
    subjectIndex++;
  }

  return slots;
}
