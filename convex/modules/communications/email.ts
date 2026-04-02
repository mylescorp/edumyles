import { v } from "convex/values";
import { action, internalMutation, mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";
import { logAction } from "../../helpers/auditLog";

// Import email service from shared lib
const { createEmailService, EmailService } = require("../../../shared/src/lib/email");

/**
 * Send email to single or multiple recipients
 */
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
    category: v.optional(v.string()), // announcements, fees, reminders, etc.
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    messageId?: string;
    recipients?: string[];
    error?: string;
  }> => {
    // For email actions, we'll use a simpler auth approach
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.tenantId))
      .first();

    if (!session) {
      return { success: false, error: "Invalid session" };
    }

    try {
      const emailService = createEmailService();
      
      // Validate email addresses
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

      let result;
      
      if (args.templateId) {
        // Send using template
        result = await emailService.sendTemplateEmail(
          args.templateId,
          valid,
          args.templateVariables || {}
        );
      } else {
        // Send regular email
        result = await emailService.sendEmail({
          to: valid,
          subject: args.subject,
          html: args.html,
          text: args.text,
        });
      }

      // Log email sending attempt
      await ctx.runMutation(internal.modules.communications.mutations.logEmailSending, {
        tenantId: session.tenantId,
        userId: session.userId,
        recipients: valid,
        subject: args.subject,
        category: args.category || "general",
        templateId: args.templateId,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
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
      console.error("Email action failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Send bulk email campaign
 */
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

      const emailService = createEmailService();
      const emails = recipients.map(recipient => ({
        to: [recipient.email],
        subject: campaign.subject,
        html: campaign.htmlContent,
        text: campaign.textContent,
        templateId: campaign.templateId,
        templateVariables: recipient.templateVariables || {},
      }));

      const results = await Promise.allSettled(
        emails.map(email => 
          email.templateId 
            ? emailService.sendTemplateEmail(email.templateId, email.to, email.templateVariables)
            : emailService.sendEmail(email)
        )
      );

      let totalSent = 0;
      let totalFailed = 0;
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          totalSent += result.value.recipients?.length || 0;
        } else {
          totalFailed++;
          const errorMsg = result.status === 'rejected' 
            ? result.reason 
            : `Email ${index + 1} failed`;
          errors.push(errorMsg);
        }
      });

      // Update campaign status
      await ctx.runMutation(internal.modules.communications.mutations.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: totalFailed === 0 ? "sent" : "partial",
        sentCount: totalSent,
        failedCount: totalFailed,
      });

      // Log bulk email sending
      await ctx.runMutation(internal.modules.communications.mutations.logBulkEmailSending, {
        tenantId: session.tenantId,
        userId: session.userId,
        campaignId: args.campaignId,
        totalRecipients: recipients.length,
        totalSent,
        totalFailed,
        success: totalFailed === 0,
        errors,
      });

      return {
        success: totalFailed === 0,
        totalSent,
        totalFailed,
        errors,
      };
    } catch (error) {
      console.error("Bulk email action failed:", error);
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
export const logEmailSending = internalMutation({
  args: {
    tenantId: v.string(),
    userId: v.string(),
    recipients: v.array(v.string()),
    subject: v.string(),
    category: v.string(),
    templateId: v.optional(v.string()),
    success: v.boolean(),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailLogs", {
      tenantId: args.tenantId,
      userId: args.userId,
      recipients: args.recipients,
      subject: args.subject,
      category: args.category,
      templateId: args.templateId,
      messageId: args.messageId,
      status: args.success ? "sent" : "failed",
      error: args.error,
      sentAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const logBulkEmailSending = internalMutation({
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
    await ctx.db.insert("bulkEmailLogs", {
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
