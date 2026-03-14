import { v } from "convex/values";
import { mutation } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { requirePlatformSession } from "../../../helpers/platformGuard";
import { requireModule } from "../../../helpers/moduleGuard";
import { logAction } from "../../../helpers/auditLog";

async function getStudentRecord(ctx: any, tenant: any) {
  const student = await ctx.db
    .query("students")
    .withIndex("by_user", (q: any) => q.eq("userId", tenant.userId))
    .first();
  if (!student || !student.isActive) return null;
  return student;
}

export const installSISModule = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requirePlatformSession(ctx, { sessionToken: args.sessionToken });
    
    // Check if SIS module is already installed
    const existing = await ctx.db
      .query("installedModules")
      .withIndex("by_tenant_module", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("moduleId", "sis")
      )
      .first();
    
    if (existing) {
      console.log("SIS module already installed for tenant:", tenant.tenantId);
      return { success: true, alreadyInstalled: true };
    }
    
    // Install SIS module
    await ctx.db.insert("installedModules", {
      tenantId: tenant.tenantId,
      moduleId: "sis",
      installedAt: Date.now(),
      installedBy: tenant.userId,
      config: {},
      status: "active",
      updatedAt: Date.now(),
    });
    
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "module.installed",
      entityType: "installedModule",
      entityId: "sis",
      after: { moduleId: "sis", status: "active" },
    });
    
    return { success: true, alreadyInstalled: false };
  },
});

export const updateStudentProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "academics");
        location: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");

        const student = await getStudentRecord(ctx, tenant);
        if (!student) throw new Error("Student profile not found");

        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        if (args.firstName !== undefined) updates.firstName = args.firstName;
        if (args.lastName !== undefined) updates.lastName = args.lastName;
        if (args.phone !== undefined) updates.phone = args.phone;
        if (args.bio !== undefined) updates.bio = args.bio;
        if (args.location !== undefined) updates.location = args.location;

        await ctx.db.patch(student._id, updates);
        
        await logAction(ctx, {
            tenantId: tenant.tenantId,
            actorId: tenant.userId,
            actorEmail: tenant.email,
            action: "student.updated",
            entityType: "student",
            entityId: student._id.toString(),
            after: updates,
        });

        return { success: true };
    },
});

export const submitAssignment = mutation({
    args: {
        assignmentId: v.id("assignments"),
        attachments: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.attachments.length === 0) {
            throw new Error("At least one attachment is required");
        }
        const tenant = await requireTenantContext(ctx);
        await requireModule(ctx, tenant.tenantId, "academics");

        const student = await getStudentRecord(ctx, tenant);
        if (!student) {
            throw new Error("Student profile not found");
        }

        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment || assignment.tenantId !== tenant.tenantId) {
            throw new Error("Assignment not found");
        }

        const existingSubmission = await ctx.db
            .query("submissions")
            .withIndex("by_student", (q) =>
                q.eq("studentId", student._id.toString())
            )
            .filter(q => q.eq(q.field("assignmentId"), args.assignmentId))
            .first();

        // Convert dueDate string (YYYY-MM-DD) to epoch for comparison if needed, 
        // but schema says dueDate is v.string(). If it's ISO, string comparison works.
        const today = new Date().toISOString().split('T')[0]!;
        const status = ((assignment as any).dueDate < today) ? "late" : "submitted";

        let submissionId;
        if (existingSubmission) {
            if (existingSubmission.status === "graded") {
                throw new Error("Cannot resubmit a graded assignment");
            }
            submissionId = existingSubmission._id;
            await ctx.db.patch(submissionId, {
                fileUrl: args.attachments[0],
                status,
                submittedAt: Date.now(),
            });
        } else {
            submissionId = await ctx.db.insert("submissions", {
                tenantId: tenant.tenantId,
                assignmentId: args.assignmentId,
                studentId: student._id.toString(),
                status,
                fileUrl: args.attachments[0],
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
