"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../../_generated/api";

/** Map tenant country (code or name) → Stripe-accepted lowercase currency code */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  KE: "kes", KENYA: "kes",
  UG: "ugx", UGANDA: "ugx",
  TZ: "tzs", TANZANIA: "tzs",
  RW: "rwf", RWANDA: "rwf",
  ET: "etb", ETHIOPIA: "etb",
  GH: "ghs", GHANA: "ghs",
};

function resolveCurrency(country: string | undefined | null): string {
  if (!country) return "kes";
  return COUNTRY_TO_CURRENCY[country.trim().toUpperCase()] ?? "kes";
}

export async function createStripeCheckoutSessionForPayment(args: {
  amount: number;
  currency?: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  clientReferenceId: string;
  metadata?: Record<string, string>;
}): Promise<{ sessionId?: string; url?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe not configured. Set STRIPE_SECRET_KEY.");
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "payment_method_types[]": "card",
      "line_items[0][price_data][currency]": args.currency ?? "kes",
      "line_items[0][price_data][unit_amount]": String(Math.round(args.amount * 100)),
      "line_items[0][price_data][product_data][name]": args.description,
      "line_items[0][quantity]": "1",
      "mode": "payment",
      "success_url": args.successUrl,
      "cancel_url": args.cancelUrl,
      "client_reference_id": args.clientReferenceId,
      ...Object.fromEntries(
        Object.entries(args.metadata ?? {}).map(([key, value]) => [`metadata[${key}]`, value])
      ),
    }),
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Stripe API error: ${res.status}`);
  }

  const data = (await res.json()) as { id?: string; url?: string };
  return {
    sessionId: data.id,
    url: data.url,
  };
}

/**
 * Create a Stripe Checkout session for an invoice.
 * Returns the session URL to redirect the parent.
 * Currency is derived from the tenant's country setting.
 */
export const createCheckoutSession = action({
  args: {
    invoiceId: v.id("invoices"),
    successUrl: v.string(),
    cancelUrl: v.string(),
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

    // Resolve tenant country → Stripe currency code
    let tenantCountry: string | undefined;
    try {
      const tenantCtx = await ctx.runQuery(api.tenants.getTenantContext, {
        sessionToken: identity.tokenIdentifier,
      });
      tenantCountry = tenantCtx?.tenant?.country;
    } catch {
      // fall through
    }
    const currency = resolveCurrency(tenantCountry);

    const data = await createStripeCheckoutSessionForPayment({
      amount: invoice.amount,
      currency,
      description: `Fee payment - Invoice ${args.invoiceId}`,
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
      clientReferenceId: String(args.invoiceId),
      metadata: {
        tenantId: session.tenantId,
        invoiceId: String(args.invoiceId),
      },
    });
    if (data.sessionId) {
      await ctx.runMutation(internal.modules.finance.mutations.savePaymentCallback, {
        tenantId: session.tenantId,
        gateway: "stripe",
        externalId: data.sessionId,
        invoiceId: String(args.invoiceId),
        amount: invoice.amount,
        payload: {
          checkoutSessionId: data.sessionId,
          clientReferenceId: String(args.invoiceId),
        },
        status: "pending",
      });
    }
    return {
      sessionId: data.sessionId,
      url: data.url,
    };
  },
});
