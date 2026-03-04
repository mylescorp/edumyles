"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../../_generated/api";

/**
 * Create a Stripe Checkout session for an invoice.
 * Returns the session URL to redirect the parent.
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

    const session = await ctx.runQuery(api.sessions.getSession, {
      sessionToken: identity.tokenIdentifier,
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
        "line_items[0][price_data][currency]": "kes",
        "line_items[0][price_data][unit_amount]": String(Math.round(invoice.amount * 100)), // Stripe expects minor units (KES cents)
        "line_items[0][price_data][product_data][name]": `Fee payment - Invoice ${args.invoiceId}`,
        "line_items[0][quantity]": "1",
        "mode": "payment",
        "success_url": args.successUrl,
        "cancel_url": args.cancelUrl,
        "client_reference_id": String(args.invoiceId),
        "metadata[tenantId]": session.tenantId,
        "metadata[invoiceId]": String(args.invoiceId),
      }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `Stripe API error: ${res.status}`);
    }

    const data = (await res.json()) as { id?: string; url?: string };
    if (data.id) {
      await ctx.runMutation(internal.modules.finance.mutations.savePaymentCallback, {
        tenantId: session.tenantId,
        gateway: "stripe",
        externalId: data.id,
        invoiceId: String(args.invoiceId),
        amount: invoice.amount,
        status: "pending",
      });
    }
    return {
      sessionId: data.id,
      url: data.url,
    };
  },
});
