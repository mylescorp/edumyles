import { v } from "convex/values";
import { action, mutation } from "../../../_generated/server";
import { api, internal } from "../../../_generated/api";
import { requireActionTenantContext, requireTenantContext } from "../../../helpers/tenantGuard";
import { requirePermission } from "../../../helpers/authorize";
import { logAction } from "../../../helpers/auditLog";
import { getChildren as _unused } from "./queries"; // for type linkage only

// Reuse the helper from queries via a local definition to avoid circular imports
async function resolveParentChildren(ctx: any, tenant: any) {
  const guardians = await ctx.db
    .query("guardians")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
    .filter((q: any) => q.eq(q.field("userId"), tenant.userId))
    .collect();

  const guardianStudentIds = new Set<string>();
  for (const g of guardians) {
    for (const sid of g.studentIds) {
      guardianStudentIds.add(sid);
    }
  }

  const allStudents = await ctx.db
    .query("students")
    .withIndex("by_tenant", (q: any) => q.eq("tenantId", tenant.tenantId))
    .collect();

  const children = allStudents.filter(
    (s: any) => s.guardianUserId === tenant.userId || guardianStudentIds.has(s._id.toString())
  );

  return children;
}

async function getParentRecord(ctx: any, tenant: any) {
  const guardian = await ctx.db
    .query("guardians")
    .withIndex("by_user", (q: any) => q.eq("userId", tenant.userId))
    .filter((q: any) => q.eq(q.field("tenantId"), tenant.tenantId))
    .first();
  if (!guardian || !guardian.isActive) return null;
  return guardian;
}

export const updateParentProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    occupation: v.optional(v.string()),
    employer: v.optional(v.string()),
    workPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    requirePermission(tenant, "students:read");

    const guardian = await getParentRecord(ctx, tenant);
    if (!guardian) throw new Error("Parent profile not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.occupation !== undefined) updates.occupation = args.occupation;
    if (args.employer !== undefined) updates.employer = args.employer;
    if (args.workPhone !== undefined) updates.workPhone = args.workPhone;

    await ctx.db.patch(guardian._id, updates);

    await logAction(ctx, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "user.updated",
      entityType: "guardian",
      entityId: guardian._id.toString(),
      after: updates,
    });

    return { success: true };
  },
});

export const initiatePayment = action({
  args: {
    invoiceId: v.string(),
    method: v.union(
      v.literal("mpesa"),
      v.literal("airtel"),
      v.literal("card"),
      v.literal("bank_transfer")
    ),
    phoneNumber: v.optional(v.string()),
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await requireActionTenantContext(ctx);
    requirePermission(tenant, "finance:read");

    const invoice = await ctx.runQuery(api.modules.finance.queries.getInvoice, {
      invoiceId: args.invoiceId as any,
    });
    if (!invoice || (invoice as any).tenantId !== tenant.tenantId) {
      throw new Error("Invoice not found");
    }

    // Ensure this invoice belongs to one of the parent's children
    const children = (await ctx.runQuery(
      api.modules.portal.parent.queries.getChildren,
      {}
    )) as any[];
    const allowedIds = new Set(children.map((c: any) => c._id.toString()));

    if (!allowedIds.has((invoice as any).studentId)) {
      throw new Error("FORBIDDEN: Invoice not linked to your child");
    }

    const now = Date.now();
    let result: Record<string, unknown>;

    switch (args.method) {
      case "mpesa": {
        if (!args.phoneNumber?.trim()) {
          throw new Error("Phone number is required for M-Pesa payments");
        }

        result = await ctx.runAction((api as any)["actions/payments/mpesa"].initiateStkPush, {
          invoiceId: args.invoiceId as any,
          phone: args.phoneNumber.trim(),
        });
        break;
      }
      case "airtel": {
        if (!args.phoneNumber?.trim()) {
          throw new Error("Phone number is required for Airtel Money payments");
        }

        const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
        if (!serverSecret) {
          throw new Error("Payment server configuration is incomplete");
        }

        result = await ctx.runAction(
          (api as any)["actions/payments/airtel"].initiateAirtelPayment,
          {
            webhookSecret: serverSecret,
            tenantId: tenant.tenantId,
            invoiceId: args.invoiceId,
            phoneNumber: args.phoneNumber.trim(),
            amount: (invoice as any).amount,
          }
        );
        break;
      }
      case "card": {
        if (!args.successUrl || !args.cancelUrl) {
          throw new Error("successUrl and cancelUrl are required for card payments");
        }

        result = await ctx.runAction(
          (api as any)["actions/payments/stripe"].createCheckoutSession,
          {
            invoiceId: args.invoiceId as any,
            successUrl: args.successUrl,
            cancelUrl: args.cancelUrl,
          }
        );
        break;
      }
      case "bank_transfer": {
        result = await ctx.runAction(
          (api as any)["actions/payments/bankTransfer"].initiateBankTransfer,
          {
            invoiceId: args.invoiceId as any,
          }
        );
        break;
      }
    }

    await ctx.runMutation(internal.helpers.auditLog.internalLogAction, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "payment.initiated",
      entityType: "invoice",
      entityId: args.invoiceId as any,
      after: {
        method: args.method,
        initiatedAt: now,
      },
    });

    return {
      success: true,
      invoiceId: args.invoiceId,
      method: args.method,
      result,
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
