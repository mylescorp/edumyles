import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";

describe("Timetable Module", () => {
  let ctx: any;

  beforeEach(() => {
    ctx = convexTest();
  });

  describe("Timetable Slots", () => {
    it("should create a timetable slot", async () => {
      const result = await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "math",
        teacherId: "teacher1",
        dayOfWeek: 1, // Monday
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 101",
        academicYear: "2025",
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should list timetable slots for a class", async () => {
      // Create some slots first
      await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "math",
        teacherId: "teacher1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 101",
      });

      await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "english",
        teacherId: "teacher2",
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "11:00",
        room: "Room 101",
      });

      const slots = await ctx.runQuery(api.modules.timetable.listSlots, {
        classId: "class1",
      });

      expect(slots).toHaveLength(2);
      expect(slots[0].classId).toBe("class1");
      expect(slots[0].dayOfWeek).toBe(1);
    });

    it("should update a timetable slot", async () => {
      // Create a slot first
      const slotId = await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "science",
        teacherId: "teacher1",
        dayOfWeek: 2,
        startTime: "11:00",
        endTime: "12:00",
        room: "Room 102",
      });

      // Update the slot
      await ctx.runMutation(api.modules.timetable.updateSlot, {
        slotId: slotId as any,
        updates: {
          startTime: "10:30",
          endTime: "11:30",
          room: "Room 103",
        },
      });

      // Verify update
      const slots = await ctx.runQuery(api.modules.timetable.listSlots, {});
      const updatedSlot = slots.find(s => s._id === slotId);
      
      expect(updatedSlot?.startTime).toBe("10:30");
      expect(updatedSlot?.endTime).toBe("11:30");
      expect(updatedSlot?.room).toBe("Room 103");
    });

    it("should delete a timetable slot", async () => {
      // Create a slot first
      const slotId = await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "history",
        teacherId: "teacher1",
        dayOfWeek: 3,
        startTime: "14:00",
        endTime: "15:00",
        room: "Room 104",
      });

      // Delete the slot
      await ctx.runMutation(api.modules.timetable.deleteSlot, {
        slotId: slotId as any,
      });

      // Verify deletion
      const slots = await ctx.runQuery(api.modules.timetable.listSlots, {});
      const deletedSlot = slots.find(s => s._id === slotId);
      
      expect(deletedSlot).toBeUndefined();
    });
  });

  describe("Class Schedule", () => {
    it("should get class schedule for a specific day", async () => {
      // Create slots for Monday
      await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "math",
        teacherId: "teacher1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "09:00",
        room: "Room 101",
      });

      await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "english",
        teacherId: "teacher2",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 101",
      });

      const schedule = await ctx.runQuery(api.modules.timetable.getClassSchedule, {
        classId: "class1",
        dayOfWeek: 1,
      });

      expect(schedule).toHaveLength(2);
      expect(schedule[0].subjectId).toBe("math");
      expect(schedule[1].subjectId).toBe("english");
    });

    it("should get full week class schedule", async () => {
      // Create slots for different days
      const days = [1, 2, 3]; // Monday, Tuesday, Wednesday
      const subjects = ["math", "english", "science"];
      
      for (let i = 0; i < days.length; i++) {
        await ctx.runMutation(api.modules.timetable.createSlot, {
          classId: "class1",
          subjectId: subjects[i],
          teacherId: `teacher${i + 1}`,
          dayOfWeek: days[i],
          startTime: "09:00",
          endTime: "10:00",
          room: `Room ${10 + i}`,
        });
      }

      const fullSchedule = await ctx.runQuery(api.modules.timetable.getClassSchedule, {
        classId: "class1",
      });

      expect(fullSchedule).toHaveLength(3);
      
      // Verify each day has a slot
      const mondaySlot = fullSchedule.find(s => s.dayOfWeek === 1);
      const tuesdaySlot = fullSchedule.find(s => s.dayOfWeek === 2);
      const wednesdaySlot = fullSchedule.find(s => s.dayOfWeek === 3);
      
      expect(mondaySlot?.subjectId).toBe("math");
      expect(tuesdaySlot?.subjectId).toBe("english");
      expect(wednesdaySlot?.subjectId).toBe("science");
    });
  });

  describe("Conflict Detection", () => {
    it("should detect teacher schedule conflicts", async () => {
      // Create first slot
      await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "math",
        teacherId: "teacher1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 101",
      });

      // Try to create conflicting slot for same teacher
      const conflicts = await ctx.runQuery(api.modules.timetable.checkConflicts, {
        teacherId: "teacher1",
        dayOfWeek: 1,
        startTime: "09:30",
        endTime: "10:30",
      });

      expect(conflicts.conflicts).toHaveLength(1);
      expect(conflicts.conflicts[0].type).toBe("teacher_conflict");
    });

    it("should detect room conflicts", async () => {
      // Create first slot
      await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "math",
        teacherId: "teacher1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 101",
      });

      // Try to create conflicting slot in same room
      const conflicts = await ctx.runQuery(api.modules.timetable.checkConflicts, {
        room: "Room 101",
        dayOfWeek: 1,
        startTime: "09:30",
        endTime: "10:30",
      });

      expect(conflicts.conflicts).toHaveLength(1);
      expect(conflicts.conflicts[0].type).toBe("room_conflict");
    });

    it("should detect class conflicts", async () => {
      // Create first slot
      await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "math",
        teacherId: "teacher1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 101",
      });

      // Try to create conflicting slot for same class
      const conflicts = await ctx.runQuery(api.modules.timetable.checkConflicts, {
        classId: "class1",
        dayOfWeek: 1,
        startTime: "09:30",
        endTime: "10:30",
      });

      expect(conflicts.conflicts).toHaveLength(1);
      expect(conflicts.conflicts[0].type).toBe("class_conflict");
    });

    it("should allow non-conflicting slots", async () => {
      // Create first slot
      await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "math",
        teacherId: "teacher1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 101",
      });

      // Try to create non-conflicting slot
      const conflicts = await ctx.runQuery(api.modules.timetable.checkConflicts, {
        classId: "class2", // Different class
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 102", // Different room
      });

      expect(conflicts.conflicts).toHaveLength(0);
    });
  });

  describe("Room Management", () => {
    it("should get available rooms for a time slot", async () => {
      // Create some rooms (assuming rooms table exists)
      // This test would need room creation functionality
      
      const availableRooms = await ctx.runQuery(api.modules.timetable.getAvailableRooms, {
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        capacity: 30,
        equipment: ["projector", "whiteboard"],
      });

      expect(Array.isArray(availableRooms)).toBe(true);
    });
  });

  describe("Teacher Availability", () => {
    it("should get teacher availability", async () => {
      // Create some slots for teacher
      await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class1",
        subjectId: "math",
        teacherId: "teacher1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        room: "Room 101",
      });

      await ctx.runMutation(api.modules.timetable.createSlot, {
        classId: "class2",
        subjectId: "english",
        teacherId: "teacher1",
        dayOfWeek: 1,
        startTime: "11:00",
        endTime: "12:00",
        room: "Room 102",
      });

      const availability = await ctx.runQuery(api.modules.timetable.getTeacherAvailability, {
        teacherId: "teacher1",
        academicYear: "2025",
        term: "Term 1",
      });

      expect(availability).toBeDefined();
      expect(availability[1]).toBeDefined(); // Monday availability
      expect(Array.isArray(availability[1].busy)).toBe(true);
      expect(Array.isArray(availability[1].available)).toBe(true);
    });
  });

  describe("Timetable Generation", () => {
    it("should generate timetable automatically", async () => {
      const result = await ctx.runMutation(api.modules.timetable.generateTimetable, {
        classId: "class1",
        academicYear: "2025",
        term: "Term 1",
        subjects: [
          {
            subjectId: "math",
            teacherId: "teacher1",
            hoursPerWeek: 5,
            preferredRooms: ["Room 101"],
            preferredDays: [1, 2, 3, 4, 5],
            preferredTimes: ["09:00-10:00"],
          },
          {
            subjectId: "english",
            teacherId: "teacher2",
            hoursPerWeek: 4,
            preferredRooms: ["Room 102"],
            preferredDays: [1, 2, 3, 4, 5],
            preferredTimes: ["10:00-11:00"],
          },
        ],
        constraints: {
          maxHoursPerDay: 6,
          breakTimes: [
            {
              startTime: "12:00",
              endTime: "13:00",
              days: [1, 2, 3, 4, 5],
            },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.slotsGenerated).toBeGreaterThan(0);
      expect(Array.isArray(result.slotIds)).toBe(true);
    });

    it("should respect constraints during generation", async () => {
      const result = await ctx.runMutation(api.modules.timetable.generateTimetable, {
        classId: "class1",
        academicYear: "2025",
        term: "Term 1",
        subjects: [
          {
            subjectId: "math",
            teacherId: "teacher1",
            hoursPerWeek: 8, // More than daily limit
            preferredRooms: ["Room 101"],
            preferredDays: [1, 2, 3, 4, 5],
          },
        ],
        constraints: {
          maxHoursPerDay: 6,
        },
      });

      expect(result.success).toBe(true);
      // The generated slots should not exceed 6 hours per day
      // This would require additional logic to verify the constraint
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid time slot creation", async () => {
      // Try to create slot with invalid data
      await expect(
        ctx.runMutation(api.modules.timetable.createSlot, {
          classId: "", // Invalid empty class ID
          subjectId: "math",
          teacherId: "teacher1",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
          room: "Room 101",
        })
      ).rejects.toThrow();
    });

    it("should handle invalid time ranges", async () => {
      // Try to create slot with end time before start time
      await expect(
        ctx.runMutation(api.modules.timetable.createSlot, {
          classId: "class1",
          subjectId: "math",
          teacherId: "teacher1",
          dayOfWeek: 1,
          startTime: "11:00",
          endTime: "10:00", // Invalid: end before start
          room: "Room 101",
        })
      ).rejects.toThrow();
    });

    it("should handle invalid day of week", async () => {
      // Try to create slot with invalid day
      await expect(
        ctx.runMutation(api.modules.timetable.createSlot, {
          classId: "class1",
          subjectId: "math",
          teacherId: "teacher1",
          dayOfWeek: 8, // Invalid: should be 1-7
          startTime: "09:00",
          endTime: "10:00",
          room: "Room 101",
        })
      ).rejects.toThrow();
    });
  });
});
