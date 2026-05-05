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

type CalWebhookPayload = Record<string, unknown>;

function normalizeBookingPayload(payload: CalWebhookPayload) {
  const wrapperPayload = isRecord(payload.payload) ? payload.payload : payload;
  const responses = isRecord(wrapperPayload.responses) ? wrapperPayload.responses : {};
  const metadata = isRecord(wrapperPayload.metadata) ? wrapperPayload.metadata : {};
  const attendeeFromList = Array.isArray(wrapperPayload.attendees)
    ? wrapperPayload.attendees.find(isRecord)
    : undefined;
  const attendee =
    attendeeFromList ??
    (responses.email
      ? {
          email: responseValue(responses.email),
          name: responseValue(responses.name),
          notes: responseValue(responses.notes),
        }
      : undefined);

  const firstReference = Array.isArray(wrapperPayload.references)
    ? wrapperPayload.references.find(isRecord)
    : undefined;

  return {
    triggerEvent: stringValue(payload.triggerEvent) ?? stringValue(wrapperPayload.triggerEvent),
    createdAt: stringValue(payload.createdAt),
    bookingUid: stringValue(wrapperPayload.bookingUid) ?? stringValue(wrapperPayload.uid),
    bookingId:
      stringValue(wrapperPayload.bookingId) ??
      numberValue(wrapperPayload.bookingId) ??
      stringValue(wrapperPayload.id) ??
      numberValue(wrapperPayload.id),
    startTime: stringValue(wrapperPayload.startTime) ?? stringValue(payload.startTime),
    endTime: stringValue(wrapperPayload.endTime) ?? stringValue(payload.endTime),
    meetingUrl:
      stringValue(firstReference?.meetingUrl) ??
      stringValue(wrapperPayload.location) ??
      stringValue(metadata.meetingUrl),
    eventTypeTitle: stringValue(wrapperPayload.eventTypeTitle) ?? stringValue(wrapperPayload.title),
    demoRequestId:
      stringValue(metadata.demoRequestId) ??
      stringValue(metadata.demo_request_id) ??
      stringValue(isRecord(payload.metadata) ? payload.metadata.demoRequestId : undefined),
    attendeeName: isRecord(attendee) ? stringValue(attendee.name) : undefined,
    attendeeEmail: isRecord(attendee) ? stringValue(attendee.email) : undefined,
    attendeeNotes:
      (isRecord(attendee) ? stringValue(attendee.notes) : undefined) ?? responseValue(responses.notes),
    rawPayload: payload,
  };
}

function isRecord(value: unknown): value is CalWebhookPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function responseValue(value: unknown) {
  if (typeof value === "string") return value;
  if (isRecord(value) && typeof value.value === "string") return value.value;
  return undefined;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  try {
    const secret = process.env.CALCOM_WEBHOOK_SECRET?.trim();
    const signature = request.headers.get("x-cal-signature-256");

    if (!secret && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Cal.com webhook secret is not configured" }, { status: 500 });
    }

    if (secret && !verifyCalSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const parsed = JSON.parse(rawBody);
    const normalized = normalizeBookingPayload(parsed);

    if (!normalized.triggerEvent || !normalized.attendeeEmail) {
      return NextResponse.json({ ignored: true, reason: "Missing attendee email or trigger event" });
    }

    const bookingUpdate = {
      ...normalized,
      triggerEvent: normalized.triggerEvent,
      attendeeEmail: normalized.attendeeEmail,
    };

    const convex = getLandingConvexClient();
    const result = await convex.mutation(
      api.modules.platform.demoRequests.ingestCalendarBookingWebhook,
      bookingUpdate
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[landing/api/webhooks/cal/demo] Failed to process webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
