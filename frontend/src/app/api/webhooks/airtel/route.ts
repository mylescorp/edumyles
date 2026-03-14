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
  try {
    const expectedSecret = process.env.CONVEX_WEBHOOK_SECRET;
    const providedSecret =
      req.headers.get("x-webhook-secret") ?? req.headers.get("x-edumyles-webhook-secret");

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const externalId =
      String(
        (body as any).transactionId ??
          (body as any).externalId ??
          (body as any).reference ??
          ""
      ).trim();

    if (!externalId) {
      return NextResponse.json({ error: "Missing transaction id" }, { status: 400 });
    }

    const statusRaw = String((body as any).status ?? (body as any).result ?? "").toLowerCase();
    const resultCode =
      (body as any).resultCode != null
        ? Number((body as any).resultCode)
        : statusRaw === "success" || statusRaw === "completed" || statusRaw === "ok"
          ? 0
          : 1;

    const reference = String((body as any).reference ?? externalId);

    const convex = getConvexClient();
    await convex.action(api.modules.finance.actions.recordPaymentFromGateway, {
      webhookSecret: expectedSecret,
      gateway: "airtel",
      externalId,
      resultCode,
      reference,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Airtel webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
