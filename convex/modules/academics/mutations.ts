import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { requireTenantContext } from "../../helpers/tenantGuard";

/**
 * Bulk enter or update grades for students.
 */
export const enterGrades = mutation({
  args: {
    grades: v.array(
      v.object({
        studentId: v.string(),
        classId: v.string(),
        subjectId: v.string(),
        term: v.string(),
        academicYear: v.string(),
        score: v.number(),
        grade: v.string(),
        remarks: v.optional(v.string()),
        recordedBy: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const now = Date.now();
    for (const record of args.grades) {
      // Check if a grade already exists for this student, subject, and term
      const existing = await ctx.db
        .query("grades")
        .withIndex("by_student", (q) =>
          q.eq("studentId", record.studentId).eq("term", record.term)
        )
        .filter((q) =>
          q.eq(q.field("subjectId"), record.subjectId)
        )
        .first();

      if (existing && (existing as any).tenantId === tenant.tenantId) {
        await ctx.db.patch(existing._id, {
          ...record,
          updatedAt: now,
        });
      } else if (!existing) {
        await ctx.db.insert("grades", {
          ...record,
          tenantId: tenant.tenantId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    return { success: true, count: args.grades.length };
  },
});

/**
 * Create a new assignment.
 */
export const createAssignment = mutation({
  args: {
    classId: v.string(),
    subjectId: v.string(),
    title: v.string(),
    description: v.string(),
    dueDate: v.string(),
    maxPoints: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const now = Date.now();
    const assignmentId = await ctx.db.insert("assignments", {
      tenantId: tenant.tenantId,
      classId: args.classId,
      subjectId: args.subjectId,
      teacherId: tenant.userId,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      maxPoints: args.maxPoints,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });

    return assignmentId;
  },
});

/**
 * Grade a student's submission.
 */
export const gradeSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
    grade: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission || (submission as any).tenantId !== tenant.tenantId) {
      throw new Error("Submission not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.submissionId, {
      grade: args.grade,
      feedback: args.feedback,
      status: "graded",
      gradedAt: now,
    });

    return { success: true };
  },
});

/**
 * Bulk mark attendance for a class on a specific date.
 */
export const markAttendance = mutation({
  args: {
    records: v.array(
      v.object({
        classId: v.string(),
        studentId: v.string(),
        date: v.string(),
        status: v.string(),
        remarks: v.optional(v.string()),
        recordedBy: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "attendance:write");

    const now = Date.now();
    for (const record of args.records) {
      const existing = await ctx.db
        .query("attendance")
        .withIndex("by_student_date", (q) =>
          q.eq("studentId", record.studentId).eq("date", record.date)
        )
        .first();

      if (existing && (existing as any).tenantId === tenant.tenantId) {
        await ctx.db.patch(existing._id, {
          ...record,
        });
      } else if (!existing) {
        await ctx.db.insert("attendance", {
          ...record,
          tenantId: tenant.tenantId,
          createdAt: now,
        });
      }
    }
    return { success: true, count: args.records.length };
  },
});

/**
 * Placeholder for report card generation logic.
 */
export const generateReportCard = mutation({
  args: {
    studentId: v.string(),
    term: v.string(),
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const now = Date.now();
    const reportCardId = await ctx.db.insert("reportCards", {
      tenantId: tenant.tenantId,
      studentId: args.studentId,
      term: args.term,
      academicYear: args.academicYear,
      status: "generating",
      generatedAt: now,
      createdAt: now,
    });

    return reportCardId;
  },
});
