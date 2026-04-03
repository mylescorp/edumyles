import { MutationCtx, internalMutation } from "../_generated/server";
import { v } from "convex/values";

export type AuditAction =
  | "user.created" | "user.updated" | "user.deleted" | "user.login" | "user.logout"
  | "user.invited"
  | "file.created" | "file.deleted"
  | "student.created" | "student.updated" | "student.deleted" | "student.graduated" | "student.enrolled"
  | "payment.initiated" | "payment.completed" | "payment.failed" | "payment.recorded" | "payment.bulk_invoices" | "payment.status_updated" | "payment.verified"
  | "grade.entered" | "grade.updated"
  | "attendance.marked"
  | "payroll.processed" | "payroll.approved"
  | "impersonation.started" | "impersonation.ended"
  | "settings.updated"
  | "module.installed" | "module.uninstalled" | "module.config_updated" | "module.access_requested" | "module.status_toggled"
  | "tenant.created" | "tenant.suspended" | "tenant.activated" | "tenant.updated"
  | "admission.submitted" | "admission.status_updated" | "admission.enrolled"
  | "staff.created" | "staff.updated" | "staff.role_assigned"
  | "class.created" | "class.updated"
  | "assignment.submitted" | "assignment.graded"
  | "communication.email_sent" | "communication.sms_sent" | "communication.push_sent" | "communication.inapp_sent"
  | "communication.announcement_created" | "communication.announcement_updated" | "communication.announcement_published" | "communication.announcement_deleted"
  | "communication.template_created" | "communication.template_updated" | "communication.template_deleted"
  | "communication.campaign_created" | "communication.campaign_updated" | "communication.campaign_deleted" | "communication.campaign_sent"
  | "communication.conversation_created" | "communication.broadcast_sent"
  | "communication.segment_created" | "communication.segment_updated" | "communication.segment_deleted"
  | "platform_message.created" | "platform_message.updated" | "platform_message.deleted" | "platform_message.sent"
  | "platform_notification.created"
  | "api_key.created" | "api_key.revoked" | "api_key.rotated"
  | "changelog.created" | "changelog.updated" | "changelog.deleted"
  | "sla.created" | "sla.updated" | "sla.deleted"
  | "white_label.updated" | "white_label.reset"
  | "workflow.created" | "workflow.executed" | "workflow.cancelled" | "workflow.status_updated" | "workflow.template_created" | "workflow.scheduled"
  | "tenant_health_score.created" | "tenant_health_score.updated"
  | "success_initiative.created" | "success_initiative.updated"
  | "success_metric.created" | "success_metric.recorded"
  | "support.ticket.created" | "support.ticket.updated" | "support.ticket.escalated" | "support.ai_response.generated" | "support.ai_insights.generated" | "support.knowledge_base.created"
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
  | "marketplace.publisher_activated" | "marketplace.publisher_suspended"
  | "marketplace.module_suspended" | "marketplace.module_deprecated" | "marketplace.module_installed" | "marketplace.module_uninstalled"
  | "marketplace.module_submitted" | "marketplace.module_updated" | "marketplace.module_approved" | "marketplace.module_rejected" | "marketplace.module_published"
  | "automation.workflow_created" | "automation.workflow_updated" | "automation.workflow_deleted" | "automation.workflow_toggled" | "automation.workflow_executed"
  | "feature_flag.created" | "feature_flag.updated" | "feature_flag.toggled" | "feature_flag.deleted"
  | "data_export.created" | "data_export.generated"
  | "role.created" | "role.updated" | "role.deleted" | "role.duplicated"
  | "permission_group.created"
  | "report.created" | "report.updated" | "report.deleted" | "report.executed"
  | "reportcard.generated"
  | "security.threat_created" | "security.threat_updated" | "security.ip_blocked" | "security.ip_unblocked" | "security.incident_created" | "security.incident_updated" | "security.vulnerability_scan"
  | "webhook.created" | "webhook.updated" | "webhook.deleted" | "webhook.tested" | "webhook.retried"
  | "integration.installed" | "integration.uninstalled" | "integration.configured" | "integration.activated" | "integration.tested" | "integration.synced"
  | "knowledge_base.article_created" | "knowledge_base.article_updated" | "knowledge_base.article_deleted" | "knowledge_base.article_published" | "knowledge_base.category_created" | "knowledge_base.category_updated"
  | "onboarding.started" | "onboarding.step_completed" | "onboarding.step_skipped" | "onboarding.reset"
  | "ticket.created" | "ticket.updated" | "ticket.comment_added" | "ticket.resolved" | "ticket.escalated" | "ticket.assigned"
  | "book.created" | "book.updated" | "book.borrowed" | "book.returned"
  | "transport.route_created" | "transport.route_updated" | "transport.vehicle_created" | "transport.vehicle_driver_assigned" | "transport.driver_created" | "transport.assignment_updated"
  | "ecommerce.product_created" | "ecommerce.product_updated" | "ecommerce.cart_updated" | "ecommerce.order_created" | "ecommerce.order_updated"
  | "tenant_success.score_created" | "tenant_success.score_updated" | "tenant_success.initiative_created" | "tenant_success.initiative_updated" | "tenant_success.metric_created" | "tenant_success.metric_recorded" | "tenant_success.report_generated"
  | "staff_performance.record_created" | "staff_performance.record_updated" | "staff_performance.goals_set" | "staff_performance.review_completed"
  | "file.uploaded" | "file.deleted"
  | "notification.created"
  | "operations.incident_created" | "operations.incident_updated" | "operations.incident_resolved"
  | "operations.maintenance_window_created" | "operations.maintenance_window_updated" | "operations.alert_created"
  | "scheduled_report.created" | "scheduled_report.updated" | "scheduled_report.deleted" | "scheduled_report.executed"
  | "onboarding.initialized" | "onboarding.completed"
  | "analytics.report_generated" | "analytics.report_exported"
  | "crm.deal_created" | "crm.deal_updated" | "crm.lead_created" | "crm.lead_updated" | "crm.activity_added" | "crm.proposal_created" | "crm.proposal_updated" | "crm.proposal_sent"
  | "billing.invoice.created" | "billing.invoice.status_updated" | "billing.subscription_updated"
  | "subscription.updated" | "subscription.cancelled"
  | "waitlist.approved" | "waitlist.rejected"
  | "mobile.device_token_registered";

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
