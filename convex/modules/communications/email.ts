import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { renderManagedEmailTemplate } from "../../emails/registry";

const { createEmailService, EmailService } = require("../../../shared/src/lib/email");

// SECURITY: These are system/server actions invoked behind the shared webhook secret
// from trusted backend routes, so they are exempt from requireTenantContext().
// Tenant isolation is enforced by the caller supplying the tenantId and by the
// downstream tenant-scoped query/mutation calls that use that tenantId.

type CampaignRecipient = {
  userId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function assertTrustedWebhook(webhookSecret: string) {
  if (!process.env.CONVEX_WEBHOOK_SECRET || webhookSecret !== process.env.CONVEX_WEBHOOK_SECRET) {
    throw new Error("Invalid webhook secret");
  }
}

function normalizeWebhookTimestamp(value?: string) {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
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
  handler: async (
    ctx,
    args
  ): Promise<{
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

      const managedTemplate = args.templateId
        ? renderManagedEmailTemplate(args.templateId, args.templateVariables ?? {})
        : null;

      const result = managedTemplate
        ? await emailService.sendEmail({
            to: valid,
            subject: managedTemplate.subject || args.subject,
            html: args.html ?? managedTemplate.html,
            text: args.text ?? managedTemplate.text,
          })
        : args.templateId
          ? await emailService.sendTemplateEmail(args.templateId, valid, args.templateVariables ?? {})
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

      await ctx.runMutation((internal as any).modules.communications.mutations.recordTransactionalEmailDispatch, {
        tenantId: args.tenantId,
        recipients: result.recipients ?? valid,
        subject: managedTemplate?.subject || args.subject,
        content:
          args.text ??
          managedTemplate?.text ??
          args.html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ??
          "",
        externalId: result.messageId,
        sentAt: Date.now(),
        status: "sent",
      });

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

export const handleResendWebhook = action({
  args: {
    webhookSecret: v.string(),
    eventType: v.string(),
    emailId: v.string(),
    recipientEmails: v.optional(v.array(v.string())),
    occurredAt: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx: any, args: {
    webhookSecret: string;
    eventType: string;
    emailId: string;
    recipientEmails?: string[];
    occurredAt?: string;
    errorMessage?: string;
  }): Promise<unknown> => {
    assertTrustedWebhook(args.webhookSecret);

    return await ctx.runMutation((internal as any).modules.communications.mutations.applyEmailWebhookEvent, {
      externalId: args.emailId,
      eventType: args.eventType,
      recipientEmails: args.recipientEmails,
      occurredAt: normalizeWebhookTimestamp(args.occurredAt),
      errorMessage: args.errorMessage,
    });
  },
});

export const sendBulkEmail = action({
  args: {
    webhookSecret: v.string(),
    tenantId: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    totalSent: number;
    totalFailed: number;
    errors: string[];
  }> => {
    assertTrustedWebhook(args.webhookSecret);
    const dispatch = await ctx.runQuery(
      (internal as any).modules.communications.queries.resolveCampaignDispatch,
      {
        tenantId: args.tenantId,
        campaignId: args.campaignId,
        channel: "email",
      }
    );

    if (!dispatch) {
      return {
        success: false,
        totalSent: 0,
        totalFailed: 0,
        errors: ["Campaign not found"],
      };
    }

    const emailService = createEmailService();
    const subject = dispatch.campaign.subject ?? dispatch.campaign.name;
    const records: Array<{
      recipientId: string;
      recipientEmail?: string;
      recipientPhone?: string;
      subject?: string;
      status: string;
      externalId?: string;
      errorMessage?: string;
      sentAt?: number;
      deliveredAt?: number;
    }> = [];
    const errors: string[] = [];

    const recipients = dispatch.recipients as CampaignRecipient[];
    const recipientsWithEmail = recipients.filter((recipient: CampaignRecipient) =>
      Boolean(recipient.email)
    );
    const recipientsWithoutEmail = recipients.filter(
      (recipient: CampaignRecipient) => !recipient.email
    );

    for (const recipient of recipientsWithoutEmail) {
      records.push({
        recipientId: recipient.userId,
        subject,
        status: "failed",
        errorMessage: "Recipient has no email address",
      });
    }

    for (const batch of chunk(recipientsWithEmail, 50)) {
      const emails = batch.map((recipient) => recipient.email!);
      const { valid, invalid } = EmailService.validateEmails(emails);

      for (const recipient of batch.filter(
        (item: CampaignRecipient) => item.email && invalid.includes(item.email)
      )) {
        records.push({
          recipientId: recipient.userId,
          recipientEmail: recipient.email,
          subject,
          status: "failed",
          errorMessage: "Invalid email address",
        });
      }

      const validRecipients = batch.filter(
        (item: CampaignRecipient) => item.email && valid.includes(item.email.toLowerCase())
      );
      if (validRecipients.length === 0) {
        continue;
      }

      const sentAt = Date.now();
      const result = await emailService.sendEmail({
        to: validRecipients.map((recipient) => recipient.email!),
        subject,
        html: dispatch.campaign.htmlContent ?? dispatch.campaign.message.replace(/\n/g, "<br/>"),
        text: dispatch.campaign.message,
      });

      if (!result.success) {
        const errorMessage = result.error ?? "Bulk email sending failed";
        errors.push(errorMessage);
        for (const recipient of validRecipients) {
          records.push({
            recipientId: recipient.userId,
            recipientEmail: recipient.email,
            subject,
            status: "failed",
            errorMessage,
            sentAt,
          });
        }
        continue;
      }

      for (const recipient of validRecipients) {
        records.push({
          recipientId: recipient.userId,
          recipientEmail: recipient.email,
          subject,
          status: "delivered",
          externalId: result.messageId,
          sentAt,
          deliveredAt: sentAt,
        });
      }
    }

    const persisted = await ctx.runMutation(
      (internal as any).modules.communications.mutations.finalizeCampaignChannelDispatch,
      {
        tenantId: args.tenantId,
        campaignId: args.campaignId,
        channel: "email",
        records,
      }
    );

    return {
      success: errors.length === 0 && persisted.failed === 0,
      totalSent: persisted.sent,
      totalFailed: persisted.failed,
      errors,
    };
  },
});
