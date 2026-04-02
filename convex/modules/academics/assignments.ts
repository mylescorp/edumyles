import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

type AssignmentRecord = {
  _id: string;
  tenantId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  dueTime?: string;
  maxPoints: number;
  type: string;
  gradingScale?: string;
  allowLateSubmission?: boolean;
  latePenalty?: number;
  status: string;
  attachments?: string[];
  learningObjectives?: string[];
  rubric?: Array<{
    criteria: string;
    description: string;
    maxPoints: number;
  }>;
  createdAt: number;
  updatedAt: number;
};

type StudentRecord = {
  _id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  classId?: string;
  userId?: string;
};

type StaffRecord = {
  _id: string;
  firstName?: string;
  lastName?: string;
};

type SubjectRecord = {
  _id: string;
  name?: string;
};

type ClassRecord = {
  _id: string;
  name?: string;
};

type SubmissionRecord = {
  _id: string;
  assignmentId: string;
  studentId: string;
  status: string;
  submittedAt?: number;
  grade?: number;
  feedback?: string;
};

export const listAssignments = query({
  args: {
    classId: v.optional(v.string()),
    subjectId: v.optional(v.string()),
    teacherId: v.optional(v.string()),
    status: v.optional(v.string()),
    dueDateFrom: v.optional(v.string()),
    dueDateTo: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect() as AssignmentRecord[];

    const filtered = assignments
      .filter((assignment) => !args.classId || assignment.classId === args.classId)
      .filter((assignment) => !args.subjectId || assignment.subjectId === args.subjectId)
      .filter((assignment) => !args.teacherId || assignment.teacherId === args.teacherId)
      .filter((assignment) => !args.status || assignment.status === args.status)
      .filter((assignment) => !args.dueDateFrom || assignment.dueDate >= args.dueDateFrom)
      .filter((assignment) => !args.dueDateTo || assignment.dueDate <= args.dueDateTo)
      .sort((a, b) => b.createdAt - a.createdAt);

    const paged = filtered.slice(args.offset ?? 0, (args.offset ?? 0) + (args.limit ?? 25));

    return await Promise.all(
      paged.map(async (assignment) => {
        const [subject, teacher, classData, submissions] = await Promise.all([
          ctx.db.get(assignment.subjectId as any) as Promise<SubjectRecord | null>,
          ctx.db.get(assignment.teacherId as any) as Promise<StaffRecord | null>,
          ctx.db.get(assignment.classId as any) as Promise<ClassRecord | null>,
          ctx.db
            .query("submissions")
            .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id as any))
            .collect() as Promise<SubmissionRecord[]>,
        ]);

        return {
          ...assignment,
          subject: subject?.name,
          teacher: [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ").trim(),
          className: classData?.name,
          submissionCount: submissions.length,
          pendingSubmissions: submissions.filter((submission) => submission.status === "not_submitted").length,
        };
      })
    );
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

    const assignment = await ctx.db.get(args.assignmentId) as AssignmentRecord | null;
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      return null;
    }

    if (!args.includeSubmissions) {
      return assignment;
    }

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id as any))
      .collect() as SubmissionRecord[];

    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        const student = await ctx.db.get(submission.studentId as any) as StudentRecord | null;
        return {
          ...submission,
          studentName: [student?.firstName, student?.lastName].filter(Boolean).join(" ").trim(),
          admissionNumber: student?.admissionNumber,
        };
      })
    );

    return {
      ...assignment,
      submissions: enrichedSubmissions,
    };
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

    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
      .first() as StudentRecord | null;

    if (!student?.classId || student.tenantId !== tenant.tenantId) {
      return [];
    }

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_class", (q) => q.eq("classId", student.classId as any))
      .collect() as AssignmentRecord[];

    const filtered = assignments
      .filter((assignment) => assignment.tenantId === tenant.tenantId)
      .filter((assignment) => !args.status || assignment.status === args.status)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 20);

    return await Promise.all(
      filtered.map(async (assignment) => {
        const [submission, subject, teacher] = await Promise.all([
          ctx.db
            .query("submissions")
            .withIndex("by_assignment_student", (q) =>
              q.eq("assignmentId", assignment._id as any).eq("studentId", student._id as any)
            )
            .first() as Promise<SubmissionRecord | null>,
          ctx.db.get(assignment.subjectId as any) as Promise<SubjectRecord | null>,
          ctx.db.get(assignment.teacherId as any) as Promise<StaffRecord | null>,
        ]);

        return {
          ...assignment,
          subjectName: subject?.name,
          teacherName: [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ").trim(),
          submissionStatus: submission?.status ?? "not_submitted",
          submittedAt: submission?.submittedAt,
          grade: submission?.grade,
          feedback: submission?.feedback,
        };
      })
    );
  },
});
