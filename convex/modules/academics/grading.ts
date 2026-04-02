import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

// Import grading system from shared lib
const { GradingSystem } = require("../../../shared/src/lib/grading");

/**
 * Calculate GPA for a student across multiple subjects/terms
 */
export const calculateStudentGPA = query({
  args: {
    studentId: v.string(),
    term: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    // Get all grades for the student
    let gradesQuery = ctx.db
      .query("grades")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId));

    if (args.term) {
      gradesQuery = gradesQuery.filter((q) => q.eq("term", args.term));
    }
    if (args.academicYear) {
      gradesQuery = gradesQuery.filter((q) => q.eq("academicYear", args.academicYear));
    }

    const grades = await gradesQuery.collect();

    if (grades.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        gradePoints: 0,
        classification: 'Fail',
      };
    }

    // Convert to Grade format for calculation
    const gradeObjects = grades.map(grade => ({
      score: grade.score || 0,
      maxScore: grade.maxScore || 100,
      weight: grade.weight || 1,
      type: grade.type || 'assignment',
    }));

    // Get tenant curriculum (default to Kenya)
    const curriculum = 'KE-CBC'; // Would come from tenant settings

    return GradingSystem.calculateGPA(gradeObjects, curriculum);
  },
});

/**
 * Get class ranking and statistics
 */
export const getClassAcademicStats = query({
  args: {
    classId: v.string(),
    term: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    // Get all students in the class
    const students = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Get all grades for the class
    let gradesQuery = ctx.db
      .query("grades")
      .withIndex("by_class", (q) => q.eq("classId", args.classId));

    if (args.term) {
      gradesQuery = gradesQuery.filter((q) => q.eq("term", args.term));
    }
    if (args.academicYear) {
      gradesQuery = gradesQuery.filter((q) => q.eq("academicYear", args.academicYear));
    }

    const grades = await gradesQuery.collect();

    // Calculate GPA for each student
    const studentGPAs: Record<string, number> = {};
    const curriculum = 'KE-CBC';

    students.forEach(student => {
      const studentGrades = grades.filter(g => g.studentId === student._id.toString());
      
      if (studentGrades.length > 0) {
        const gradeObjects = studentGrades.map(grade => ({
          score: grade.score || 0,
          maxScore: grade.maxScore || 100,
          weight: grade.weight || 1,
          type: grade.type || 'assignment',
        }));
        
        const gpaData = GradingSystem.calculateGPA(gradeObjects, curriculum);
        studentGPAs[student._id.toString()] = gpaData.gpa;
      }
    });

    const gpaValues = Object.values(studentGPAs);
    const averageGPA = gpaValues.length > 0 
      ? gpaValues.reduce((sum, gpa) => sum + gpa, 0) / gpaValues.length 
      : 0;

    return {
      totalStudents: students.length,
      averageGPA: Math.round(averageGPA * 100) / 100,
      gradeDistribution: GradingSystem.generateGradeDistribution(
        grades.map(g => ({
          score: g.score || 0,
          maxScore: g.maxScore || 100,
          weight: g.weight || 1,
          type: g.type || 'assignment',
        })),
        curriculum
      ),
      studentRankings: studentGPAs,
    };
  },
});

/**
 * Generate comprehensive academic report for a student
 */
export const getStudentAcademicReport = query({
  args: {
    studentId: v.string(),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    // Get student info
    const student = await ctx.db
      .query("students")
      .withIndex("by_id", (q) => q.eq("_id", args.studentId as any))
      .first();

    if (!student || student.tenantId !== tenant.tenantId) {
      throw new Error("Student not found");
    }

    // Get all grades for the student
    let gradesQuery = ctx.db
      .query("grades")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId));

    if (args.academicYear) {
      gradesQuery = gradesQuery.filter((q) => q.eq("academicYear", args.academicYear));
    }

    const grades = await gradesQuery.collect();

    // Group grades by subject
    const gradesBySubject: Record<string, any[]> = {};
    grades.forEach(grade => {
      const subject = grade.subjectName || 'Unknown';
      if (!gradesBySubject[subject]) {
        gradesBySubject[subject] = [];
      }
      gradesBySubject[subject].push({
        score: grade.score || 0,
        maxScore: grade.maxScore || 100,
        weight: grade.weight || 1,
        type: grade.type || 'assignment',
        term: grade.term,
      });
    });

    // Convert to Grade format for calculation
    const subjectGrades: Record<string, any[]> = {};
    Object.entries(gradesBySubject).forEach(([subject, subjectGrades]) => {
      subjectGrades[subject] = subjectGrades.map(g => ({
        score: g.score || 0,
        maxScore: g.maxScore || 100,
        weight: g.weight || 1,
        type: g.type || 'assignment',
      }));
    });

    const curriculum = 'KE-CBC'; // Would come from tenant settings
    const report = GradingSystem.generatePerformanceReport(subjectGrades, curriculum);

    return {
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        classId: student.classId,
      },
      academicYear: args.academicYear || 'Current',
      ...report,
    };
  },
});

/**
 * Record new grades (bulk operation)
 */
export const recordGrades = mutation({
  args: {
    grades: v.array(v.object({
      studentId: v.string(),
      subjectId: v.string(),
      subjectName: v.string(),
      score: v.number(),
      maxScore: v.number(),
      weight: v.optional(v.number()),
      type: v.optional(v.string()),
      term: v.string(),
      academicYear: v.string(),
      classId: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:write");

    const now = Date.now();
    const recordedGrades = [];

    for (const gradeData of args.grades) {
      // Verify student belongs to tenant
      const student = await ctx.db
        .query("students")
        .withIndex("by_id", (q) => q.eq("_id", gradeData.studentId as any))
        .first();

      if (!student || student.tenantId !== tenant.tenantId) {
        continue; // Skip invalid student
      }

      const gradeId = await ctx.db.insert("grades", {
        tenantId: tenant.tenantId,
        studentId: gradeData.studentId,
        subjectId: gradeData.subjectId,
        subjectName: gradeData.subjectName,
        score: gradeData.score,
        maxScore: gradeData.maxScore,
        weight: gradeData.weight || 1,
        type: gradeData.type || 'assignment',
        term: gradeData.term,
        academicYear: gradeData.academicYear,
        classId: gradeData.classId,
        gradedBy: tenant.userId,
        gradedAt: now,
        createdAt: now,
      });

      recordedGrades.push(gradeId);
    }

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "grades.recorded",
      entityType: "grades",
      entityId: recordedGrades[0] || "",
      after: { count: recordedGrades.length, grades: args.grades },
    });

    return {
      success: true,
      recorded: recordedGrades.length,
      gradeIds: recordedGrades,
    };
  },
});
