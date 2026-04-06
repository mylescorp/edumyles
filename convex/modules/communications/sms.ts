import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";

const { createSMSService, SMSService } = require("../../../shared/src/lib/sms");

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

type NormalizedSmsRecipient = CampaignRecipient & {
  normalizedPhone?: string;
};

type ProviderRecipient = {
  number: string;
  status: string;
  messageId: string;
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

export const sendSMS = action({
  args: {
    webhookSecret: v.string(),
    tenantId: v.string(),
    recipients: v.array(v.string()),
    message: v.string(),
    priority: v.optional(v.union(v.literal("High"), v.literal("Medium"), v.literal("Low"))),
    category: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    messageId?: string;
    recipientsSent?: number;
    recipientsFailed?: number;
    error?: string;
  }> => {
    try {
      assertTrustedWebhook(args.webhookSecret);
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
        recipientsFailed:
          result.recipients?.filter((recipient: any) => recipient.status !== "Success").length ?? 0,
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
        channel: "sms",
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

    const smsService = createSMSService();
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
    const recipientsWithPhone = recipients.filter((recipient: CampaignRecipient) =>
      Boolean(recipient.phone)
    );
    const recipientsWithoutPhone = recipients.filter(
      (recipient: CampaignRecipient) => !recipient.phone
    );

    for (const recipient of recipientsWithoutPhone) {
      records.push({
        recipientId: recipient.userId,
        status: "failed",
        errorMessage: "Recipient has no phone number",
      });
    }

    for (const batch of chunk(recipientsWithPhone, 50)) {
      const phones = batch.map((recipient) => recipient.phone!);
      const { valid, invalid } = SMSService.validatePhoneNumbers(phones);

      for (const recipient of batch.filter(
        (item: CampaignRecipient) => item.phone && invalid.includes(item.phone)
      )) {
        records.push({
          recipientId: recipient.userId,
          recipientPhone: recipient.phone,
          status: "failed",
          errorMessage: "Invalid phone number",
        });
      }

      const validRecipients = batch
        .map((recipient: CampaignRecipient): NormalizedSmsRecipient => {
          const validation = SMSService.validatePhoneNumbers([recipient.phone!]);
          return {
            ...recipient,
            normalizedPhone: validation.valid[0],
          };
        })
        .filter((recipient: NormalizedSmsRecipient) => Boolean(recipient.normalizedPhone));
      if (validRecipients.length === 0) {
        continue;
      }

      const sentAt = Date.now();
      const result = await smsService.sendSMS({
        to: validRecipients.map((recipient) => recipient.normalizedPhone!),
        message: dispatch.campaign.message,
        priority: "Medium",
        bulkSMSMode: 2,
      });

      if (!result.success) {
        const errorMessage = result.error ?? "Bulk SMS sending failed";
        errors.push(errorMessage);
        for (const recipient of validRecipients) {
          records.push({
            recipientId: recipient.userId,
            recipientPhone: recipient.phone,
            status: "failed",
            errorMessage,
            sentAt,
          });
        }
        continue;
      }

      const providerRecipients = new Map(
        ((result.recipients ?? []) as ProviderRecipient[]).map((recipient: ProviderRecipient) => [
          recipient.number,
          recipient,
        ])
      );

      for (const recipient of validRecipients) {
        const providerRecipient = providerRecipients.get(recipient.normalizedPhone!);
        const delivered = providerRecipient?.status === "Success";

        records.push({
          recipientId: recipient.userId,
          recipientPhone: recipient.normalizedPhone,
          status: delivered ? "delivered" : "failed",
          externalId: providerRecipient?.messageId ?? result.messageId,
          errorMessage: delivered ? undefined : (providerRecipient?.status ?? result.error),
          sentAt,
          deliveredAt: delivered ? sentAt : undefined,
        });
      }
    }

    const persisted = await ctx.runMutation(
      (internal as any).modules.communications.mutations.finalizeCampaignChannelDispatch,
      {
        tenantId: args.tenantId,
        campaignId: args.campaignId,
        channel: "sms",
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
