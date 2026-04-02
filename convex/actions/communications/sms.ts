"use node";

import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { requireActionTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { normalisePhoneNumber } from "../../helpers/phoneUtils";

/**
 * Resolve the tenant's country from the DB so phone numbers are normalised correctly.
 * Falls back to "KE" if the tenant record is unavailable.
 */
async function getTenantCountry(ctx: any, tenantId: string): Promise<string> {
  try {
    // Use runQuery to access the DB from within an action
    const tenant = await ctx.runQuery(
      (ctx as any).internal.tenants.getTenantByIdInternal,
      { tenantId }
    );
    if (tenant?.country) return tenant.country as string;
  } catch {
    // fall through to default
  }
  return "KE";
}

async function sendSmsViaAfricasTalking(args: {
  phone: string;
  message: string;
  country?: string;
}) {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME;
  if (!apiKey || !username) {
    throw new Error("Africa's Talking not configured. Set AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME.");
  }

  const phoneNorm = normalisePhoneNumber(args.phone, args.country ?? "KE");

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
  return {
    phoneNorm,
    count: data.SMSMessageData?.Recipients?.length ?? 0,
  };
}

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

    const country = await getTenantCountry(ctx, tenant.tenantId);
    const data = await sendSmsViaAfricasTalking({
      phone: args.phone,
      message: args.message,
      country,
    });

    // 2. Audit log
    await ctx.runMutation(internal.helpers.auditLog.internalLogAction, {
      tenantId: tenant.tenantId,
      actorId: tenant.userId,
      actorEmail: tenant.email,
      action: "communication.sms_sent",
      entityType: "sms",
      entityId: "single",
      after: { phone: data.phoneNorm, message: args.message, count: data.count },
    });

    return { success: true, recipients: data.count };
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

    const country = await getTenantCountry(ctx, tenant.tenantId);
    const to = args.phones
      .map((p) => normalisePhoneNumber(p, country))
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

    // 2. Audit log
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

export const sendSmsInternal = internalAction({
  args: {
    tenantId: v.string(),
    actorId: v.string(),
    actorEmail: v.string(),
    phone: v.string(),
    message: v.string(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const data = await sendSmsViaAfricasTalking(args);

    await ctx.runMutation(internal.helpers.auditLog.internalLogAction, {
      tenantId: args.tenantId,
      actorId: args.actorId,
      actorEmail: args.actorEmail,
      action: "communication.sms_sent",
      entityType: "sms",
      entityId: "single",
      after: { phone: data.phoneNorm, message: args.message, count: data.count },
    });

    return { success: true, recipients: data.count };
  },
});
