"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";

function requireWebhookSecret(provided: string) {
  const expectedSecret = process.env.CONVEX_WEBHOOK_SECRET;
  if (!expectedSecret || provided !== expectedSecret) {
    throw new Error("Unauthorized: invalid webhook secret");
  }
}

// Used by Next.js server routes to store pending callbacks before gateway confirmation.
export const savePaymentCallbackFromServer: any = action({
  args: {
    webhookSecret: v.string(),
    tenantId: v.string(),
    gateway: v.string(),
    externalId: v.string(),
    invoiceId: v.string(),
    amount: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    requireWebhookSecret(args.webhookSecret);
    await ctx.runMutation(internal.modules.finance.mutations.savePaymentCallback, {
      tenantId: args.tenantId,
      gateway: args.gateway,
      externalId: args.externalId,
      invoiceId: args.invoiceId,
      amount: args.amount,
      status: args.status,
    });
  },
});

// Called from Next.js webhook routes with shared secret; reconciles gateway callback and records payment.
export const recordPaymentFromGateway: any = action({
  args: {
    webhookSecret: v.string(),
    gateway: v.string(),
    externalId: v.string(),
    resultCode: v.number(), // 0 = success for M-Pesa
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<unknown> => {
    requireWebhookSecret(args.webhookSecret);
    return await ctx.runMutation(
      internal.modules.finance.mutations.recordPaymentFromGatewayInternal,
      {
        gateway: args.gateway,
        externalId: args.externalId,
        resultCode: args.resultCode,
        reference: args.reference,
      }
    );
  },
});
