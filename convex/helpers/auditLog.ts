import { MutationCtx } from "../_generated/server";

export type AuditAction =
  | "user.created" | "user.updated" | "user.deleted" | "user.login" | "user.logout"
  | "student.created" | "student.updated" | "student.deleted"
  | "payment.initiated" | "payment.completed" | "payment.failed"
  | "grade.entered" | "grade.updated"
  | "attendance.marked"
  | "payroll.processed" | "payroll.approved"
  | "impersonation.started" | "impersonation.ended"
  | "settings.updated"
  | "module.installed" | "module.uninstalled" | "module.config_updated" | "module.access_requested" | "module.status_toggled"
  | "tenant.created" | "tenant.suspended"
  | "admission.submitted" | "admission.status_updated" | "admission.enrolled"
  | "staff.created" | "staff.updated" | "staff.role_assigned"
  | "class.created" | "class.updated"
  | "alumni.profile_updated" | "alumni.transcript_requested" | "alumni.event_rsvp";

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
