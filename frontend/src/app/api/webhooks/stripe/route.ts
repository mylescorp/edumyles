import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST(req: NextRequest) {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeWebhookSecret) {
    return new NextResponse("STRIPE_WEBHOOK_SECRET is not configured", { status: 500 });
  }

  const convex = getConvexClient();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (sig && stripeSecretKey) {
      const stripe = new Stripe(stripeSecretKey);
      event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (e) {
    console.error("Stripe webhook parse/signature error:", e);
    return NextResponse.json({ error: "Invalid payload or signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    const paymentIntent = session.payment_intent;
    const paymentIntentId =
      typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
    const reference = paymentIntentId;
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session id" }, { status: 400 });
    }
    try {
      await convex.action((api as any)["modules/finance/actions"].recordPaymentFromGateway, {
        webhookSecret,
        gateway: "stripe",
        externalId: sessionId,
        checkoutSessionId: sessionId,
        paymentIntentId,
        resultCode: 0,
        reference,
      });
    } catch (e) {
      console.error("Stripe webhook process error:", e);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  // Checkout flows are finalized by checkout.session.completed. Only handle
  // direct-charge payment intents here when invoice metadata is present.
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    if (!paymentIntent.id) {
      return NextResponse.json({ error: "Missing payment intent id" }, { status: 400 });
    }
    const metadataInvoiceId = paymentIntent.metadata?.invoiceId;
    const metadataTenantId = paymentIntent.metadata?.tenantId;
    if (!metadataInvoiceId || !metadataTenantId) {
      return NextResponse.json({
        received: true,
        ignored: "checkout session flow is reconciled on checkout.session.completed",
      });
    }
    try {
      await convex.action((api as any)["modules/finance/actions"].savePaymentCallbackFromServer, {
        webhookSecret,
        tenantId: metadataTenantId,
        gateway: "stripe",
        externalId: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        invoiceId: metadataInvoiceId,
        amount: (paymentIntent.amount_received || paymentIntent.amount || 0) / 100,
        status: "pending",
      });
      await convex.action((api as any)["modules/finance/actions"].recordPaymentFromGateway, {
        webhookSecret,
        gateway: "stripe",
        externalId: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        resultCode: 0,
        reference: paymentIntent.id,
      });
    } catch (e) {
      console.error("Stripe payment intent webhook error:", e);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  // Handle payment failures
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data?.object;
    if (!paymentIntent?.id) {
      return NextResponse.json({ error: "Missing payment intent id" }, { status: 400 });
    }
    try {
      await convex.action((api as any)["modules/finance/actions"].recordPaymentFromGateway, {
        webhookSecret,
        gateway: "stripe",
        externalId: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        resultCode: 1, // Failed
        reference: paymentIntent.id,
      });
    } catch (e) {
      console.error("Stripe payment failed webhook error:", e);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
