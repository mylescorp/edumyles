import type { MutationCtx } from "../../_generated/server";

export type PlatformNotificationKind =
  | "invite"
  | "rbac"
  | "crm"
  | "pm"
  | "security"
  | "billing"
  | "waitlist"
  | "system";

export async function createPlatformNotificationRecord(
  ctx: MutationCtx,
  params: {
    userId: string;
    title: string;
    body: string;
    type: PlatformNotificationKind;
    actionUrl?: string;
    metadata?: any;
  }
) {
  return await ctx.db.insert("platform_notifications", {
    userId: params.userId,
    title: params.title,
    body: params.body,
    type: params.type,
    actionUrl: params.actionUrl,
    metadata: params.metadata,
    isRead: false,
    createdAt: Date.now(),
  });
}
