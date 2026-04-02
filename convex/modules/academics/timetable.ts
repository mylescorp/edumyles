import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

// Import timetable engine from shared lib
const { TimetableEngine } = require("../../../shared/src/lib/timetable");

/**
 * Generate automatic timetable for a class
 */
export const generateTimetable = mutation({
  args: {
    classId: v.string(),
    academicYear: v.string(),
    term: v.string(),
    constraints: v.optional(v.object({
      maxSubjectsPerDay: v.number(),
      maxHoursPerDay: v.number(),
      maxHoursPerWeek: v.number(),
      minBreakBetweenClasses: v.number(),
      preferredSubjectDistribution: v.record(v.string(), v.number()),
      avoidConsecutiveSameSubject: v.boolean(),
      ensureCoreSubjectsPriority: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "timetable:write");

    // Get class information
    const classInfo = await ctx.db
      .query("classes")
      .withIndex("by_id", (q) => q.eq("_id", args.classId as any))
      .first();

    if (!classInfo || classInfo.tenantId !== tenant.tenantId) {
      throw new Error("Class not found");
    }

    // Get subjects
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    // Get teachers
    const teachers = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .filter((q) => q.eq("role", "teacher"))
      .collect();

    // Get classrooms
    const classrooms = await ctx.db
      .query("classrooms")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    // Default constraints
    const defaultConstraints = {
      maxSubjectsPerDay: 6,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      minBreakBetweenClasses: 15,
      preferredSubjectDistribution: {},
      avoidConsecutiveSameSubject: true,
      ensureCoreSubjectsPriority: true,
    };

    const constraints = { ...defaultConstraints, ...args.constraints };

    // Generate timetable
    const result = TimetableEngine.generateTimetable(
      args.classId,
      subjects,
      teachers,
      classrooms,
      constraints,
      args.academicYear,
      args.term
    );

    if (!result.success) {
      throw new Error(`Timetable generation failed: ${result.conflicts.map(c => c.message).join(', ')}`);
    }

    // Clear existing timetable for this class/term
    const existingEntries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_class_term", (q) => 
        q.eq("classId", args.classId).eq("term", args.term)
      )
      .collect();

    for (const entry of existingEntries) {
      await ctx.db.delete(entry._id);
    }

    // Save new timetable entries
    const savedEntries = [];
    for (const entry of result.entries) {
      const entryId = await ctx.db.insert("timetableEntries", {
        ...entry,
        tenantId: tenant.tenantId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      savedEntries.push(entryId);
    }

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "timetable.generated",
      entityType: "class",
      entityId: args.classId,
      after: {
        academicYear: args.academicYear,
        term: args.term,
        entriesCount: savedEntries.length,
        conflicts: result.conflicts.length,
      },
    });

    return {
      success: true,
      entriesCount: savedEntries.length,
      conflicts: result.conflicts,
      utilization: result.utilization,
    };
  },
});

/**
 * Add manual timetable entry
 */
export const addTimetableEntry = mutation({
  args: {
    classId: v.string(),
    subjectId: v.string(),
    teacherId: v.string(),
    classroomId: v.string(),
    timeSlotId: v.string(),
    academicYear: v.string(),
    term: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "timetable:write");

    // Get related data for conflict checking
    const [existingEntries, teachers, classrooms] = await Promise.all([
      ctx.db
        .query("timetableEntries")
        .withIndex("by_class_term", (q) => 
          q.eq("classId", args.classId).eq("term", args.term)
        )
        .collect(),
      ctx.db
        .query("users")
        .withIndex("by_id", (q) => q.eq("_id", args.teacherId as any))
        .collect(),
      ctx.db
        .query("classrooms")
        .withIndex("by_id", (q) => q.eq("_id", args.classroomId as any))
        .collect(),
    ]);

    // Create entry for conflict detection
    const entry = {
      tenantId: tenant.tenantId,
      classId: args.classId,
      subjectId: args.subjectId,
      teacherId: args.teacherId,
      classroomId: args.classroomId,
      timeSlotId: args.timeSlotId,
      academicYear: args.academicYear,
      term: args.term,
      status: 'scheduled' as const,
      notes: args.notes,
    };

    // Check for conflicts
    const conflicts = TimetableEngine.detectConflicts(
      entry,
      existingEntries,
      teachers,
      classrooms
    );

    if (conflicts.length > 0) {
      throw new Error(`Scheduling conflicts detected: ${conflicts.map(c => c.message).join(', ')}`);
    }

    const entryId = await ctx.db.insert("timetableEntries", {
      ...entry,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "timetable.entry_added",
      entityType: "timetableEntry",
      entityId: entryId,
      after: {
        ...entry,
      },
    });

    return {
      success: true,
      entryId,
    };
  },
});

/**
 * Update timetable entry
 */
export const updateTimetableEntry = mutation({
  args: {
    entryId: v.id("timetableEntries"),
    updates: v.object({
      subjectId: v.optional(v.string()),
      teacherId: v.optional(v.string()),
      classroomId: v.optional(v.string()),
      timeSlotId: v.optional(v.string()),
      status: v.optional(v.union(v.literal("scheduled"), v.literal("cancelled"), v.literal("rescheduled"))),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "timetable:write");

    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.tenantId !== tenant.tenantId) {
      throw new Error("Timetable entry not found");
    }

    // Get related data for conflict checking if changing time/teacher/classroom
    const [teachers, classrooms] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_id", (q) => q.eq("_id", args.updates.teacherId as any))
        .collect(),
      ctx.db
        .query("classrooms")
        .withIndex("by_id", (q) => q.eq("_id", args.updates.classroomId as any))
        .collect(),
    ]);

    // Check for conflicts if changing critical fields
    if (args.updates.timeSlotId || args.updates.teacherId || args.updates.classroomId) {
      const updatedEntry = { ...entry, ...args.updates };
      delete updatedEntry.id;
      delete updatedEntry.createdAt;
      delete updatedEntry.updatedAt;

      const existingEntries = await ctx.db
        .query("timetableEntries")
        .withIndex("by_class_term", (q) => 
          q.eq("classId", entry.classId).eq("term", entry.term)
        )
        .filter((q) => q.neq("_id", args.entryId))
        .collect();

      const conflicts = TimetableEngine.detectConflicts(
        updatedEntry,
        existingEntries,
        teachers,
        classrooms
      );

      if (conflicts.length > 0) {
        throw new Error(`Update would create conflicts: ${conflicts.map(c => c.message).join(', ')}`);
      }
    }

    await ctx.db.patch(args.entryId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "timetable.entry_updated",
      entityType: "timetableEntry",
      entityId: args.entryId,
      after: {
        updates: args.updates,
      },
    });

    return {
      success: true,
      updatedAt: Date.now(),
    };
  },
});

/**
 * Delete timetable entry
 */
export const deleteTimetableEntry = mutation({
  args: {
    entryId: v.id("timetableEntries"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "timetable:write");

    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.tenantId !== tenant.tenantId) {
      throw new Error("Timetable entry not found");
    }

    await ctx.db.delete(args.entryId);

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "timetable.entry_deleted",
      entityType: "timetableEntry",
      entityId: args.entryId,
      after: {
        reason: args.reason,
      },
    });

    return {
      success: true,
      deletedAt: Date.now(),
    };
  },
});

/**
 * Get timetable for a class
 */
export const getClassTimetable = query({
  args: {
    classId: v.string(),
    academicYear: v.string(),
    term: v.string(),
    status: v.optional(v.union(v.literal("scheduled"), v.literal("cancelled"), v.literal("rescheduled"))),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "timetable:read");

    let entriesQuery = ctx.db
      .query("timetableEntries")
      .withIndex("by_class_term", (q) => 
        q.eq("classId", args.classId).eq("term", args.term)
      )
      .order("asc");

    if (args.status) {
      entriesQuery = entriesQuery.filter((q) => q.eq("status", args.status));
    }

    const entries = await entriesQuery.collect();

    // Enrich with related data
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        const [subject, teacher, classroom] = await Promise.all([
          ctx.db.get(entry.subjectId as any),
          ctx.db.get(entry.teacherId as any),
          ctx.db.get(entry.classroomId as any),
        ]);

        return {
          ...entry,
          subject,
          teacher,
          classroom,
        };
      })
    );

    return enrichedEntries;
  },
});

/**
 * Get teacher's timetable
 */
export const getTeacherTimetable = query({
  args: {
    teacherId: v.string(),
    academicYear: v.string(),
    term: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "timetable:read");

    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_teacher", (q) => 
        q.eq("teacherId", args.teacherId)
          .eq("academicYear", args.academicYear)
          .eq("term", args.term)
      )
      .order("asc")
      .collect();

    // Enrich with related data
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        const [subject, classroom, classInfo] = await Promise.all([
          ctx.db.get(entry.subjectId as any),
          ctx.db.get(entry.classroomId as any),
          ctx.db.get(entry.classId as any),
        ]);

        return {
          ...entry,
          subject,
          classroom,
          class: classInfo,
        };
      })
    );

    return enrichedEntries;
  },
});

/**
 * Get timetable statistics
 */
export const getTimetableStatistics = query({
  args: {
    classId: v.string(),
    academicYear: v.string(),
    term: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "timetable:read");

    const entries = await ctx.db
      .query("timetableEntries")
      .withIndex("by_class_term", (q) => 
        q.eq("classId", args.classId).eq("term", args.term)
      )
      .collect();

    // Get related data for statistics
    const [teachers, classrooms, subjects] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .filter((q) => q.eq("role", "teacher"))
        .collect(),
      ctx.db
        .query("classrooms")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .collect(),
      ctx.db
        .query("subjects")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .collect(),
    ]);

    const statistics = TimetableEngine.generateStatistics(
      entries,
      teachers,
      classrooms,
      subjects
    );

    return {
      classId: args.classId,
      academicYear: args.academicYear,
      term: args.term,
      ...statistics,
    };
  },
});
