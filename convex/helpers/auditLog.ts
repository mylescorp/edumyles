import { MutationCtx, internalMutation } from "../_generated/server";
import { v } from "convex/values";

export type AuditAction =
  | "user.created" | "user.updated" | "user.deleted" | "user.login" | "user.logout"
  | "student.created" | "student.updated" | "student.deleted" | "student.graduated" | "student.enrolled"
  | "payment.initiated" | "payment.completed" | "payment.failed" | "payment.recorded" | "payment.bulk_invoices" | "payment.status_updated"
  | "grade.entered" | "grade.updated"
  | "attendance.marked"
  | "payroll.processed" | "payroll.approved"
  | "impersonation.started" | "impersonation.ended"
  | "settings.updated"
  | "module.installed" | "module.uninstalled" | "module.config_updated" | "module.access_requested" | "module.status_toggled"
  | "tenant.created" | "tenant.suspended" | "tenant.activated"
  | "admission.submitted" | "admission.status_updated" | "admission.enrolled"
  | "staff.created" | "staff.updated" | "staff.role_assigned"
  | "class.created" | "class.updated"
  | "assignment.submitted" | "assignment.graded"
  | "communication.email_sent" | "communication.sms_sent"
  | "platform_message.created" | "platform_message.updated" | "platform_message.deleted" | "platform_message.sent"
  | "platform_notification.created"
  | "alumni.profile_updated" | "alumni.transcript_requested" | "alumni.event_rsvp"
  | "timetable.slot_created" | "timetable.slot_updated" | "timetable.slot_deleted" | "timetable.substitute_assigned"
  | "message.sent"
  | "marketplace.listing_created" | "marketplace.listing_updated" | "marketplace.listing_deleted" | "marketplace.listing_published" | "marketplace.listing_unpublished"
  | "marketplace.order_placed" | "marketplace.order_shipped" | "marketplace.order_delivered" | "marketplace.order_cancelled"
  | "marketplace.category_created" | "marketplace.category_updated"
  | "marketplace.featured_updated"
  | "marketplace.dispute_filed" | "marketplace.dispute_resolved"
  | "marketplace.review_submitted" | "marketplace.review_moderated"
  | "marketplace.publisher_registered" | "marketplace.publisher_verified"
  | "marketplace.module_suspended" | "marketplace.module_deprecated" | "marketplace.module_installed" | "marketplace.module_uninstalled"
  | "marketplace.module_submitted" | "marketplace.module_approved" | "marketplace.module_rejected" | "marketplace.module_published";

export async function logAction(
  ctx: MutationCtx,
  params: {
    tenantId: string;
    actorId: string;
    actorEmail: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    before?: any;
    after?: any;
  }
): Promise<void> {
  await ctx.db.insert("auditLogs", {
    tenantId: params.tenantId,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    before: params.before,
    after: params.after,
    timestamp: Date.now(),
  });
}

/** Internal mutation to log actions from Convex actions */
export const internalLogAction = internalMutation({
  args: {
    tenantId: v.string(),
    actorId: v.string(),
    actorEmail: v.string(),
    action: v.string(), // Use string to avoid strict type issues across internal calls if needed, but we cast to AuditAction
    entityType: v.string(),
    entityId: v.string(),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await logAction(ctx, args as any);
  },
});

export async function logImpersonation(
  ctx: MutationCtx,
  params: {
    adminId: string;
    adminEmail: string;
    targetUserId: string;
    tenantId: string;
    action: "impersonation.started" | "impersonation.ended";
  }
): Promise<void> {
  await logAction(ctx, {
    tenantId: params.tenantId,
    actorId: params.adminId,
    actorEmail: params.adminEmail,
    action: params.action,
    entityType: "user",
    entityId: params.targetUserId,
    after: { impersonated: params.targetUserId },
  });
}
