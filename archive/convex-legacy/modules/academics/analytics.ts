import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

// Analytics types
export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  gradeDistribution: GradeDistribution[];
  totalStudents: number;
}

export interface ClassPerformance {
  classId: string;
  className: string;
  totalStudents: number;
  averageScore: number;
  passRate: number;
  subjects: SubjectPerformance[];
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  averageScore: number;
  totalSubjects: number;
  rankInClass: number;
  totalStudents: number;
  trend: "improving" | "declining" | "stable";
}

export interface TermComparison {
  term: string;
  academicYear: string;
  averageScore: number;
  passRate: number;
  totalStudents: number;
}

// Get grade distribution for a class and subject
export const getGradeDistribution = query({
  args: {
    classId: v.optional(v.string()),
    subjectId: v.optional(v.string()),
    term: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    let gradesQuery = ctx.db
      .query("grades")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

    // Apply filters
    if (args.classId) {
      gradesQuery = gradesQuery.filter((q) =>
        q.eq(q.field("classId"), args.classId)
      );
    }

    if (args.subjectId) {
      gradesQuery = gradesQuery.filter((q) =>
        q.eq(q.field("subjectId"), args.subjectId)
      );
    }

    if (args.term) {
      gradesQuery = gradesQuery.filter((q) =>
        q.eq(q.field("term"), args.term)
      );
    }

    if (args.academicYear) {
      gradesQuery = gradesQuery.filter((q) =>
        q.eq(q.field("academicYear"), args.academicYear)
      );
    }

    const grades = await gradesQuery.collect();

    // Calculate grade distribution
    const gradeCounts: Record<string, number> = {};
    grades.forEach(grade => {
      const gradeValue = grade.grade || "N/A";
      gradeCounts[gradeValue] = (gradeCounts[gradeValue] || 0) + 1;
    });

    const total = grades.length;
    const distribution: GradeDistribution[] = Object.entries(gradeCounts).map(([grade, count]) => ({
      grade,
      count,
      percentage: Math.round((count / total) * 100),
    }));

    return distribution;
  },
});

// Get class performance analytics
export const getClassPerformance = query({
  args: {
    classId: v.string(),
    term: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    // Get class information
    const classData = await ctx.db.get(args.classId as any);
    if (!classData || classData.tenantId !== tenant.tenantId) {
      throw new Error("Class not found");
    }

    // Get all grades for this class
    let gradesQuery = ctx.db
      .query("grades")
      .withIndex("by_class", (q) => q.eq("classId", args.classId));

    if (args.term) {
      gradesQuery = gradesQuery.filter((q) =>
        q.eq(q.field("term"), args.term)
      );
    }

    if (args.academicYear) {
      gradesQuery = gradesQuery.filter((q) =>
        q.eq(q.field("academicYear"), args.academicYear)
      );
    }

    const grades = await gradesQuery.collect();

    // Get unique subjects in this class
    const subjectIds = [...new Set(grades.map(g => g.subjectId))];
    const subjects: SubjectPerformance[] = [];

    for (const subjectId of subjectIds) {
      const subjectGrades = grades.filter(g => g.subjectId === subjectId);
      const subject = await ctx.db.get(subjectId as any);

      if (subjectGrades.length === 0) continue;

      const scores = subjectGrades.map(g => g.score || 0);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);

      // Calculate grade distribution for this subject
      const gradeCounts: Record<string, number> = {};
      subjectGrades.forEach(grade => {
        const gradeValue = grade.grade || "N/A";
        gradeCounts[gradeValue] = (gradeCounts[gradeValue] || 0) + 1;
      });

      const gradeDistribution: GradeDistribution[] = Object.entries(gradeCounts).map(([grade, count]) => ({
        grade,
        count,
        percentage: Math.round((count / subjectGrades.length) * 100),
      }));

      subjects.push({
        subjectId,
        subjectName: subject?.name || "Unknown Subject",
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore,
        lowestScore,
        gradeDistribution,
        totalStudents: subjectGrades.length,
      });
    }

    // Calculate overall class performance
    const allScores = grades.map(g => g.score || 0);
    const averageScore = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
    const passCount = allScores.filter(score => score >= 50).length; // Assuming 50% is pass mark
    const passRate = allScores.length > 0 ? Math.round((passCount / allScores.length) * 100) : 0;

    // Get unique students in this class
    const studentIds = [...new Set(grades.map(g => g.studentId))];
    const totalStudents = studentIds.length;

    return {
      classId: args.classId,
      className: classData.name,
      totalStudents,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate,
      subjects,
    } as ClassPerformance;
  },
});

// Get student performance trends
export const getStudentPerformanceTrends = query({
  args: {
    studentId: v.string(),
    terms: v.optional(v.number()), // number of terms to analyze
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    const student = await ctx.db.get(args.studentId as any);
    if (!student || student.tenantId !== tenant.tenantId) {
      throw new Error("Student not found");
    }

    // Get grades for the student across multiple terms
    const grades = await ctx.db
      .query("grades")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(args.terms || 6) // Last 6 terms by default
      .collect();

    if (grades.length === 0) {
      return null;
    }

    // Group by term
    const termGroups: Record<string, number[]> = {};
    grades.forEach(grade => {
      const termKey = `${grade.term}-${grade.academicYear}`;
      if (!termGroups[termKey]) {
        termGroups[termKey] = [];
      }
      termGroups[termKey].push(grade.score || 0);
    });

    // Calculate performance trends
    const termKeys = Object.keys(termGroups).sort().reverse(); // Most recent first
    const recentTerms = termKeys.slice(0, 3); // Last 3 terms
    const averages = recentTerms.map(term => {
      const scores = termGroups[term];
      return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    });

    // Determine trend
    let trend: "improving" | "declining" | "stable" = "stable";
    if (averages.length >= 2) {
      const recent = averages[0];
      const previous = averages[1];
      if (recent > previous + 5) {
        trend = "improving";
      } else if (recent < previous - 5) {
        trend = "declining";
      }
    }

    // Get current average and rank
    const currentTerm = termKeys[0];
    const currentScores = termGroups[currentTerm] || [];
    const averageScore = currentScores.length > 0 ? 
      currentScores.reduce((sum, score) => sum + score, 0) / currentScores.length : 0;

    // Get class rank (simplified - would need more complex query for accurate ranking)
    const classGrades = await ctx.db
      .query("grades")
      .withIndex("by_class_term", (q) =>
        q.eq("classId", student.classId).eq("term", grades[0]?.term).eq("academicYear", grades[0]?.academicYear)
      )
      .collect();

    const studentAverages = new Map<string, number>();
    classGrades.forEach(grade => {
      const current = studentAverages.get(grade.studentId) || 0;
      const scores = [...(currentScores || []), grade.score || 0];
      studentAverages.set(grade.studentId, scores.reduce((sum, score) => sum + score, 0) / scores.length);
    });

    const sortedAverages = Array.from(studentAverages.entries()).sort((a, b) => b[1] - a[1]);
    const rank = sortedAverages.findIndex(([studentId]) => studentId === args.studentId) + 1;
    const totalStudents = sortedAverages.length;

    return {
      studentId: args.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      averageScore: Math.round(averageScore * 100) / 100,
      totalSubjects: new Set(grades.map(g => g.subjectId)).size,
      rankInClass: rank,
      totalStudents,
      trend,
    } as StudentPerformance;
  },
});

// Get term-over-term comparison for a class
export const getTermComparisons = query({
  args: {
    classId: v.string(),
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    // Get all terms for the academic year
    const terms = await ctx.db
      .query("terms")
      .withIndex("by_year", (q) => q.eq("academicYear", args.academicYear))
      .collect();

    const comparisons: TermComparison[] = [];

    for (const term of terms) {
      const grades = await ctx.db
        .query("grades")
        .withIndex("by_class_term", (q) =>
          q.eq("classId", args.classId).eq("term", term.name).eq("academicYear", args.academicYear)
        )
        .collect();

      if (grades.length === 0) continue;

      const scores = grades.map(g => g.score || 0);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const passCount = scores.filter(score => score >= 50).length;
      const passRate = Math.round((passCount / scores.length) * 100);

      comparisons.push({
        term: term.name,
        academicYear: args.academicYear,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate,
        totalStudents: new Set(grades.map(g => g.studentId)).size,
      });
    }

    return comparisons.sort((a, b) => a.term.localeCompare(b.term));
  },
});

// Get overall school analytics
export const getSchoolAnalytics = query({
  args: {
    term: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
    requirePermission(tenant, "grades:read");

    // Get all grades for the term/year
    let gradesQuery = ctx.db
      .query("grades")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId));

    if (args.term) {
      gradesQuery = gradesQuery.filter((q) =>
        q.eq(q.field("term"), args.term)
      );
    }

    if (args.academicYear) {
      gradesQuery = gradesQuery.filter((q) =>
        q.eq(q.field("academicYear"), args.academicYear)
      );
    }

    const grades = await gradesQuery.collect();

    // Overall statistics
    const scores = grades.map(g => g.score || 0);
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const passCount = scores.filter(score => score >= 50).length;
    const passRate = scores.length > 0 ? Math.round((passCount / scores.length) * 100) : 0;

    // Grade distribution
    const gradeCounts: Record<string, number> = {};
    grades.forEach(grade => {
      const gradeValue = grade.grade || "N/A";
      gradeCounts[gradeValue] = (gradeCounts[gradeValue] || 0) + 1;
    });

    const gradeDistribution = Object.entries(gradeCounts).map(([grade, count]) => ({
      grade,
      count,
      percentage: Math.round((count / grades.length) * 100),
    }));

    return {
      totalGrades: grades.length,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate,
      gradeDistribution,
      totalStudents: new Set(grades.map(g => g.studentId)).size,
      totalSubjects: new Set(grades.map(g => g.subjectId)).size,
    };
  },
});
