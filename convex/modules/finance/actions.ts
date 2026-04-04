"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";

// Import M-Pesa and Airtel services from shared lib
const { createMpesaService, MpesaService } = require("../../../shared/src/lib/mpesa");
const { createAirtelService, AirtelService } = require("../../../shared/src/lib/airtel");

function requireWebhookSecret(provided: string) {
  const expectedSecret = process.env.CONVEX_WEBHOOK_SECRET;
  if (!expectedSecret || provided !== expectedSecret) {
    throw new Error("Unauthorized: invalid webhook secret");
  }
}

const paymentGatewayValidator = v.union(
  v.literal("mpesa"),
  v.literal("airtel"),
  v.literal("stripe"),
  v.literal("bank_transfer")
);

const paymentStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("refunded")
);

// Used by Next.js server routes to store pending callbacks before gateway confirmation.
export const savePaymentCallbackFromServer: any = action({
  args: {
    webhookSecret: v.string(),
    tenantId: v.string(),
    gateway: paymentGatewayValidator,
    externalId: v.string(),
    invoiceId: v.string(),
    amount: v.number(),
    status: paymentStatusValidator,
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

// Initiate M-Pesa STK Push payment
export const initiateMpesaPayment: any = action({
  args: {
    webhookSecret: v.string(),
    tenantId: v.string(),
    invoiceId: v.string(),
    phoneNumber: v.string(),
    amount: v.number(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    checkoutRequestID?: string;
    merchantRequestID?: string;
    customerMessage?: string;
    error?: string;
  }> => {
    requireWebhookSecret(args.webhookSecret);

    try {
      const mpesaService = createMpesaService();

      // Validate and format phone number
      const formattedPhone = MpesaService.validatePhoneNumber(args.phoneNumber);

      // Store pending callback first
      const callbackId = await ctx.runMutation(
        internal.modules.finance.mutations.savePaymentCallback,
        {
          tenantId: args.tenantId,
          gateway: "mpesa",
          externalId: "pending",
          invoiceId: args.invoiceId,
          amount: args.amount,
          status: "pending",
        }
      );

      // Initiate STK Push
      const response = await mpesaService.initiateStkPush({
        phoneNumber: formattedPhone,
        amount: args.amount,
        accountReference: args.invoiceId,
        transactionDesc: `School Fee Payment - Invoice ${args.invoiceId}`,
      });

      // Update the callback record with the actual CheckoutRequestID
      await ctx.runMutation(internal.modules.finance.mutations.updatePaymentCallbackExternalId, {
        callbackId,
        externalId: response.CheckoutRequestID,
      });

      return {
        success: response.ResponseCode === "0",
        checkoutRequestID: response.CheckoutRequestID,
        merchantRequestID: response.MerchantRequestID,
        customerMessage: response.CustomerMessage,
        error: response.ResponseCode !== "0" ? response.ResponseDescription : undefined,
      };
    } catch (error) {
      console.error("M-Pesa STK Push failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

// Initiate Airtel Money payment
export const initiateAirtelPayment: any = action({
  args: {
    webhookSecret: v.string(),
    tenantId: v.string(),
    invoiceId: v.string(),
    phoneNumber: v.string(),
    amount: v.number(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    transactionId?: string;
    status?: string;
    message?: string;
    error?: string;
  }> => {
    requireWebhookSecret(args.webhookSecret);

    try {
      // Validate phone number is Airtel
      if (!AirtelService.isAirtelNumber(args.phoneNumber)) {
        return {
          success: false,
          error: "Phone number is not on Airtel network",
        };
      }

      const airtelService = createAirtelService();

      // Validate and format phone number
      const formattedPhone = AirtelService.validatePhoneNumber(args.phoneNumber);

      // Generate unique transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Store pending callback first
      await ctx.runMutation(internal.modules.finance.mutations.savePaymentCallback, {
        tenantId: args.tenantId,
        gateway: "airtel",
        externalId: transactionId,
        invoiceId: args.invoiceId,
        amount: args.amount,
        status: "pending",
      });

      // Initiate payment
      const response = await airtelService.initiatePayment({
        phoneNumber: formattedPhone,
        amount: args.amount,
        transactionId,
        description: `School Fee Payment - Invoice ${args.invoiceId}`,
      });

      return {
        success: response.status.response_code === "TS_00",
        transactionId: response.transaction?.id,
        status: response.transaction?.transaction_status,
        message: response.status.response_message,
        error:
          response.status.response_code !== "TS_00" ? response.status.response_message : undefined,
      };
    } catch (error) {
      console.error("Airtel Money payment failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

// Called from Next.js webhook routes with shared secret; reconciles gateway callback and records payment.
export const recordPaymentFromGateway: any = action({
  args: {
    webhookSecret: v.string(),
    gateway: paymentGatewayValidator,
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
