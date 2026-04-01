import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

// Assignment types
export type AssignmentType = "homework" | "classwork" | "project" | "exam" | "quiz";
export type AssignmentStatus = "draft" | "published" | "closed" | "graded";
export type SubmissionStatus = "not_submitted" | "submitted" | "late" | "graded";

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

// Assignment mutations
export const createAssignment = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.string(),
    classId: v.string(),
    subjectId: v.string(),
    dueDate: v.number(),
    maxScore: v.number(),
    allowLateSubmission: v.boolean(),
    instructions: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const assignmentId = await ctx.db.insert("assignments", {
      tenantId: tenant.tenantId,
      title: args.title,
      description: args.description,
      type: args.type as AssignmentType,
      classId: args.classId,
      subjectId: args.subjectId,
      teacherId: tenant.userId,
      dueDate: args.dueDate,
      maxScore: args.maxScore,
      allowLateSubmission: args.allowLateSubmission,
      instructions: args.instructions,
      attachments: args.attachments || [],
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return assignmentId;
  },
});

export const updateAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    maxScore: v.optional(v.number()),
    allowLateSubmission: v.optional(v.boolean()),
    instructions: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      throw new Error("Assignment not found or access denied");
    }

    if (assignment.teacherId !== tenant.userId) {
      throw new Error("Only the assignment creator can update it");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.maxScore !== undefined) updates.maxScore = args.maxScore;
    if (args.allowLateSubmission !== undefined) updates.allowLateSubmission = args.allowLateSubmission;
    if (args.instructions !== undefined) updates.instructions = args.instructions;
    if (args.attachments !== undefined) updates.attachments = args.attachments;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.assignmentId, updates);
    return args.assignmentId;
  },
});

export const publishAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      throw new Error("Assignment not found or access denied");
    }

    if (assignment.teacherId !== tenant.userId) {
      throw new Error("Only the assignment creator can publish it");
    }

    await ctx.db.patch(args.assignmentId, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.assignmentId;
  },
});

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
        q.eq("assignmentId", args.assignmentId).eq("studentId", student._id)
      )
      .first();

    if (existingSubmission) {
      throw new Error("Assignment already submitted");
    }

    const now = Date.now();
    const isLate = assignment.dueDate < now && !assignment.allowLateSubmission;

    const submissionId = await ctx.db.insert("submissions", {
      tenantId: tenant.tenantId,
      assignmentId: args.assignmentId,
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
