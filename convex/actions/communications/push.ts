"use node";

import { internal } from "../../_generated/api";
import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { requireActionTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: "default";
  data?: Record<string, unknown>;
};

type ExpoPushTicket = {
  status?: "ok" | "error";
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
};

type PushRecipient = {
  userId: string;
  pushToken: string;
  platform?: string;
  deviceName?: string;
};

type SendPushResult = {
  success: boolean;
  sent: number;
  failed: number;
  tickets?: ExpoPushTicket[];
  message?: string;
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function sendExpoBatch(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(messages),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: ExpoPushTicket[];
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok) {
    throw new Error(
      payload.errors?.[0]?.message ??
        `Expo push request failed with status ${response.status}`
    );
  }

  return payload.data ?? [];
}

/**
 * Public action: send push notifications to specified users (or all users in tenant).
 * Requires communications:broadcast permission.
 */
export const sendPush = action({
  args: {
    sessionToken: v.string(),
    userIds: v.optional(v.array(v.string())),
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<SendPushResult> => {
    const tenant = await requireActionTenantContext(ctx);
    requirePermission(tenant, "communications:broadcast");

    // Fetch push tokens — scope to specific users or entire tenant
    const allTokens: PushRecipient[] = await ctx.runQuery(
      internal.modules.communications.queries.listPushTokensInternal,
      { tenantId: tenant.tenantId }
    );

    const recipients: PushRecipient[] = allTokens.filter(
      (token) => !args.userIds || args.userIds.includes(token.userId)
    );

    if (recipients.length === 0) {
      return { success: true, sent: 0, failed: 0, message: "No registered devices found" };
    }

    return await ctx.runAction(internal.actions.communications.push.sendPushInternal, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      recipients,
      title: args.title,
      body: args.body,
      link: args.link,
      metadata: args.metadata,
    });
  },
});

export const sendPushInternal = internalAction({
  args: {
    tenantId: v.string(),
    actorId: v.string(),
    actorEmail: v.string(),
    recipients: v.array(
      v.object({
        userId: v.string(),
        pushToken: v.string(),
        platform: v.optional(v.string()),
        deviceName: v.optional(v.string()),
      })
    ),
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    tickets: ExpoPushTicket[];
  }> => {
    if (args.recipients.length === 0) {
      return { success: true, sent: 0, failed: 0, tickets: [] };
    }

    const messages = args.recipients.map<ExpoPushMessage>((recipient) => ({
      to: recipient.pushToken,
      title: args.title,
      body: args.body,
      sound: "default",
      data: {
        tenantId: args.tenantId,
        userId: recipient.userId,
        ...(args.link ? { link: args.link } : {}),
        ...(args.metadata && typeof args.metadata === "object" ? args.metadata : {}),
      },
    }));

    const tickets: ExpoPushTicket[] = [];
    for (const batch of chunk(messages, 100)) {
      tickets.push(...(await sendExpoBatch(batch)));
    }

    const sent = tickets.filter((ticket) => ticket.status === "ok").length;
    const failed = tickets.length - sent;

    await ctx.runMutation(internal.helpers.auditLog.internalLogAction, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      actorEmail: args.actorEmail,
      action: "communication.push_sent",
      entityType: "push",
      entityId: `push-${Date.now()}`,
      after: {
        recipientCount: args.recipients.length,
        sent,
        failed,
        title: args.title,
        link: args.link,
      },
    });

    return {
      success: failed === 0,
      sent,
      failed,
      tickets,
    };
  },
});
