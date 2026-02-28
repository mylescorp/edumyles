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
  | "module.installed" | "module.uninstalled"
  | "tenant.created" | "tenant.suspended";

export async function logAction(
  ctx: MutationCtx,
  params: {
    tenantId: string;
    userId: string;
    action: AuditAction;
    targetId?: string;
    targetType?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }
): Promise<void> {
  await ctx.db.insert("auditLogs", {
    tenantId: params.tenantId,
    userId: params.userId,
    action: params.action,
    targetId: params.targetId,
    targetType: params.targetType,
    details: params.details ?? {},
    ipAddress: params.ipAddress,
    createdAt: Date.now(),
  });
}

export async function logImpersonation(
  ctx: MutationCtx,
  params: {
    adminId: string;
    targetUserId: string;
    tenantId: string;
    action: "impersonation.started" | "impersonation.ended";
  }
): Promise<void> {
  await logAction(ctx, {
    tenantId: params.tenantId,
    userId: params.adminId,
    action: params.action,
    targetId: params.targetUserId,
    targetType: "user",
    details: { impersonated: params.targetUserId },
  });
}
