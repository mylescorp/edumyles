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
  const convex = getConvexClient();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  let event: { type?: string; data?: { object?: { id?: string; payment_intent?: string } } };
  try {
    event = JSON.parse(body) as typeof event;
    if (stripeWebhookSecret && sig) {
      const crypto = await import("crypto");
      const [t, v] = sig.split(",").reduce(
        (acc, part) => {
          const [k, val] = part.split("=");
          if (k === "t") acc[0] = val || "";
          else if (k === "v1") acc[1] = val || "";
          return acc;
        },
        ["", ""] as string[]
      );
      if (t && v) {
        const payload = `${t}.${body}`;
        const hmac = crypto.createHmac("sha256", stripeWebhookSecret).update(payload).digest("hex");
        if (hmac !== v) {
          return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }
      }
    }
  } catch (e) {
    console.error("Stripe webhook parse/signature error:", e);
    return NextResponse.json({ error: "Invalid payload or signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const sessionId = event.data?.object?.id;
    const paymentIntent = event.data?.object?.payment_intent;
    const reference = typeof paymentIntent === "string" ? paymentIntent : undefined;
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session id" }, { status: 400 });
    }
    try {
      await convex.action(api.modules.finance.actions.recordPaymentFromGateway, {
        webhookSecret,
        gateway: "stripe",
        externalId: sessionId,
        resultCode: 0,
        reference,
      });
    } catch (e) {
      console.error("Stripe webhook process error:", e);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
