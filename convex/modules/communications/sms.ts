import { v } from "convex/values";
import { action } from "../../_generated/server";
import { api } from "../../_generated/api";

const { createSMSService, SMSService } = require("../../../shared/src/lib/sms");

async function getActiveSession(ctx: any, sessionToken: string) {
  return await ctx.runQuery(api.sessions.getSession, { sessionToken });
}

export const sendSMS = action({
  args: {
    webhookSecret: v.string(),
    tenantId: v.string(),
    recipients: v.array(v.string()),
    message: v.string(),
    priority: v.optional(v.union(v.literal("High"), v.literal("Medium"), v.literal("Low"))),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    messageId?: string;
    recipientsSent?: number;
    recipientsFailed?: number;
    error?: string;
  }> => {
    const session = await getActiveSession(ctx, args.tenantId);
    if (!session) {
      return { success: false, error: "Invalid session" };
    }

    try {
      const smsService = createSMSService();
      const { valid, invalid } = SMSService.validatePhoneNumbers(args.recipients);

      if (invalid.length > 0) {
        return {
          success: false,
          error: `Invalid phone numbers: ${invalid.join(", ")}`,
        };
      }

      if (valid.length === 0) {
        return { success: false, error: "No valid recipients" };
      }

      const result = await smsService.sendSMS({
        to: valid,
        message: args.message,
        priority: args.priority ?? "Medium",
        bulkSMSMode: args.category === "promotional" ? 1 : 2,
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || "SMS sending failed",
        };
      }

      return {
        success: true,
        messageId: result.messageId,
        recipientsSent: result.recipients?.length ?? valid.length,
        recipientsFailed: result.recipients?.filter((recipient: any) => recipient.status !== "Success").length ?? 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

export const sendBulkSMS = action({
  args: {
    webhookSecret: v.string(),
    tenantId: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    totalSent: number;
    totalFailed: number;
    errors: string[];
  }> => {
    const session = await getActiveSession(ctx, args.tenantId);
    if (!session) {
      return { success: false, totalSent: 0, totalFailed: 0, errors: ["Invalid session"] };
    }

    return {
      success: false,
      totalSent: 0,
      totalFailed: 0,
      errors: ["Bulk SMS dispatch is not enabled in this environment"],
    };
  },
});
