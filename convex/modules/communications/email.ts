import { v } from "convex/values";
import { action } from "../../_generated/server";

const { createEmailService, EmailService } = require("../../../shared/src/lib/email");

function assertTrustedWebhook(webhookSecret: string) {
  if (!process.env.CONVEX_WEBHOOK_SECRET || webhookSecret !== process.env.CONVEX_WEBHOOK_SECRET) {
    throw new Error("Invalid webhook secret");
  }
}

export const sendEmail = action({
  args: {
    webhookSecret: v.string(),
    tenantId: v.string(),
    to: v.array(v.string()),
    subject: v.string(),
    html: v.optional(v.string()),
    text: v.optional(v.string()),
    templateId: v.optional(v.string()),
    templateVariables: v.optional(v.record(v.string(), v.any())),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    messageId?: string;
    recipients?: string[];
    error?: string;
  }> => {
    try {
      assertTrustedWebhook(args.webhookSecret);
      const emailService = createEmailService();
      const { valid, invalid } = EmailService.validateEmails(args.to);

      if (invalid.length > 0) {
        return {
          success: false,
          error: `Invalid email addresses: ${invalid.join(", ")}`,
        };
      }

      if (valid.length === 0) {
        return { success: false, error: "No valid recipients" };
      }

      const result = args.templateId
        ? await emailService.sendTemplateEmail(
            args.templateId,
            valid,
            args.templateVariables ?? {}
          )
        : await emailService.sendEmail({
            to: valid,
            subject: args.subject,
            html: args.html,
            text: args.text,
          });

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Email sending failed",
        };
      }

      return {
        success: true,
        messageId: result.messageId,
        recipients: result.recipients,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

export const sendBulkEmail = action({
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
    assertTrustedWebhook(args.webhookSecret);

    return {
      success: false,
      totalSent: 0,
      totalFailed: 0,
      errors: ["Bulk email dispatch is not enabled in this environment"],
    };
  },
});
