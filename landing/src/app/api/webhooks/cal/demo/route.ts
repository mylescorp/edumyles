import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getLandingConvexClient } from "@/lib/server/convex";

function verifyCalSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

function normalizeBookingPayload(payload: any) {
  const wrapperPayload = payload?.payload ?? payload ?? {};
  const attendee =
    wrapperPayload?.attendees?.[0] ??
    (wrapperPayload?.responses?.email
      ? {
          email:
            typeof wrapperPayload.responses.email === "string"
              ? wrapperPayload.responses.email
              : wrapperPayload.responses.email?.value,
          name:
            typeof wrapperPayload.responses.name === "string"
              ? wrapperPayload.responses.name
              : wrapperPayload.responses.name?.value,
          notes:
            typeof wrapperPayload.responses.notes === "string"
              ? wrapperPayload.responses.notes
              : wrapperPayload.responses.notes?.value,
        }
      : undefined);

  const firstReference = wrapperPayload?.references?.[0];

  return {
    triggerEvent: payload?.triggerEvent ?? wrapperPayload?.triggerEvent,
    createdAt: payload?.createdAt,
    bookingUid: wrapperPayload?.bookingUid ?? wrapperPayload?.uid,
    bookingId: wrapperPayload?.bookingId ?? wrapperPayload?.id,
    startTime: wrapperPayload?.startTime ?? payload?.startTime,
    endTime: wrapperPayload?.endTime ?? payload?.endTime,
    meetingUrl:
      firstReference?.meetingUrl ??
      wrapperPayload?.location ??
      wrapperPayload?.metadata?.meetingUrl,
    eventTypeTitle: wrapperPayload?.eventTypeTitle ?? wrapperPayload?.title,
    attendeeName: attendee?.name,
    attendeeEmail: attendee?.email,
    attendeeNotes:
      attendee?.notes ??
      (typeof wrapperPayload?.responses?.notes === "string"
        ? wrapperPayload.responses.notes
        : wrapperPayload?.responses?.notes?.value),
    rawPayload: payload,
  };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  try {
    const secret = process.env.CALCOM_WEBHOOK_SECRET?.trim();
    const signature = request.headers.get("x-cal-signature-256");

    if (secret && !verifyCalSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const parsed = JSON.parse(rawBody);
    const normalized = normalizeBookingPayload(parsed);

    if (!normalized.triggerEvent || !normalized.attendeeEmail) {
      return NextResponse.json({ ignored: true, reason: "Missing attendee email or trigger event" });
    }

    const convex = getLandingConvexClient();
    const result = await convex.mutation(
      api.modules.platform.demoRequests.ingestCalendarBookingWebhook,
      normalized
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[landing/api/webhooks/cal/demo] Failed to process webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
