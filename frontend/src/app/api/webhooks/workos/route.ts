import { NextRequest, NextResponse } from "next/server";

/**
 * Minimal WorkOS webhook handler.
 * Requires a shared secret header and acknowledges supported events.
 */
export async function POST(req: NextRequest) {
  const expectedSecret = process.env.WORKOS_WEBHOOK_SECRET;
  const providedSecret =
    req.headers.get("x-webhook-secret") ??
    req.headers.get("x-workos-webhook-secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const eventType = String((body as any).type ?? "");

  if (!eventType) {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }

  // TODO: Add event-specific sync logic (user.updated, organization.membership.updated, etc.)
  console.info("WorkOS webhook received", eventType);
  return NextResponse.json({ received: true, type: eventType });
}
