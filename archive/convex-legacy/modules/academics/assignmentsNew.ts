import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
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

    const assignments = await assignmentsQuery
      .order("desc")
      .take(args.limit ?? 50)
      .collect();

    // Enrich with related data
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const [classRecord, subject, teacher] = await Promise.all([
          ctx.db.get(assignment.classId as any),
          ctx.db.get(assignment.subjectId as any),
          ctx.db.get(assignment.teacherId as any),
        ]);

        const submissionsCount = await ctx.db
          .query("submissions")
          .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
          .collect();

        return {
          ...assignment,
          className: (classRecord as any)?.name || "Unknown Class",
          subjectName: (subject as any)?.name || "Unknown Subject",
          teacherName: teacher ? `${(teacher as any).firstName} ${(teacher as any).lastName}` : "Unknown Teacher",
          submissionsCount: submissionsCount.length,
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

    let result: any = { ...assignment };

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
            studentName: student ? `${(student as any).firstName} ${(student as any).lastName}` : "Unknown",
            admissionNumber: (student as any)?.admissionNumber,
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
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
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
          subjectName: (subject as any)?.name,
          teacherName: teacher ? `${(teacher as any).firstName} ${(teacher as any).lastName}` : "Unknown",
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
    if (!classRecord || (classRecord as any).tenantId !== tenant.tenantId) {
      throw new Error("Class not found");
    }

    if ((classRecord as any).teacherId !== tenant.userId && tenant.role !== "school_admin") {
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

// Submit assignment
export const submitAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    content: v.string(),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");

    // Get student profile for current user
    const student = await ctx.db
      .query("students")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .filter((q) => q.eq(q.field("userId"), tenant.userId))
      .first();

    if (!student) {
      throw new Error("Student profile not found");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      throw new Error("Assignment not found");
    }

    if (assignment.status !== "published") {
      throw new Error("Assignment is not published");
    }

    // Check if already submitted
    const existingSubmission = await ctx.db
      .query("submissions")
      .withIndex("by_assignment_student", (q) =>
        q.eq("assignmentId", args.assignmentId.toString()).eq("studentId", student._id)
      )
      .first();

    if (existingSubmission) {
      throw new Error("Assignment already submitted");
    }

    const now = Date.now();
    const isLate = new Date(assignment.dueDate).getTime() < now && !assignment.allowLateSubmission;

    const submissionId = await ctx.db.insert("submissions", {
      tenantId: tenant.tenantId,
      assignmentId: args.assignmentId.toString(),
      studentId: student._id,
      content: args.content,
      attachments: args.attachments || [],
      status: isLate ? "late" : "submitted",
      submittedAt: now,
      createdAt: now,
    });

    return { success: true, submissionId, isLate };
  },
});

// Grade submission
export const gradeSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
    score: v.number(),
    grade: v.optional(v.string()),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.tenantId !== tenant.tenantId) {
      throw new Error("Submission not found or access denied");
    }

    const assignment = await ctx.db.get(submission.assignmentId as any);
    if (!assignment || assignment.teacherId !== tenant.userId) {
      throw new Error("Only the assignment creator can grade submissions");
    }

    await ctx.db.patch(args.submissionId, {
      score: args.score,
      grade: args.grade,
      feedback: args.feedback,
      status: "graded",
      gradedAt: Date.now(),
      gradedBy: tenant.userId,
    });

    return args.submissionId;
  },
});
