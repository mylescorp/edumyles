"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../../_generated/api";

const DARAJA_BASE = process.env.MPESA_ENVIRONMENT === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";
const DARAJA_OAUTH = `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`;
const DARAJA_STK_PUSH = `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`;

export async function initiateMpesaStkPushForAmount(args: {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}): Promise<{
  checkoutRequestId: string;
  customerMessage?: string;
}> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY ?? process.env.CONVEX_MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET ?? process.env.CONVEX_MPESA_CONSUMER_SECRET;
  const passkey = process.env.MPESA_PASSKEY ?? process.env.CONVEX_MPESA_PASSKEY;
  const shortcode = process.env.MPESA_SHORTCODE ?? process.env.CONVEX_MPESA_SHORTCODE;
  const callbackUrl = process.env.MPESA_CALLBACK_URL ?? process.env.CONVEX_MPESA_CALLBACK_URL;

  if (!consumerKey || !consumerSecret || !passkey || !shortcode || !callbackUrl) {
    throw new Error("M-Pesa configuration missing. Set MPESA_* env vars.");
  }

  const authRes = await fetch(DARAJA_OAUTH, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
    },
  });
  if (!authRes.ok) {
    const text = await authRes.text();
    throw new Error(`M-Pesa OAuth failed: ${authRes.status} ${text}`);
  }
  const authJson = (await authRes.json()) as { access_token?: string };
  const accessToken = authJson.access_token;
  if (!accessToken) throw new Error("M-Pesa OAuth: no access_token");

  const timestamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const phoneNorm = args.phone.replace(/\D/g, "").replace(/^0/, "254");

  const stkBody = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(args.amount),
    PartyA: phoneNorm,
    PartyB: shortcode,
    PhoneNumber: phoneNorm,
    CallBackURL: callbackUrl,
    AccountReference: args.accountReference,
    TransactionDesc: args.transactionDesc,
  };

  const stkRes = await fetch(DARAJA_STK_PUSH, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(stkBody),
  });

  const stkJson = (await stkRes.json()) as {
    CheckoutRequestID?: string;
    CustomerMessage?: string;
    errorMessage?: string;
  };

  if (!stkRes.ok) {
    throw new Error(stkJson.errorMessage ?? `STK push failed: ${stkRes.status}`);
  }

  const checkoutRequestId = stkJson.CheckoutRequestID;
  if (!checkoutRequestId) {
    throw new Error(stkJson.errorMessage ?? "No CheckoutRequestID in response");
  }

  return {
    checkoutRequestId,
    customerMessage: stkJson.CustomerMessage,
  };
}

export const initiateStkPush = action({
  args: {
    invoiceId: v.id("invoices"),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHENTICATED");
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET ?? "";

    const session = await ctx.runQuery(api.sessions.getSession, {
      sessionToken: identity.tokenIdentifier,
      serverSecret,
    });
    if (!session) throw new Error("UNAUTHENTICATED: Session not found");

    const invoice = await ctx.runQuery(api.modules.finance.queries.getInvoice, {
      invoiceId: args.invoiceId,
    });
    if (!invoice || invoice.tenantId !== session.tenantId) {
      throw new Error("Invoice not found");
    }
    if (invoice.status !== "pending" && invoice.status !== "partially_paid") {
      throw new Error("Invoice not eligible for payment");
    }

    const stkResponse = await initiateMpesaStkPushForAmount({
      phone: args.phone,
      amount: invoice.amount,
      accountReference: `INV-${args.invoiceId}`,
      transactionDesc: "EduMyles fee payment",
    });

    await ctx.runMutation(internal.modules.finance.mutations.savePaymentCallback, {
      tenantId: session.tenantId,
      gateway: "mpesa",
      externalId: stkResponse.checkoutRequestId,
      invoiceId: String(args.invoiceId),
      amount: invoice.amount,
      status: "pending",
    });

    return {
      success: true,
      checkoutRequestId: stkResponse.checkoutRequestId,
      customerMessage: stkResponse.customerMessage,
      message: "Enter your M-Pesa PIN on your phone to complete the payment.",
    };
  },
});
