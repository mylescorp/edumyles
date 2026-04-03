"use node";

import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { requireActionTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
const { createEmailService, EmailService } = require("../../../shared/src/lib/email");

async function sendEmailViaResend(args: {
  to: string[];
  subject: string;
  body?: string;
  html?: string;
  text?: string;
  template?: string;
  data?: unknown;
}) {
  const emailService = createEmailService();
  const { valid, invalid } = EmailService.validateEmails(args.to);
  if (invalid.length > 0) {
    throw new Error(`Invalid email addresses: ${invalid.join(", ")}`);
  }
  if (valid.length === 0) {
    throw new Error("No valid recipients");
  }

  let body = args.body ?? args.text ?? "";

  if (args.template && args.data) {
    switch (args.template) {
      case "fee_reminder":
        body = `Dear Parent, This is a reminder that fee payment of KES ${(args.data as { amount?: number })?.amount ?? "—"} is due. Please pay at your earliest convenience.`;
        break;
      case "exam_results":
        body = `Dear Parent, Exam results for ${(args.data as { term?: string })?.term ?? "the term"} are now available. Log in to the portal to view.`;
        break;
      case "attendance_alert":
        body = `Dear Parent, We noticed ${(args.data as { studentName?: string })?.studentName ?? "your child"} was marked absent today. Please contact the school if this is an error.`;
        break;
      case "payslip":
        body = `Your payslip for ${(args.data as { period?: string })?.period ?? "the period"} is ready. Log in to the staff portal to view.`;
        break;
      default:
        break;
    }
  }

  const result = await emailService.sendEmail({
    to: valid,
    subject: args.subject,
    html: args.html ?? body.replace(/\n/g, "<br/>"),
    text: args.text ?? body,
  });
  if (!result.success) {
    throw new Error(result.error ?? "Resend API error");
  }

  return { id: result.messageId, recipients: result.recipients };
}

/**
 * Send an email via Resend API.
 * Set RESEND_API_KEY in Convex env.
 * Templates: fee_reminder, exam_results, attendance_alert, payslip, or raw subject/body.
 */
export const sendEmail = action({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    body: v.optional(v.string()),
    html: v.optional(v.string()),
    text: v.optional(v.string()),
    template: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate and authorize
    const tenant = await requireActionTenantContext(ctx);
    requirePermission(tenant, "communications:write");

    const data = await sendEmailViaResend(args);

    // 2. Log action using internal mutation
    await ctx.runMutation(internal.helpers.auditLog.internalLogAction, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.email_sent",
      entityType: "email",
      entityId: data.id ?? "unknown",
      after: { to: args.to, subject: args.subject, template: args.template, recipients: data.recipients ?? [] },
    });

    return {
      success: true,
      id: data.id,
      messageId: data.id,
      recipients: data.recipients ?? [],
    };
  },
});

export const sendEmailInternal = internalAction({
  args: {
    tenantId: v.string(),
    actorId: v.string(),
    actorEmail: v.string(),
    to: v.array(v.string()),
    subject: v.string(),
    body: v.optional(v.string()),
    html: v.optional(v.string()),
    text: v.optional(v.string()),
    template: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const data = await sendEmailViaResend(args);

    await ctx.runMutation(internal.helpers.auditLog.internalLogAction, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      actorEmail: args.actorEmail,
      action: "communication.email_sent",
      entityType: "email",
      entityId: data.id ?? "unknown",
      after: { to: args.to, subject: args.subject, template: args.template, recipients: data.recipients ?? [] },
    });

    return {
      success: true,
      id: data.id,
      messageId: data.id,
      recipients: data.recipients ?? [],
    };
  },
});
