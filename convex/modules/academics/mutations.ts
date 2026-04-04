import { v } from "convex/values";
import { mutation, type MutationCtx } from "../../_generated/server";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { logAction } from "../../helpers/auditLog";

/**
 * Bulk enter or update grades for students.
 */
export const enterGrades = mutation({
  args: {
    sessionToken: v.optional(v.string()),
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
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
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
    sessionToken: v.optional(v.string()),
    classId: v.string(),
    subjectId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    dueDate: v.string(),
    maxPoints: v.optional(v.number()),
    maxScore: v.optional(v.number()),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    tenantId: v.optional(v.string()),
    teacherId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const now = Date.now();
    const assignmentId = await ctx.db.insert("assignments", {
      tenantId: tenant.tenantId,
      classId: args.classId,
      subjectId: args.subjectId ?? "general",
      teacherId: tenant.userId,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      maxPoints: args.maxPoints ?? args.maxScore ?? 100,
      status: args.status ?? "draft",
      type: args.type ?? "homework",
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
    sessionToken: v.optional(v.string()),
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
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
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
 * Generate comprehensive report card with full calculations
 */
export const generateReportCard = mutation({
  args: {
    studentId: v.string(),
    term: v.string(),
    academicYear: v.string(),
    includeComments: v.optional(v.boolean()),
    includeAttendance: v.optional(v.boolean()),
    includeConduct: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const now = Date.now();
    
    // Get student information
    const student = await ctx.db.get(args.studentId as any);
    
    if (!student || (student as any).tenantId !== tenant.tenantId) {
      throw new Error("Student not found");
    }

    // Get all grades for this student in the term
    const grades = await ctx.db
      .query("grades")
      .withIndex("by_student", (q) =>
        q.eq("studentId", args.studentId).eq("term", args.term)
      )
      .filter((q) => q.eq(q.field("academicYear"), args.academicYear))
      .collect();

    // Get subjects information
    const subjectIds = [...new Set(grades.map(g => g.subjectId))];
    const subjects = await Promise.all(
      subjectIds.map(async (subjectId) => {
        const subject = await ctx.db.get(subjectId as any);
        return subject;
      })
    );

    // Calculate GPA and class ranking
    const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
    const averageScore = grades.length > 0 ? totalScore / grades.length : 0;
    const gpa = calculateGPA(averageScore);
    
    // Get class ranking
    const classGrades = (await ctx.db
      .query("grades")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect())
      .filter((grade) =>
        grade.classId === (student as any).classId &&
        grade.term === args.term &&
        grade.academicYear === args.academicYear
      );
    
    const studentAverages = new Map<string, number[]>();
    classGrades.forEach(grade => {
      const current = studentAverages.get(grade.studentId) || [];
      current.push(grade.score);
      studentAverages.set(grade.studentId, current);
    });
    
    const averagesWithStudents = Array.from(studentAverages.entries()).map(([studentId, scores]) => ({
      studentId,
      average: scores.reduce((a, b) => a + b, 0) / scores.length
    }));
    
    averagesWithStudents.sort((a, b) => b.average - a.average);
    const rank = averagesWithStudents.findIndex(item => item.studentId === args.studentId) + 1;

    // Get attendance if requested
    let attendanceSummary = null;
    if (args.includeAttendance) {
      const { startDate, endDate } = await resolveTermDateRange(
        ctx,
        tenant.tenantId,
        args.term,
        args.academicYear
      );
      const attendance = await ctx.db
        .query("attendance")
        .withIndex("by_student_date", (q) => q.eq("studentId", args.studentId))
        .collect();
      
      const termAttendance = attendance.filter(a => 
        a.date >= startDate && a.date <= endDate
      );
      
      const present = termAttendance.filter(a => a.status === "present").length;
      const absent = termAttendance.filter(a => a.status === "absent").length;
      const late = termAttendance.filter(a => a.status === "late").length;
      const total = present + absent + late;
      
      attendanceSummary = {
        present,
        absent,
        late,
        total,
        attendanceRate: total > 0 ? (present / total) * 100 : 0
      };
    }

    // Create report card record
    const reportCardId = await ctx.db.insert("reportCards", {
      tenantId: tenant.tenantId,
      studentId: args.studentId,
      term: args.term,
      academicYear: args.academicYear,
      gpa,
      rank,
      status: "ready",
      generatedAt: now,
      createdAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "reportcard.generated",
      entityType: "reportCards",
      entityId: reportCardId,
      after: {
        studentId: args.studentId,
        term: args.term,
        gpa,
        rank
      },
    });

    return {
      reportCardId,
      student,
      grades: grades.map(grade => {
        const subject = subjects.find(s => s?._id === grade.subjectId);
        return {
          ...grade,
          subjectName: (subject as any)?.name || "Unknown",
          subjectCode: (subject as any)?.code || ""
        };
      }),
      gpa,
      rank,
      averageScore,
      attendanceSummary,
      totalStudentsInClass: averagesWithStudents.length
    };
  },
});

// Helper function to calculate GPA based on Kenyan education system
function calculateGPA(averageScore: number): number {
  if (averageScore >= 80) return 4.0; // A
  if (averageScore >= 75) return 3.7; // A-
  if (averageScore >= 70) return 3.3; // B+
  if (averageScore >= 65) return 3.0; // B
  if (averageScore >= 60) return 2.7; // B-
  if (averageScore >= 55) return 2.3; // C+
  if (averageScore >= 50) return 2.0; // C
  if (averageScore >= 45) return 1.7; // C-
  if (averageScore >= 40) return 1.3; // D+
  if (averageScore >= 35) return 1.0; // D
  return 0.0; // E/F
}

async function resolveTermDateRange(
  ctx: { db: { query: MutationCtx["db"]["query"] } },
  tenantId: string,
  term: string,
  academicYear: string
): Promise<{ startDate: string; endDate: string }> {
  const configuredTerm = await ctx.db
    .query("academicTerms")
    .withIndex("by_tenant_term_year", (q) =>
      q.eq("tenantId", tenantId).eq("term", term).eq("academicYear", academicYear)
    )
    .first();

  if (configuredTerm) {
    return {
      startDate: configuredTerm.startDate,
      endDate: configuredTerm.endDate,
    };
  }

  const fallbackYear = Number.parseInt(academicYear.slice(0, 4), 10);
  const year = Number.isFinite(fallbackYear) ? fallbackYear : new Date().getUTCFullYear();
  const normalizedTerm = term.toLowerCase();

  if (normalizedTerm.includes("1") || normalizedTerm.includes("one")) {
    return { startDate: `${year}-01-01`, endDate: `${year}-04-30` };
  }
  if (normalizedTerm.includes("2") || normalizedTerm.includes("two")) {
    return { startDate: `${year}-05-01`, endDate: `${year}-08-31` };
  }
  return { startDate: `${year}-09-01`, endDate: `${year}-12-31` };
}

export const createExamination = mutation({
    args: {
        name: v.string(),
        classId: v.optional(v.string()),
        className: v.optional(v.string()),
        subjectId: v.optional(v.string()),
        date: v.string(),
        startTime: v.optional(v.string()),
        endTime: v.optional(v.string()),
        venue: v.optional(v.string()),
        totalMarks: v.optional(v.number()),
        passMark: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");
        requirePermission(tenant, "grades:write");

        const now = Date.now();
        const id = await ctx.db.insert("examinations", {
            tenantId: tenant.tenantId,
            ...args,
            status: "scheduled",
            createdBy: tenant.userId,
            createdAt: now,
            updatedAt: now,
        });

        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "exam.created" as any,
            entityType: "examinations",
            entityId: id,
            after: args,
        });

        return id;
    },
});

export const updateExaminationStatus = mutation({
    args: {
        id: v.id("examinations"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");
        requirePermission(tenant, "grades:write");

        const exam = await ctx.db.get(args.id);
        if (!exam || exam.tenantId !== tenant.tenantId) throw new Error("Examination not found");

        await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
    },
});
