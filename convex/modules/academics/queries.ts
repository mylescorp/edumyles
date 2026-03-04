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
