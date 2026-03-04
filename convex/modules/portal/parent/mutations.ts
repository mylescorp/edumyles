import { v } from "convex/values";
import { mutation } from "../../../_generated/server";
import { requireTenantContext } from "../../../helpers/tenantGuard";
import { requirePermission } from "../../../helpers/authorize";
import { requireModule } from "../../../helpers/moduleGuard";
import { logAction } from "../../../helpers/auditLog";

// Reuse the helper from queries via a local definition to avoid circular imports.
async function resolveParentChildren(ctx: any, tenant: any) {
  const guardians = await ctx.db
    .query("guardians")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
    .filter((q: any) => q.eq(q.field("userId"), tenant.userId))
    .collect();

  const guardianStudentIds = new Set<string>();
  for (const g of guardians) {
    for (const sid of g.studentIds) guardianStudentIds.add(sid);
  }

  const allStudents = await ctx.db
    .query("students")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
    .collect();

  return allStudents.filter(
    (s: any) =>
      s.guardianUserId === tenant.userId ||
      guardianStudentIds.has(s._id.toString())
  );
}

export const initiatePayment = mutation({
  args: {
    invoiceId: v.string(),
    method: v.string(), // mpesa | card | bank_transfer | cash | etc.
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "finance");
    requirePermission(tenant, "finance:read");

    const invoice = await ctx.db.get(args.invoiceId as any);
    if (!invoice || (invoice as any).tenantId !== tenant.tenantId) {
      throw new Error("Invoice not found");
    }

    // Ensure this invoice belongs to one of the parent's children
    const children = await resolveParentChildren(ctx, tenant);
    const allowedIds = new Set(children.map((c: any) => c._id.toString()));

    if (!allowedIds.has((invoice as any).studentId)) {
      throw new Error("FORBIDDEN: Invoice not linked to your child");
    }

    // For now we simply log the intent; M-Pesa/Stripe are initiated client-side in demo flows.
    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.initiated",
      entityType: "invoice",
      entityId: args.invoiceId as any,
      after: {
        method: args.method,
      },
    });

    return {
      success: true,
      invoiceId: args.invoiceId,
      method: args.method,
    };
  },
});

export const sendMessage = mutation({
  args: {
    recipientUserId: v.optional(v.string()),
    recipientRole: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requirePermission(tenant, "students:read");

    let recipientUserId = args.recipientUserId;

    if (!recipientUserId && args.recipientRole) {
      const targetUser = await ctx.db
        .query("users")
        .withIndex("by_tenant_role", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("role", args.recipientRole!)
        )
        .first();

      if (!targetUser) {
        throw new Error("Recipient not found for given role");
      }

      recipientUserId = targetUser._id.toString();
    }

    if (!recipientUserId) {
      throw new Error("Missing recipient");
    }

    const notificationId = await ctx.db.insert("notifications", {
      tenantId: tenant.tenantId,
      userId: recipientUserId,
      title: "New message from parent",
      message: args.message,
      type: "message",
      isRead: false,
      link: undefined,
      createdAt: Date.now(),
    });

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "message.sent",
      entityType: "notification",
      entityId: notificationId,
      after: {
        recipientUserId,
        recipientRole: args.recipientRole,
      },
    });

    return {
      success: true,
      notificationId,
    };
  },
});


