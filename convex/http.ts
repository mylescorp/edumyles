import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { authKit } from "./auth";
import { MpesaService, type MpesaCallback } from "../shared/src/lib/mpesa";
import { AirtelService, type AirtelCallback } from "../shared/src/lib/airtel";

const http = httpRouter();

function getWebhookSecret() {
  const secret = process.env.CONVEX_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("CONVEX_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

function hexFromBuffer(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyStripeSignature(rawBody: string, signatureHeader: string | null) {
  const signingSecret =
    process.env.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

  if (!signingSecret) {
    return true;
  }
  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`)
  );
  const expected = hexFromBuffer(digest);

  return signatures.includes(expected);
}

// Register WorkOS webhook routes:
//  POST /workos/webhook  — receives user.created / user.updated / user.deleted events
authKit.registerRoutes(http);

/**
 * GET /security/blocked-ips
 * Returns the list of currently-active blocked IP addresses (platform-wide).
 * Used by Next.js middleware for edge-level IP blocking enforcement.
 * Response is cache-friendly (60 s) to keep Convex read counts low.
 */
http.route({
  path: "/security/blocked-ips",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const now = Date.now();
    const ips: string[] = await ctx.runQuery(
      internal.platform.security.queries.listAllBlockedIPsInternal,
      { now }
    );

    return new Response(JSON.stringify({ ips, cachedAt: now }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

http.route({
  path: "/payments/mpesa/callback",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const payload = (await req.json()) as MpesaCallback;
    const parsed = MpesaService.parseCallback(payload);

    await ctx.runAction((api as any)["modules/finance/actions"].recordPaymentFromGateway, {
      webhookSecret: getWebhookSecret(),
      gateway: "mpesa",
      externalId: parsed.checkoutRequestID,
      resultCode: parsed.success ? 0 : 1,
      reference: parsed.mpesaReceiptNumber,
    });

    return Response.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }),
});

http.route({
  path: "/payments/airtel/callback",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const payload = (await req.json()) as AirtelCallback;
    const parsed = AirtelService.parseCallback(payload);

    await ctx.runAction((api as any)["modules/finance/actions"].recordPaymentFromGateway, {
      webhookSecret: getWebhookSecret(),
      gateway: "airtel",
      externalId: parsed.transactionId,
      resultCode: parsed.success ? 0 : 1,
      reference: parsed.referenceId,
    });

    return Response.json({
      success: true,
      status: "accepted",
    });
  }),
});

http.route({
  path: "/payments/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await req.text();
    const isValid = await verifyStripeSignature(rawBody, req.headers.get("stripe-signature"));
    if (!isValid) {
      return new Response("Invalid Stripe signature", { status: 400 });
    }

    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: {
        object?: {
          id?: string;
          payment_intent?: string;
          payment_status?: string;
        };
      };
    };

    const object = event.data?.object;
    if (!event.type || !object?.id) {
      return new Response("Invalid Stripe payload", { status: 400 });
    }

    const handledTypes = new Set([
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed",
      "checkout.session.expired",
    ]);

    if (!handledTypes.has(event.type)) {
      return Response.json({ received: true, ignored: true, type: event.type });
    }

    const successTypes = new Set([
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ]);
    const isSuccess = successTypes.has(event.type) && object.payment_status !== "unpaid";

    await ctx.runAction((api as any)["modules/finance/actions"].recordPaymentFromGateway, {
      webhookSecret: getWebhookSecret(),
      gateway: "stripe",
      externalId: object.id,
      resultCode: isSuccess ? 0 : 1,
      reference: object.payment_intent ?? object.id,
    });

    return Response.json({ received: true, processed: true, type: event.type });
  }),
});

export default http;
