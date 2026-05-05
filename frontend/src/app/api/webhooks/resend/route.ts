import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { Resend } from "resend";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST(req: NextRequest) {
  const resendWebhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const convexWebhookSecret = process.env.CONVEX_WEBHOOK_SECRET;

  if (!resendWebhookSecret || !convexWebhookSecret) {
    return NextResponse.json({ error: "Webhook configuration is incomplete" }, { status: 500 });
  }

  const payload = await req.text();
  const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");

  let event: any;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret: resendWebhookSecret,
    });
  } catch (error) {
    console.error("[resend-webhook] Invalid signature:", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const eventType = String(event?.type ?? "");
  const emailId = String(event?.data?.email_id ?? "");
  if (!eventType || !emailId) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const handledEventTypes = new Set([
    "email.sent",
    "email.delivered",
    "email.opened",
    "email.clicked",
    "email.bounced",
    "email.complained",
    "email.failed",
    "email.suppressed",
    "email.delivery_delayed",
  ]);

  if (!handledEventTypes.has(eventType)) {
    return NextResponse.json({ received: true, ignored: true, type: eventType });
  }

  const convex = getConvexClient();
  const errorMessage =
    event?.data?.bounce?.message ??
    event?.data?.failed?.message ??
    event?.data?.suppression?.message ??
    (eventType === "email.complained" ? "Recipient marked the message as spam." : undefined);

  try {
    await convex.action((api as any)["modules/communications/email"].handleResendWebhook, {
      webhookSecret: convexWebhookSecret,
      eventType,
      emailId,
      recipientEmails: Array.isArray(event?.data?.to) ? event.data.to : undefined,
      occurredAt: event?.created_at,
      errorMessage,
    });
  } catch (error) {
    console.error("[resend-webhook] Failed to persist event:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }

  return NextResponse.json({ received: true, type: eventType, emailId });
}
