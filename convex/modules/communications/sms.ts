import { v } from "convex/values";
import { action, internalMutation, mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

// Import SMS service from shared lib
const { createSMSService, SMSService } = require("../../../shared/src/lib/sms");

/**
 * Send SMS to single or multiple recipients
 */
export const sendSMS = action({
  args: {
    webhookSecret: v.string(),
    tenantId: v.string(),
    recipients: v.array(v.string()),
    message: v.string(),
    priority: v.optional(v.union(v.literal("High"), v.literal("Medium"), v.literal("Low"))),
    category: v.optional(v.string()), // announcements, fees, reminders, etc.
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    messageId?: string;
    recipientsSent?: number;
    recipientsFailed?: number;
    error?: string;
  }> => {
    // For SMS actions, we'll use a simpler auth approach
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.tenantId))
      .first();

    if (!session) {
      return { success: false, error: "Invalid session" };
    }

    try {
      const smsService = createSMSService();
      
      // Validate phone numbers
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

      // Send SMS
      const result = await smsService.sendSMS({
        to: valid,
        message: args.message,
        priority: args.priority || "Medium",
        bulkSMSMode: args.category === "promotional" ? 1 : 2,
      });

      // Log SMS sending attempt
      await ctx.runMutation(internal.modules.communications.mutations.logSMSSending, {
        tenantId: session.tenantId,
        userId: session.userId,
        recipients: valid,
        message: args.message,
        category: args.category || "general",
        success: result.success,
        messageId: result.messageId,
        error: result.error,
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
        recipientsSent: result.recipients?.length || 0,
        recipientsFailed: result.recipients?.filter(r => r.status !== 'Success').length || 0,
      };
    } catch (error) {
      console.error("SMS action failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Send bulk SMS campaign
 */
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
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.tenantId))
      .first();

    if (!session) {
      return { success: false, errors: ["Invalid session"] };
    }

    try {
      // Get campaign details
      const campaign = await ctx.db.get(args.campaignId);
      if (!campaign || campaign.tenantId !== session.tenantId) {
        return { success: false, errors: ["Campaign not found"] };
      }

      // Get campaign recipients
      const recipients = await ctx.db
        .query("campaignRecipients")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
        .collect();

      if (recipients.length === 0) {
        return { success: false, errors: ["No recipients found"] };
      }

      const smsService = createSMSService();
      const messages = recipients.map(recipient => ({
        to: [recipient.phoneNumber],
        message: campaign.message,
        priority: campaign.priority as any,
        bulkSMSMode: campaign.type === "promotional" ? 1 : 2,
      }));

      const result = await smsService.sendBulkSMS(messages);

      // Update campaign status
      await ctx.runMutation(internal.modules.communications.mutations.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: result.success ? "sent" : "failed",
        sentCount: result.totalSent,
        failedCount: result.totalFailed,
      });

      // Log bulk SMS sending
      await ctx.runMutation(internal.modules.communications.mutations.logBulkSMSSending, {
        tenantId: session.tenantId,
        userId: session.userId,
        campaignId: args.campaignId,
        totalRecipients: recipients.length,
        totalSent: result.totalSent,
        totalFailed: result.totalFailed,
        success: result.success,
        errors: result.errors,
      });

      return result;
    } catch (error) {
      console.error("Bulk SMS action failed:", error);
      return {
        success: false,
        totalSent: 0,
        totalFailed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error occurred"],
      };
    }
  },
});

// Internal mutations for logging
export const logSMSSending = internalMutation({
  args: {
    tenantId: v.string(),
    userId: v.string(),
    recipients: v.array(v.string()),
    message: v.string(),
    category: v.string(),
    success: v.boolean(),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("smsLogs", {
      tenantId: args.tenantId,
      userId: args.userId,
      recipients: args.recipients,
      message: args.message,
      category: args.category,
      messageId: args.messageId,
      status: args.success ? "sent" : "failed",
      error: args.error,
      sentAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const logBulkSMSSending = internalMutation({
  args: {
    tenantId: v.string(),
    userId: v.string(),
    campaignId: v.id("campaigns"),
    totalRecipients: v.number(),
    totalSent: v.number(),
    totalFailed: v.number(),
    success: v.boolean(),
    errors: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("bulkSmsLogs", {
      tenantId: args.tenantId,
      userId: args.userId,
      campaignId: args.campaignId,
      totalRecipients: args.totalRecipients,
      totalSent: args.totalSent,
      totalFailed: args.totalFailed,
      errors: args.errors,
      status: args.success ? "completed" : "failed",
      completedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const updateCampaignStatus = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    status: v.string(),
    sentCount: v.optional(v.number()),
    failedCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "sent") {
      updateData.sentAt = Date.now();
    }

    if (args.sentCount !== undefined) {
      updateData.sentCount = args.sentCount;
    }

    if (args.failedCount !== undefined) {
      updateData.failedCount = args.failedCount;
    }

    await ctx.db.patch(args.campaignId, updateData);
  },
});
