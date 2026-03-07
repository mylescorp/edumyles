import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";

/**
 * Minimal WorkOS webhook handler.
 * Verifies WorkOS signature and acknowledges supported events.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.WORKOS_WEBHOOK_SECRET;
  const signatureHeader = req.headers.get("workos-signature");
  const payloadText = await req.text();

  if (!webhookSecret || !signatureHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let eventType = "";
  try {
    const workos = new WorkOS(process.env.WORKOS_API_KEY ?? "");
    const event = await workos.webhooks.constructEvent({
      payload: JSON.parse(payloadText) as Record<string, unknown>,
      sigHeader: signatureHeader,
      secret: webhookSecret,
    });
    eventType = String((event as any).event ?? "");
  } catch (error) {
    console.error("Invalid WorkOS webhook signature:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!eventType) {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }

  // TODO: Add event-specific sync logic (user.updated, organization.membership.updated, etc.)
  console.info("WorkOS webhook received", eventType);
  return NextResponse.json({ received: true, type: eventType });
}
