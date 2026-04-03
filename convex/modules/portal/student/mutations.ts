import { v } from "convex/values";
import { mutation } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { requireTenantSession } from "../../../helpers/tenantGuard";
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

export const registerMobileDeviceToken = mutation({
  args: {
    sessionToken: v.string(),
    pushToken: v.string(),
    provider: v.optional(v.string()),
    platform: v.string(),
    deviceName: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    const student = await getStudentRecord(ctx, tenant);

    if (!student) {
      throw new Error("Student profile not found");
    }

    const existing = await ctx.db
      .query("mobileDeviceTokens")
      .withIndex("by_push_token", (q) => q.eq("pushToken", args.pushToken))
      .first();

    const tokenDoc = {
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      pushToken: args.pushToken,
      provider: args.provider ?? "expo",
      platform: args.platform,
      deviceName: args.deviceName,
      notificationsEnabled: args.notificationsEnabled ?? true,
      updatedAt: Date.now(),
      lastSeenAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, tokenDoc);
      return { success: true, tokenId: existing._id };
    }

    const insertedId = await ctx.db.insert("mobileDeviceTokens", {
      ...tokenDoc,
      createdAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "mobile.device_token_registered",
      entityType: "mobileDeviceToken",
      entityId: insertedId,
      after: {
        platform: args.platform,
        provider: args.provider ?? "expo",
        deviceName: args.deviceName,
      },
    });

    return { success: true, tokenId: insertedId };
  },
});

export const sendWalletTransfer = mutation({
  args: {
    sessionToken: v.string(),
    recipientAdmissionNumber: v.string(),
    amountCents: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantSession(ctx, { sessionToken: args.sessionToken });
    await requireModule(ctx, tenant.tenantId, "ewallet");

    const sender = await getStudentRecord(ctx, tenant);
    if (!sender) {
      throw new Error("Student profile not found");
    }

    if (args.amountCents <= 0) {
      throw new Error("Amount must be positive");
    }

    const recipient = await ctx.db
      .query("students")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant.tenantId))
      .filter((q) => q.eq(q.field("admissionNumber"), args.recipientAdmissionNumber))
      .first();

    if (!recipient || !recipient.isActive) {
      throw new Error("Recipient student was not found");
    }

    if (recipient._id === sender._id) {
      throw new Error("You cannot send money to your own wallet");
    }

    const fromWallet = await ctx.db
      .query("wallets")
      .withIndex("by_owner", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("ownerId", sender._id)
      )
      .first();

    if (!fromWallet) {
      throw new Error("You do not have a wallet yet");
    }

    if (fromWallet.frozen) {
      throw new Error("Your wallet is frozen");
    }

    if (fromWallet.balanceCents < args.amountCents) {
      throw new Error("Insufficient wallet balance");
    }

    let recipientWallet = await ctx.db
      .query("wallets")
      .withIndex("by_owner", (q: any) =>
        q.eq("tenantId", tenant.tenantId).eq("ownerId", recipient._id)
      )
      .first();

    const now = Date.now();
    if (!recipientWallet) {
      const walletId = await ctx.db.insert("wallets", {
        tenantId: tenant.tenantId,
        ownerId: recipient._id,
        ownerType: "student",
        balanceCents: 0,
        currency: fromWallet.currency ?? "KES",
        createdAt: now,
        updatedAt: now,
      });
      recipientWallet = await ctx.db.get(walletId);
    }

    if (!recipientWallet) {
      throw new Error("Recipient wallet could not be created");
    }

    const reference = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    await ctx.db.insert("walletTransactions", {
      tenantId: tenant.tenantId,
      walletId: fromWallet._id,
      type: "transfer_out",
      amountCents: -args.amountCents,
      reference,
      toWalletId: recipientWallet._id.toString(),
      note: args.note,
      createdAt: now,
    });
    await ctx.db.insert("walletTransactions", {
      tenantId: tenant.tenantId,
      walletId: recipientWallet._id,
      type: "transfer_in",
      amountCents: args.amountCents,
      reference,
      toWalletId: fromWallet._id.toString(),
      note: args.note,
      createdAt: now,
    });

    await ctx.db.patch(fromWallet._id, {
      balanceCents: fromWallet.balanceCents - args.amountCents,
      updatedAt: now,
    });
    await ctx.db.patch(recipientWallet._id, {
      balanceCents: recipientWallet.balanceCents + args.amountCents,
      updatedAt: now,
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.initiated",
      entityType: "wallet",
      entityId: fromWallet._id.toString(),
      after: {
        type: "transfer",
        amountCents: args.amountCents,
        recipientAdmissionNumber: args.recipientAdmissionNumber,
        reference,
      },
    });

    return {
      success: true,
      reference,
      recipientName: `${recipient.firstName} ${recipient.lastName}`.trim(),
    };
  },
});
