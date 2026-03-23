import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";

/**
 * Get all classes assigned to the currently authenticated teacher.
 */
export const getTeacherClasses = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "students:read");

    return await ctx.db
      .query("classes")
      .withIndex("by_tenant_teacher", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("teacherId", tenant.userId)
      )
      .collect();
  },
});

/**
 * Get all students in a specific class (scoped to tenant).
 */
export const getClassStudents = query({
  args: {
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "sis");
    requirePermission(tenant, "students:read");

    return await ctx.db
      .query("students")
      .withIndex("by_tenant_class", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("classId", args.classId)
      )
      .collect();
  },
});

/**
 * Get grade records for a class, subject, and term.
 */
export const getGrades = query({
  args: {
    classId: v.string(),
    subjectId: v.string(),
    term: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    return await ctx.db
      .query("grades")
      .withIndex("by_class_subject", (q) =>
        q
          .eq("classId", args.classId)
          .eq("subjectId", args.subjectId)
          .eq("term", args.term)
      )
      .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

/**
 * Get assignments for a specific class.
 */
export const getAssignments = query({
  args: {
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");

    return await ctx.db
      .query("assignments")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

/**
 * Get a specific assignment by ID.
 */
export const getAssignment = query({
  args: {
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");

    const assignment = await ctx.db.get(args.assignmentId);
    
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      return null;
    }

    return assignment;
  },
});

/**
 * Get all submissions for a specific assignment.
 */
export const getSubmissions = query({
  args: {
    assignmentId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");

    return await ctx.db
      .query("submissions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId)
      )
      .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

/**
 * Get attendance records for a class on a specific date.
 */
export const getAttendance = query({
  args: {
    classId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "attendance:read");

    return await ctx.db
      .query("attendance")
      .withIndex("by_class_date", (q) =>
        q.eq("classId", args.classId).eq("date", args.date)
      )
      .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
      .collect();
  },
});

/**
 * Get academics dashboard statistics.
 */
export const getAcademicsStats = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "students:read");

    const [classes, subjects, teachers, grades] = await Promise.all([
      ctx.db
        .query("classes")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .collect(),
      ctx.db
        .query("subjects")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
        .collect(),
      ctx.db
        .query("staff")
        .withIndex("by_tenant_role", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("role", "teacher")
        )
        .collect(),
      ctx.db
        .query("grades")
        .withIndex("by_class_subject", (q) => q.eq("classId", "dummy")) // We'll need to filter differently
        .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
        .collect(),
    ]);

    // Calculate average performance
    const avgPerformance = grades.length > 0
      ? Math.round(
          grades.reduce((sum, grade) => sum + (grade.score || 0), 0) / grades.length
        )
      : 0;

    return {
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      activeTeachers: teachers.length,
      avgPerformance,
    };
  },
});

/**
 * Get recent examinations for the dashboard.
 */
export const getRecentExams = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    const limit = args.limit || 10;

    const exams = await ctx.db
      .query("examinations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .order("desc")
      .take(limit);

    return exams.map((e) => ({
      _id: e._id,
      name: e.name,
      className: e.className ?? "N/A",
      date: e.date,
      status: e.status,
      submissions: 0,
      total: 0,
      tenantId: e.tenantId,
      createdAt: e.createdAt,
    }));
  },
});

/**
 * Get upcoming academic events.
 */
export const getUpcomingEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "students:read");

    const limit = args.limit || 10;

    const today = new Date().toISOString().split("T")[0] ?? "";
    const events = await ctx.db
      .query("schoolEvents")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .order("asc")
      .collect();

    return events
      .filter((e) => e.startDate >= today)
      .slice(0, limit)
      .map((e) => ({
        _id: e._id,
        title: e.title,
        date: e.startDate,
        time: e.startTime ?? "All Day",
        type: e.eventType,
        tenantId: e.tenantId,
        createdAt: e.createdAt,
      }));
  },
});
