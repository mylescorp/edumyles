import { v } from "convex/values";
import { mutation, type MutationCtx } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { requireTenantContext, requireTenantSession } from "../../helpers/tenantGuard";
import { logAction } from "../../helpers/auditLog";
import { publishEvent } from "../../eventBus";

function kcseGrade(score: number) {
  if (score >= 80) return "A";
  if (score >= 75) return "A-";
  if (score >= 70) return "B+";
  if (score >= 65) return "B";
  if (score >= 60) return "B-";
  if (score >= 55) return "C+";
  if (score >= 50) return "C";
  if (score >= 45) return "C-";
  if (score >= 40) return "D+";
  if (score >= 35) return "D";
  if (score >= 30) return "D-";
  return "E";
}

function gradePoints(grade: string) {
  const points: Record<string, number> = {
    A: 12,
    "A-": 11,
    "B+": 10,
    B: 9,
    "B-": 8,
    "C+": 7,
    C: 6,
    "C-": 5,
    "D+": 4,
    D: 3,
    "D-": 2,
    E: 1,
  };
  return points[grade] ?? 0;
}

function sanitizeText(value?: string) {
  return value?.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").trim();
}

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
          grade: record.grade || kcseGrade(record.score),
          remarks: sanitizeText(record.remarks),
          updatedAt: now,
        });
      } else if (!existing) {
        await ctx.db.insert("grades", {
          ...record,
          grade: record.grade || kcseGrade(record.score),
          remarks: sanitizeText(record.remarks),
          tenantId: tenant.tenantId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    return { success: true, count: args.grades.length };
  },
});

export const createSubject = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    type: v.optional(v.string()),
    applicableLevels: v.optional(v.array(v.string())),
    gradingSystemId: v.optional(v.string()),
    isOptional: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const now = Date.now();
    return await ctx.db.insert("subjects", {
      tenantId: tenant.tenantId,
      name: args.name,
      code: args.code,
      type: args.type ?? "core",
      subjectType: args.type ?? "core",
      applicableLevels: args.applicableLevels ?? [],
      levelCodes: args.applicableLevels ?? [],
      gradingSystemId: args.gradingSystemId,
      isOptional: args.isOptional ?? false,
      isDeleted: false,
      description: sanitizeText(args.description),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSubject = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    id: v.id("subjects"),
    updates: v.object({
      name: v.optional(v.string()),
      code: v.optional(v.string()),
      type: v.optional(v.string()),
      applicableLevels: v.optional(v.array(v.string())),
      gradingSystemId: v.optional(v.string()),
      isOptional: v.optional(v.boolean()),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const subject = await ctx.db.get(args.id);
    if (!subject || subject.tenantId !== tenant.tenantId) throw new Error("Subject not found");
    await ctx.db.patch(args.id, {
      ...args.updates,
      subjectType: args.updates.type,
      levelCodes: args.updates.applicableLevels,
      description: sanitizeText(args.updates.description),
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const deleteSubject = mutation({
  args: { sessionToken: v.optional(v.string()), id: v.id("subjects") },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const subject = await ctx.db.get(args.id);
    if (!subject || subject.tenantId !== tenant.tenantId) throw new Error("Subject not found");
    await ctx.db.patch(args.id, { isDeleted: true, updatedAt: Date.now() });
    return { success: true };
  },
});

export const createGradingSystem = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    name: v.string(),
    type: v.string(),
    grades: v.array(v.object({
      grade: v.string(),
      minPct: v.number(),
      maxPct: v.number(),
      points: v.number(),
      description: v.string(),
    })),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query("gradingSystems")
        .withIndex("by_tenant_default", (q) => q.eq("tenantId", tenant.tenantId).eq("isDefault", true))
        .collect();
      for (const system of existingDefaults) await ctx.db.patch(system._id, { isDefault: false });
    }
    return await ctx.db.insert("gradingSystems", {
      tenantId: tenant.tenantId,
      name: args.name,
      type: args.type,
      grades: args.grades,
      isDefault: args.isDefault ?? false,
      createdAt: Date.now(),
    });
  },
});

export const updateGradingSystem = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    id: v.id("gradingSystems"),
    updates: v.object({
      name: v.optional(v.string()),
      type: v.optional(v.string()),
      grades: v.optional(v.array(v.object({
        grade: v.string(),
        minPct: v.number(),
        maxPct: v.number(),
        points: v.number(),
        description: v.string(),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const system = await ctx.db.get(args.id);
    if (!system || system.tenantId !== tenant.tenantId) throw new Error("Grading system not found");
    await ctx.db.patch(args.id, { ...args.updates, updatedAt: Date.now() });
    return { success: true };
  },
});

export const setDefaultGradingSystem = mutation({
  args: { sessionToken: v.optional(v.string()), gradingSystemId: v.id("gradingSystems") },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const selected = await ctx.db.get(args.gradingSystemId);
    if (!selected || selected.tenantId !== tenant.tenantId) throw new Error("Grading system not found");
    const systems = await ctx.db
      .query("gradingSystems")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
    for (const system of systems) {
      await ctx.db.patch(system._id, { isDefault: system._id === args.gradingSystemId, updatedAt: Date.now() });
    }
    return { success: true };
  },
});

export const assignSubjectToClass = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    classId: v.string(),
    subjectId: v.string(),
    teacherId: v.string(),
    academicYearId: v.string(),
    termId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const existing = await ctx.db
      .query("classSubjectAssignments")
      .withIndex("by_tenant_class", (q) => q.eq("tenantId", tenant.tenantId).eq("classId", args.classId))
      .collect();
    const match = existing.find((assignment) =>
      assignment.subjectId === args.subjectId &&
      assignment.academicYearId === args.academicYearId &&
      assignment.termId === args.termId
    );
    const payload = {
      tenantId: tenant.tenantId,
      classId: args.classId,
      subjectId: args.subjectId,
      teacherId: args.teacherId,
      academicYearId: args.academicYearId,
      termId: args.termId,
      isActive: true,
      updatedAt: Date.now(),
    };
    if (match) {
      await ctx.db.patch(match._id, payload);
      return match._id;
    }
    return await ctx.db.insert("classSubjectAssignments", { ...payload, createdAt: Date.now() });
  },
});

export const studentOptOutOfSubject = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    studentId: v.string(),
    subjectId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const existing = await ctx.db
      .query("studentSubjectOpts")
      .withIndex("by_tenant_student", (q) => q.eq("tenantId", tenant.tenantId).eq("studentId", args.studentId))
      .collect();
    const match = existing.find((opt) => opt.subjectId === args.subjectId);
    if (match) {
      await ctx.db.patch(match._id, { isOptedOut: true, approvedBy: tenant.userId });
      return match._id;
    }
    return await ctx.db.insert("studentSubjectOpts", {
      tenantId: tenant.tenantId,
      studentId: args.studentId,
      subjectId: args.subjectId,
      isOptedOut: true,
      approvedBy: tenant.userId,
      createdAt: Date.now(),
    });
  },
});

export const createExam = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    name: v.string(),
    classId: v.optional(v.string()),
    className: v.optional(v.string()),
    subjectId: v.optional(v.string()),
    termId: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    totalMarks: v.optional(v.number()),
    weight: v.optional(v.number()),
    examDate: v.optional(v.number()),
    resultsPublishDate: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const date = args.examDate ? new Date(args.examDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const id = await ctx.db.insert("examinations", {
      tenantId: tenant.tenantId,
      name: args.name,
      classId: args.classId,
      className: args.className,
      subjectId: args.subjectId,
      date,
      totalMarks: args.totalMarks,
      status: "scheduled",
      createdBy: tenant.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const bulkEnterGrades = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    examId: v.id("examinations"),
    grades: v.array(v.object({
      studentId: v.string(),
      marksAwarded: v.number(),
      remarks: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const exam = await ctx.db.get(args.examId);
    if (!exam || exam.tenantId !== tenant.tenantId) throw new Error("Exam not found");
    const now = Date.now();
    for (const entry of args.grades) {
      const percentage = exam.totalMarks ? Math.round((entry.marksAwarded / exam.totalMarks) * 1000) / 10 : entry.marksAwarded;
      const grade = kcseGrade(percentage);
      const existing = await ctx.db
        .query("grades")
        .withIndex("by_student", (q) => q.eq("studentId", entry.studentId).eq("term", exam.date.slice(0, 4)))
        .filter((q) => q.eq(q.field("subjectId"), exam.subjectId ?? "general"))
        .first();
      const payload = {
        tenantId: tenant.tenantId,
        studentId: entry.studentId,
        classId: exam.classId ?? "unknown",
        subjectId: exam.subjectId ?? "general",
        term: exam.date.slice(0, 4),
        academicYear: exam.date.slice(0, 4),
        score: percentage,
        grade,
        remarks: sanitizeText(entry.remarks),
        recordedBy: tenant.userId,
        updatedAt: now,
      };
      if (existing && existing.tenantId === tenant.tenantId) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("grades", { ...payload, createdAt: now });
      }
      await publishEvent(ctx, {
        eventType: "academics.grade.posted",
        publisherModule: "mod_academics",
        tenantId: tenant.tenantId,
        payload: { examId: args.examId, studentId: entry.studentId, grade, gradePoints: gradePoints(grade) },
      });
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

    await ctx.scheduler.runAfter(0, internal.modules.platform.onboarding.completeFirstActionForTenant, {
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      source: "assignment",
      count: 1,
    });

    return assignmentId;
  },
});

/**
 * Update an existing assignment.
 */
export const updateAssignment = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    assignmentId: v.id("assignments"),
    updates: v.object({
      classId: v.optional(v.string()),
      subjectId: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      instructions: v.optional(v.string()),
      dueDate: v.optional(v.string()),
      dueTime: v.optional(v.string()),
      maxPoints: v.optional(v.number()),
      type: v.optional(v.string()),
      allowLateSubmission: v.optional(v.boolean()),
      latePenalty: v.optional(v.number()),
      status: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      throw new Error("Assignment not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(args.updates)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    await ctx.db.patch(args.assignmentId, updates);
    return { success: true };
  },
});

/**
 * Delete an assignment within the current tenant.
 */
export const deleteAssignment = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      throw new Error("Assignment not found");
    }

    await ctx.db.delete(args.assignmentId);
    return { success: true };
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

    await ctx.scheduler.runAfter(0, internal.modules.platform.onboarding.completeFirstActionForTenant, {
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      source: "attendance",
      count: args.records.length,
    });

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

    // Resolve tenant curriculum for GPA calculation
    const tenantDoc = await ctx.db
      .query("tenants")
      .withIndex("by_id", (q: any) => q.eq("_id", tenant.tenantId as any))
      .first()
      .catch(() => null);
    const curriculumCode: string = (tenantDoc as any)?.curriculumCode ?? "KE_CBC";

    // Calculate GPA and class ranking
    const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
    const averageScore = grades.length > 0 ? totalScore / grades.length : 0;
    const gpa = calculateGPA(averageScore, curriculumCode);
    
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

    const reportSubjects = grades.map(grade => {
      const subject = subjects.find(s => s?._id === grade.subjectId);
      return {
        subjectId: grade.subjectId,
        subjectName: (subject as any)?.name || "Unknown",
        subjectCode: (subject as any)?.code || "",
        score: grade.score,
        marksAwarded: grade.score,
        totalMarks: 100,
        percentageScore: grade.score,
        grade: grade.grade,
        gradePoints: gradePoints(grade.grade),
        remarks: grade.remarks,
        teacherRemarks: grade.remarks,
        isMissing: false,
      };
    });

    // Create report card record
    const reportCardId = await ctx.db.insert("reportCards", {
      tenantId: tenant.tenantId,
      studentId: args.studentId,
      classId: (student as any).classId,
      term: args.term,
      academicYear: args.academicYear,
      subjects: reportSubjects,
      totalMarks: totalScore,
      outOf: grades.length * 100,
      overallPercentage: Math.round(averageScore * 10) / 10,
      meanGrade: kcseGrade(averageScore),
      gpa,
      rank,
      classRank: rank,
      classSize: averagesWithStudents.length,
      attendanceSummary,
      performanceGraphEnabled: true,
      status: "ready",
      generatedAt: now,
      createdAt: now,
    });
    await ctx.db.patch(reportCardId, {
      pdfUrl: `/api/documents/report-card/${reportCardId}`,
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
      grades: reportSubjects,
      gpa,
      rank,
      averageScore,
      attendanceSummary,
      totalStudentsInClass: averagesWithStudents.length
    };
  },
});

export const generateReportCards = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    classId: v.string(),
    termId: v.string(),
    academicYearId: v.optional(v.string()),
    includeAttendance: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const students = await ctx.db
      .query("students")
      .withIndex("by_tenant_class", (q) => q.eq("tenantId", tenant.tenantId).eq("classId", args.classId))
      .collect();
    const grades = await ctx.db
      .query("grades")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
    const subjectById = new Map(subjects.map((subject) => [subject._id.toString(), subject]));
    const now = Date.now();
    const failed: Array<{ studentId: string; reason: string }> = [];
    let generated = 0;

    const studentAverages = students.map((student) => {
      const studentGrades = grades.filter((grade) =>
        grade.studentId === student._id.toString() &&
        grade.classId === args.classId &&
        grade.term === args.termId
      );
      const average = studentGrades.length
        ? studentGrades.reduce((sum, grade) => sum + grade.score, 0) / studentGrades.length
        : 0;
      return { studentId: student._id.toString(), average };
    }).sort((a, b) => b.average - a.average);

    for (const student of students) {
      try {
        const studentId = student._id.toString();
        const studentGrades = grades.filter((grade) =>
          grade.studentId === studentId &&
          grade.classId === args.classId &&
          grade.term === args.termId
        );
        const outOf = studentGrades.length * 100;
        const totalMarks = studentGrades.reduce((sum, grade) => sum + grade.score, 0);
        const overallPercentage = studentGrades.length ? Math.round((totalMarks / studentGrades.length) * 10) / 10 : 0;
        const meanGrade = kcseGrade(overallPercentage);
        const classRank = studentAverages.findIndex((entry) => entry.studentId === studentId) + 1;
        let attendanceSummary: any = undefined;
        if (args.includeAttendance) {
          const attendance = await ctx.db
            .query("attendance")
            .withIndex("by_student_date", (q) => q.eq("studentId", studentId))
            .collect();
          const termAttendance = attendance.filter((record) => record.tenantId === tenant.tenantId);
          const presentDays = termAttendance.filter((record) => record.status === "present").length;
          const absentDays = termAttendance.filter((record) => record.status === "absent").length;
          const lateDays = termAttendance.filter((record) => record.status === "late").length;
          const medicalDays = termAttendance.filter((record) => record.status === "medical").length;
          const totalDays = presentDays + absentDays + lateDays + medicalDays;
          attendanceSummary = {
            presentDays,
            absentDays,
            lateDays,
            medicalDays,
            attendanceRatePct: totalDays ? Math.round((presentDays / totalDays) * 1000) / 10 : 0,
          };
        }
        const existing = await ctx.db
          .query("reportCards")
          .withIndex("by_student_term", (q) => q.eq("studentId", studentId).eq("term", args.termId).eq("academicYear", args.academicYearId ?? new Date().getFullYear().toString()))
          .first();
        const payload = {
          tenantId: tenant.tenantId,
          studentId,
          classId: args.classId,
          term: args.termId,
          termId: args.termId,
          academicYear: args.academicYearId ?? new Date().getFullYear().toString(),
          academicYearId: args.academicYearId,
          subjects: studentGrades.map((grade) => {
            const subject = subjectById.get(grade.subjectId);
            return {
              subjectId: grade.subjectId,
              subjectName: subject?.name ?? "Unknown subject",
              marksAwarded: grade.score,
              totalMarks: 100,
              percentageScore: grade.score,
              grade: grade.grade,
              gradePoints: gradePoints(grade.grade),
              teacherRemarks: grade.remarks,
              isMissing: false,
            };
          }),
          totalMarks,
          outOf,
          overallPercentage,
          meanGrade,
          gpa: calculateGPA(overallPercentage, "KE_8_4_4"),
          rank: classRank,
          classRank,
          classSize: students.length,
          performanceGraphEnabled: true,
          attendanceSummary,
          status: "ready",
          generatedAt: now,
          createdAt: now,
        };
        if (existing && existing.tenantId === tenant.tenantId) {
          await ctx.db.patch(existing._id, payload);
        } else {
          await ctx.db.insert("reportCards", payload);
        }
        generated += 1;
      } catch (error) {
        failed.push({ studentId: student._id.toString(), reason: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return { generated, failed };
  },
});

export const publishReportCards = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    termId: v.string(),
    classIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const cards = await ctx.db
      .query("reportCards")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
    let published = 0;
    for (const card of cards) {
      if (card.term !== args.termId || !args.classIds.includes(card.classId ?? "")) continue;
      await ctx.db.patch(card._id, {
        status: "published",
        publishedAt: Date.now(),
      });
      await publishEvent(ctx, {
        eventType: "academics.report_card.generated",
        publisherModule: "mod_academics",
        tenantId: tenant.tenantId,
        payload: {
          studentId: card.studentId,
          termId: args.termId,
          academicYearId: card.academicYearId ?? card.academicYear,
          reportCardUrl: card.pdfUrl ?? card.fileUrl ?? `/api/documents/report-card/${card._id}`,
        },
      });
      published += 1;
    }
    return { success: true, published };
  },
});

export const addPrincipalRemarks = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    reportCardId: v.id("reportCards"),
    remarks: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const card = await ctx.db.get(args.reportCardId);
    if (!card || card.tenantId !== tenant.tenantId) throw new Error("Report card not found");
    await ctx.db.patch(args.reportCardId, {
      principalRemarks: sanitizeText(args.remarks),
    });
    return { success: true };
  },
});

export const generateAIReportNarrative = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    studentId: v.string(),
    termId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const grades = (await ctx.db
      .query("grades")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId).eq("term", args.termId))
      .collect()).filter((grade) => grade.tenantId === tenant.tenantId);
    const average = grades.length ? Math.round((grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length) * 10) / 10 : 0;
    const narrative = `The learner achieved an overall average of ${average}% with strongest performance reflected in ${grades.length} assessed subject(s). Review attendance, participation, and subject-specific feedback before publishing this narrative.`;
    return { narrative };
  },
});

export const createLessonPlan = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    classId: v.string(),
    subjectId: v.string(),
    termId: v.string(),
    weekNumber: v.number(),
    sessionNumber: v.number(),
    topic: v.string(),
    learningObjectives: v.array(v.string()),
    activities: v.optional(v.string()),
    resources: v.optional(v.array(v.string())),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    return await ctx.db.insert("lessonPlans", {
      tenantId: tenant.tenantId,
      teacherId: tenant.userId,
      classId: args.classId,
      subjectId: args.subjectId,
      termId: args.termId,
      weekNumber: args.weekNumber,
      sessionNumber: args.sessionNumber,
      topic: args.topic,
      learningObjectives: args.learningObjectives,
      activities: sanitizeText(args.activities),
      resources: args.resources ?? [],
      duration: args.duration,
      createdAt: Date.now(),
    });
  },
});

export const updateLessonPlan = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    lessonPlanId: v.id("lessonPlans"),
    updates: v.object({
      topic: v.optional(v.string()),
      learningObjectives: v.optional(v.array(v.string())),
      activities: v.optional(v.string()),
      resources: v.optional(v.array(v.string())),
      duration: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const lesson = await ctx.db.get(args.lessonPlanId);
    if (!lesson || lesson.tenantId !== tenant.tenantId) throw new Error("Lesson plan not found");
    await ctx.db.patch(args.lessonPlanId, {
      ...args.updates,
      activities: sanitizeText(args.updates.activities),
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const markLessonCompleted = mutation({
  args: { sessionToken: v.optional(v.string()), lessonPlanId: v.id("lessonPlans") },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");
    const lesson = await ctx.db.get(args.lessonPlanId);
    if (!lesson || lesson.tenantId !== tenant.tenantId) throw new Error("Lesson plan not found");
    await ctx.db.patch(args.lessonPlanId, { completedAt: Date.now(), updatedAt: Date.now() });
    return { success: true };
  },
});

export const logStudentAchievement = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    studentId: v.string(),
    title: v.string(),
    description: v.string(),
    date: v.number(),
    category: v.string(),
    evidenceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");
    return await ctx.db.insert("studentAchievements", {
      tenantId: tenant.tenantId,
      studentId: args.studentId,
      title: args.title,
      description: sanitizeText(args.description) ?? "",
      date: args.date,
      category: args.category,
      evidenceUrl: args.evidenceUrl,
      loggedBy: tenant.userId,
      createdAt: Date.now(),
    });
  },
});

export const flagStudentForCounselling = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    studentId: v.string(),
    termId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = args.sessionToken
      ? await requireTenantSession(ctx, { sessionToken: args.sessionToken })
      : await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");
    return await ctx.db.insert("counsellingFlags", {
      tenantId: tenant.tenantId,
      studentId: args.studentId,
      termId: args.termId,
      reason: sanitizeText(args.reason) ?? "",
      status: "open",
      flaggedBy: tenant.userId,
      flaggedAt: Date.now(),
    });
  },
});

// Helper function to calculate GPA based on curriculum
function calculateGPA(averageScore: number, curriculumCode: string = "KE_CBC"): number {
  switch (curriculumCode) {
    // Uganda UNEB — 6-point descending scale mapped to 4.0
    case "UG_UNEB":
      if (averageScore >= 80) return 4.0; // D1
      if (averageScore >= 70) return 3.3; // D2
      if (averageScore >= 60) return 2.7; // C3
      if (averageScore >= 50) return 2.0; // C4/C5
      if (averageScore >= 40) return 1.3; // P6
      if (averageScore >= 30) return 0.7; // P7/P8
      return 0.0; // F9

    // Tanzania NECTA — 5-point scale
    case "TZ_NECTA":
      if (averageScore >= 75) return 4.0; // A
      if (averageScore >= 65) return 3.0; // B
      if (averageScore >= 50) return 2.0; // C
      if (averageScore >= 30) return 1.0; // D
      return 0.0; // F

    // Rwanda REB — letter grades
    case "RW_REB":
      if (averageScore >= 80) return 4.0; // A
      if (averageScore >= 70) return 3.0; // B
      if (averageScore >= 60) return 2.0; // C
      if (averageScore >= 50) return 1.0; // D
      return 0.0; // E

    // Ethiopia MOE — higher thresholds
    case "ET_MOE":
      if (averageScore >= 90) return 4.0; // A
      if (averageScore >= 80) return 3.0; // B
      if (averageScore >= 70) return 2.0; // C
      if (averageScore >= 60) return 1.0; // D
      return 0.0; // F

    // Ghana WAEC — 9-point scale mapped to 4.0
    case "GH_WAEC":
      if (averageScore >= 75) return 4.0; // A1
      if (averageScore >= 70) return 3.7; // B2
      if (averageScore >= 65) return 3.3; // B3
      if (averageScore >= 60) return 3.0; // C4
      if (averageScore >= 55) return 2.7; // C5
      if (averageScore >= 50) return 2.3; // C6
      if (averageScore >= 45) return 1.3; // D7
      if (averageScore >= 40) return 1.0; // E8
      return 0.0; // F9

    // Kenya CBC and Kenya 8-4-4 (default)
    case "KE_CBC":
    case "KE_8_4_4":
    default:
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
