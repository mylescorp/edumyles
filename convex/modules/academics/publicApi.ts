import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { requireModuleAccess } from "../../helpers/moduleGuard";

async function getStudentGrades(ctx: any, tenantId: string, studentId: string, termId?: string) {
  const grades = await ctx.db
    .query("grades")
    .withIndex("by_tenant_student", (q: any) => q.eq("tenantId", tenantId).eq("studentId", studentId))
    .collect();

  if (!termId) {
    return grades;
  }

  return grades.filter((grade: any) => grade.term === termId);
}

export const getStudentGradeSummary = internalQuery({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
    termId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_academics", args.tenantId);

    const grades = await getStudentGrades(ctx, args.tenantId, args.studentId, args.termId);
    const averageGrade =
      grades.length > 0
        ? Math.round((grades.reduce((sum: number, grade: any) => sum + grade.score, 0) / grades.length) * 10) / 10
        : 0;

    return {
      averageGrade,
      passedSubjects: grades.filter((grade: any) => grade.score >= 50).length,
      failedSubjects: grades.filter((grade: any) => grade.score < 50).length,
    };
  },
});

export const getStudentTermAverage = internalQuery({
  args: {
    tenantId: v.string(),
    studentId: v.string(),
    termId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireModuleAccess(ctx, "mod_academics", args.tenantId);
    const grades = await getStudentGrades(ctx, args.tenantId, args.studentId, args.termId);
    if (grades.length === 0) {
      return 0;
    }

    return (
      Math.round((grades.reduce((sum: number, grade: any) => sum + grade.score, 0) / grades.length) * 10) / 10
    );
  },
});
