import { v } from "convex/values";
import { mutation } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { requireModule } from "../../../helpers/moduleGuard";
import { logAction } from "../../../helpers/auditLog";

export const submitAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    attachments: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.attachments.length === 0) {
      throw new Error("At least one attachment is required");
    }
    const fileUrl = args.attachments[0]!;

    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");

    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", tenant.userId))
      .first();

    if (!student) {
      throw new Error("Student profile not found");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tenantId !== tenant.tenantId) {
      throw new Error("Assignment not found");
    }

    const existingSubmission = await ctx.db
      .query("submissions")
      .withIndex("by_student", (q) => q.eq("studentId", student._id.toString()))
      .filter((q) => q.eq(q.field("tenantId"), tenant.tenantId))
      .filter((q) => q.eq(q.field("assignmentId"), args.assignmentId))
      .first();

    const today = new Date().toISOString().split("T")[0] ?? "";
    const status = assignment.dueDate < today ? "late" : "submitted";

    let submissionId;
    if (existingSubmission) {
      if (existingSubmission.status === "graded") {
        throw new Error("Cannot resubmit a graded assignment");
      }
      submissionId = existingSubmission._id;
      await ctx.db.patch(submissionId, {
        fileUrl,
        status,
        submittedAt: Date.now(),
      });
    } else {
      submissionId = await ctx.db.insert("submissions", {
        tenantId: tenant.tenantId,
        assignmentId: args.assignmentId,
        studentId: student._id.toString(),
        status,
        fileUrl,
        submittedAt: Date.now(),
        createdAt: Date.now(),
      });
    }

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "assignment.submitted",
      entityType: "submission",
      entityId: submissionId,
      after: { assignmentId: args.assignmentId, status },
    });

    return submissionId;
  },
});

