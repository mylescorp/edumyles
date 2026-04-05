import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
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

function getWorkOSWebhookSecret() {
  const secret = process.env.WORKOS_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("WORKOS_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

function hexFromBuffer(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function computeHmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return hexFromBuffer(digest);
}

async function secureCompareHex(a: string, b: string) {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);

  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index]! ^ right[index]!;
  }

  return mismatch === 0;
}

async function verifyWorkOSSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceMs = 180_000
) {
  if (!signatureHeader) {
    return false;
  }

  const [timestampPart, signaturePart] = signatureHeader.split(",");
  const timestamp = timestampPart?.split("=")[1];
  const signature = signaturePart?.split("=")[1];

  if (!timestamp || !signature) {
    return false;
  }

  const timestampNumber = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(timestampNumber) || timestampNumber < Date.now() - toleranceMs) {
    return false;
  }

  const expected = await computeHmacHex(secret, `${timestamp}.${rawBody}`);
  return secureCompareHex(expected, signature);
}

// Safaricom production callback IP ranges (published by Safaricom)
const SAFARICOM_PRODUCTION_IPS = [
  "196.201.214.200",
  "196.201.214.206",
  "196.201.214.207",
  "196.201.214.208",
  "196.201.214.209",
  "196.201.214.210",
  "196.201.214.211",
  "196.201.214.212",
  "196.201.214.213",
  "196.201.214.214",
  "196.201.214.215",
  "196.201.214.216",
];

function isMpesaAllowedIp(req: Request): boolean {
  // Skip IP check in sandbox mode
  if (process.env.MPESA_ENVIRONMENT !== "production") {
    return true;
  }

  const allowedIps = process.env.MPESA_ALLOWED_IPS
    ? process.env.MPESA_ALLOWED_IPS.split(",").map((ip) => ip.trim()).filter(Boolean)
    : SAFARICOM_PRODUCTION_IPS;

  // Check standard forwarded headers (Convex / edge proxies)
  const forwarded =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";

  return allowedIps.includes(forwarded);
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

http.route({
  path: "/workos/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await req.text();
    const isValid = await verifyWorkOSSignature(
      rawBody,
      req.headers.get("workos-signature"),
      getWorkOSWebhookSecret()
    );

    if (!isValid) {
      return new Response("Invalid WorkOS signature", { status: 400 });
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      id?: string;
      updated_at?: string;
      data?: Record<string, unknown>;
    };

    if (!payload.event || !payload.id) {
      return new Response("Invalid WorkOS payload", { status: 400 });
    }

    await ctx.runMutation(internal.auth.authKitEvent, {
      event: payload.event,
      data: payload.data ?? {},
    });

    return new Response("OK", { status: 200 });
  }),
});

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
    if (!isMpesaAllowedIp(req)) {
      return new Response("Forbidden", { status: 403 });
    }

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
    // Validate shared secret if configured (Airtel does not publish IP ranges)
    const airtelSecret = process.env.AIRTEL_WEBHOOK_SECRET;
    if (airtelSecret) {
      const provided =
        req.headers.get("x-airtel-signature") ?? req.headers.get("x-webhook-secret");
      if (provided !== airtelSecret) {
        return new Response("Unauthorized", { status: 401 });
      }
    } else {
      console.warn("[payments/airtel] AIRTEL_WEBHOOK_SECRET is not set — callback accepted without validation");
    }

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
