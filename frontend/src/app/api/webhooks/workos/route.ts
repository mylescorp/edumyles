import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.WORKOS_WEBHOOK_SECRET;
  const signatureHeader = req.headers.get("workos-signature");
  const payloadText = await req.text();

  if (!webhookSecret || !signatureHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: any;
  try {
    const workos = new WorkOS(process.env.WORKOS_API_KEY ?? "");
    event = await workos.webhooks.constructEvent({
      payload: JSON.parse(payloadText) as Record<string, unknown>,
      sigHeader: signatureHeader,
      secret: webhookSecret,
    });
  } catch (error) {
    console.error("[workos-webhook] Invalid signature:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType: string = String(event?.event ?? "");
  if (!eventType) {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }

  console.info("[workos-webhook] Received event:", eventType);

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("[workos-webhook] NEXT_PUBLIC_CONVEX_URL not set — skipping sync");
    return NextResponse.json({ received: true, type: eventType, synced: false });
  }

  const convex = new ConvexHttpClient(convexUrl);

  try {
    switch (eventType) {
      case "user.updated": {
        const data = event?.data ?? {};
        const eduMylesUserId: string = data.id ?? "";
        if (eduMylesUserId) {
          await convex.mutation(api.users.syncFromWorkOS, {
            eduMylesUserId,
            email: data.email ?? "",
            firstName: data.first_name ?? "",
            lastName: data.last_name ?? "",
          });
        }
        break;
      }
      case "user.deleted": {
        const eduMylesUserId: string = event?.data?.id ?? "";
        if (eduMylesUserId) {
          await convex.mutation(api.users.deactivateByWorkOSId, { eduMylesUserId });
        }
        break;
      }
      case "session.revoked": {
        const sessionToken: string = event?.data?.access_token ?? event?.data?.id ?? "";
        if (sessionToken) {
          await convex.mutation(api.sessions.deleteSession, { sessionToken });
        }
        break;
      }
      default:
        console.info("[workos-webhook] Unhandled event type:", eventType);
    }
  } catch (syncError) {
    console.error("[workos-webhook] Sync error for event", eventType, ":", syncError);
    // Still return 200 — WorkOS will retry on non-2xx responses causing duplicate events
  }

  return NextResponse.json({ received: true, type: eventType });
}
