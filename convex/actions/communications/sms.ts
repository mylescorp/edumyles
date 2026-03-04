"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { requireActionTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";

/**
 * Send a single SMS via Africa's Talking API.
 * Set AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME in Convex env.
 */
export const sendSms = action({
  args: {
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate and authorize
    const tenant = await requireActionTenantContext(ctx);
    requirePermission(tenant, "communications:write");

    const apiKey = process.env.AFRICAS_TALKING_API_KEY;
    const username = process.env.AFRICAS_TALKING_USERNAME;
    if (!apiKey || !username) {
      throw new Error("Africa's Talking not configured. Set AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME.");
    }

    const phoneNorm = args.phone.replace(/\D/g, "").replace(/^0/, "254");
    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey,
      },
      body: new URLSearchParams({
        username,
        to: phoneNorm,
        message: args.message,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Africa's Talking SMS failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { SMSMessageData?: { Recipients?: unknown[] } };

    // 2. Log action using internal mutation
    await ctx.runMutation((ctx as any).internal.helpers.auditLog.internalLogAction, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.sms_sent",
      entityType: "sms",
      entityId: "single", // Africa's Talkng doesn't give a single ID per recipient in the standard response predictably
      after: { phone: phoneNorm, message: args.message, count: data.SMSMessageData?.Recipients?.length ?? 0 },
    });

    return { success: true, recipients: data.SMSMessageData?.Recipients?.length ?? 0 };
  },
});

/**
 * Send bulk SMS to multiple numbers using a template (message is same for all).
 */
export const sendBulkSms = action({
  args: {
    phones: v.array(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate and authorize
    const tenant = await requireActionTenantContext(ctx);
    requirePermission(tenant, "communications:write");

    const apiKey = process.env.AFRICAS_TALKING_API_KEY;
    const username = process.env.AFRICAS_TALKING_USERNAME;
    if (!apiKey || !username) {
      throw new Error("Africa's Talking not configured.");
    }

    const to = args.phones
      .map((p) => p.replace(/\D/g, "").replace(/^0/, "254"))
      .filter(Boolean)
      .join(",");
    if (!to) throw new Error("No valid phone numbers");

    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey,
      },
      body: new URLSearchParams({
        username,
        to,
        message: args.message,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Africa's Talking bulk SMS failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { SMSMessageData?: { Recipients?: unknown[] } };

    // 2. Log action using internal mutation
    await ctx.runMutation((ctx as any).internal.helpers.auditLog.internalLogAction, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.sms_sent",
      entityType: "sms",
      entityId: "bulk",
      after: { count: data.SMSMessageData?.Recipients?.length ?? 0, message: args.message },
    });

    return { success: true, count: data.SMSMessageData?.Recipients?.length ?? 0 };
  },
});
