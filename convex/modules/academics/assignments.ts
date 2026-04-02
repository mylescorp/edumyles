import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

// Assignment types
export type AssignmentType = "homework" | "classwork" | "project" | "exam" | "quiz";
export type AssignmentStatus = "draft" | "published" | "closed" | "graded";
export type SubmissionStatus = "not_submitted" | "submitted" | "late" | "graded";
export type GradingScale = "points" | "percentage" | "letter" | "competency";

// Assignment queries
export const listAssignments = query({
  args: {
    classId: v.optional(v.string()),
    subjectId: v.optional(v.string()),
    teacherId: v.optional(v.string()),
    status: v.optional(v.string()),
    dueDateFrom: v.optional(v.number()),
    dueDateTo: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    let assignmentsQuery = ctx.db
      .query("assignments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

    // Apply filters
    if (args.classId) {
      assignmentsQuery = ctx.db
        .query("assignments")
        .withIndex("by_tenant_class", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("classId", args.classId)
        );
    }

    if (args.subjectId) {
      assignmentsQuery = assignmentsQuery.filter((q) =>
        q.eq(q.field("subjectId"), args.subjectId)
      );
    }

    if (args.teacherId) {
      assignmentsQuery = assignmentsQuery.filter((q) =>
        q.eq(q.field("teacherId"), args.teacherId)
      );
    }

    if (args.status) {
      assignmentsQuery = assignmentsQuery.filter((q) =>
        q.eq(q.field("status"), args.status)
      );
    }

    if (args.dueDateFrom) {
      assignmentsQuery = assignmentsQuery.filter((q) =>
        q.gte(q.field("dueDate"), args.dueDateFrom)
      );
    }

    if (args.dueDateTo) {
      assignmentsQuery = assignmentsQuery.filter((q) =>
        q.lte(q.field("dueDate"), args.dueDateTo)
      );
    }

    const assignments = await assignmentsQuery
      .order("desc")
      .take(args.limit ?? 25)
      .skip(args.offset ?? 0)
      .collect();

    // Enrich with related data
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const subject = await ctx.db.get(assignment.subjectId as any);
        const teacher = await ctx.db.get(assignment.teacherId as any);
        const classData = await ctx.db.get(assignment.classId as any);
        
        // Count submissions
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
          .collect();

        return {
          ...assignment,
          subject: subject?.name,
          teacher: `${teacher?.firstName} ${teacher?.lastName}`,
          className: classData?.name,
          submissionCount: submissions.length,
          pendingSubmissions: submissions.filter(s => s.status === "not_submitted").length,
        };
      })
    );

    return enrichedAssignments;
  },
});

export const getAssignment = query({
  args: {
    assignmentId: v.id("assignments"),
    includeSubmissions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      return null;
    }

    let result = { ...assignment };

    if (args.includeSubmissions) {
      const submissions = await ctx.db
        .query("submissions")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
        .collect();

      const enrichedSubmissions = await Promise.all(
        submissions.map(async (submission) => {
          const student = await ctx.db.get(submission.studentId as any);
          return {
            ...submission,
            studentName: `${student?.firstName} ${student?.lastName}`,
            admissionNumber: student?.admissionNumber,
          };
        })
      );

      result.submissions = enrichedSubmissions;
    }

    return result;
  },
});

export const getMyAssignments = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");

    // Get student profile for current user
    const student = await ctx.db
      .query("students")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .filter((q) => q.eq(q.field("userId"), tenant.userId))
      .first();

    if (!student) {
      return [];
    }

    let assignmentsQuery = ctx.db
      .query("assignments")
      .withIndex("by_class", (q) => q.eq("classId", student.classId));

    if (args.status) {
      assignmentsQuery = assignmentsQuery.filter((q) =>
        q.eq(q.field("status"), args.status)
      );
    }

    const assignments = await assignmentsQuery
      .order("desc")
      .take(args.limit ?? 20)
      .collect();

    // Enrich with submission status
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await ctx.db
          .query("submissions")
          .withIndex("by_assignment_student", (q) =>
            q.eq("assignmentId", assignment._id).eq("studentId", student._id)
          )
          .first();

        const subject = await ctx.db.get(assignment.subjectId as any);
        const teacher = await ctx.db.get(assignment.teacherId as any);

        return {
          ...assignment,
          subjectName: subject?.name,
          teacherName: `${teacher?.firstName} ${teacher?.lastName}`,
          submissionStatus: submission?.status || "not_submitted",
          submittedAt: submission?.submittedAt,
          grade: submission?.grade,
          feedback: submission?.feedback,
        };
      })
    );

    return enrichedAssignments;
  },
});

// Assignment mutations are handled in the enhanced functions below

// Enhanced assignment creation with full features
export const createAssignment = mutation({
  args: {
    classId: v.string(),
    subjectId: v.string(),
    title: v.string(),
    description: v.string(),
    instructions: v.optional(v.string()),
    dueDate: v.string(),
    dueTime: v.optional(v.string()),
    maxPoints: v.number(),
    type: v.string(), // homework, classwork, project, exam, quiz
    gradingScale: v.optional(v.string()), // points, percentage, letter, competency
    allowLateSubmission: v.optional(v.boolean()),
    latePenalty: v.optional(v.number()),
    publishImmediately: v.optional(v.boolean()),
    attachments: v.optional(v.array(v.string())),
    learningObjectives: v.optional(v.array(v.string())),
    rubric: v.optional(v.array(v.object({
      criteria: v.string(),
      description: v.string(),
      maxPoints: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    // Verify teacher has access to this class
    const classRecord = await ctx.db.get(args.classId as any);
    if (!classRecord || classRecord.tenantId !== tenant.tenantId) {
      throw new Error("Class not found");
    }

    if (classRecord.teacherId !== tenant.userId && tenant.role !== "school_admin") {
      throw new Error("Only assigned teacher can create assignments");
    }

    const now = Date.now();
    const assignmentId = await ctx.db.insert("assignments", {
      tenantId: tenant.tenantId,
      classId: args.classId,
      subjectId: args.subjectId,
      teacherId: tenant.userId,
      title: args.title,
      description: args.description,
      instructions: args.instructions,
      dueDate: args.dueDate,
      dueTime: args.dueTime,
      maxPoints: args.maxPoints,
      type: args.type,
      gradingScale: args.gradingScale || "points",
      allowLateSubmission: args.allowLateSubmission ?? false,
      latePenalty: args.latePenalty || 0,
      status: args.publishImmediately ? "published" : "draft",
      attachments: args.attachments || [],
      learningObjectives: args.learningObjectives || [],
      rubric: args.rubric || [],
      createdAt: now,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "assignment.created" as any,
      entityType: "assignments",
      entityId: assignmentId,
      after: args,
    });

    return assignmentId;
  },
});

// Update assignment
export const updateAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      instructions: v.optional(v.string()),
      dueDate: v.optional(v.string()),
      dueTime: v.optional(v.string()),
      maxPoints: v.optional(v.number()),
      allowLateSubmission: v.optional(v.boolean()),
      latePenalty: v.optional(v.number()),
      status: v.optional(v.string()),
      attachments: v.optional(v.array(v.string())),
      learningObjectives: v.optional(v.array(v.string())),
      rubric: v.optional(v.array(v.object({
        criteria: v.string(),
        description: v.string(),
        maxPoints: v.number(),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      throw new Error("Assignment not found");
    }

    if (assignment.teacherId !== tenant.userId && tenant.role !== "school_admin") {
      throw new Error("Only assignment creator can update");
    }

    await ctx.db.patch(args.assignmentId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "assignment.updated" as any,
      entityType: "assignments",
      entityId: args.assignmentId,
      before: assignment,
      after: args.updates,
    });

    return { success: true };
  },
});

// Delete assignment
export const deleteAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      throw new Error("Assignment not found");
    }

    if (assignment.teacherId !== tenant.userId && tenant.role !== "school_admin") {
      throw new Error("Only assignment creator can delete");
    }

    // Check if there are submissions
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();

    if (submissions.length > 0) {
      throw new Error("Cannot delete assignment with existing submissions");
    }

    await ctx.db.delete(args.assignmentId);

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "assignment.deleted" as any,
      entityType: "assignments",
      entityId: args.assignmentId,
      before: assignment,
    });

    return { success: true };
  },
});

// Bulk grade submissions
export const bulkGradeSubmissions = mutation({
  args: {
    assignmentId: v.id("assignments"),
    grades: v.array(v.object({
      submissionId: v.id("submissions"),
      score: v.number(),
      grade: v.optional(v.string()),
      feedback: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      throw new Error("Assignment not found");
    }

    if (assignment.teacherId !== tenant.userId && tenant.role !== "school_admin") {
      throw new Error("Only assignment creator can grade");
    }

    const now = Date.now();
    const results = [];

    for (const gradeData of args.grades) {
      const submission = await ctx.db.get(gradeData.submissionId);
      if (!submission || submission.tenantId !== tenant.tenantId) {
        continue;
      }

      await ctx.db.patch(gradeData.submissionId, {
        score: gradeData.score,
        grade: gradeData.grade,
        feedback: gradeData.feedback,
        status: "graded",
        gradedAt: now,
        gradedBy: tenant.userId,
      });

      results.push(gradeData.submissionId);
    }

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "submissions.bulk_graded" as any,
      entityType: "submissions",
      entityId: args.assignmentId,
      after: { gradedCount: results.length },
    });

    return { success: true, gradedCount: results.length };
  },
});
