import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
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
    const convex = getConvexClient();
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("edumyles_session")?.value ?? cookieStore.get("edumyles-session")?.value;
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
    if (!serverSecret) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const invoiceId = body.invoiceId as string | undefined;
    const successUrl = (body.successUrl as string) ?? "/portal/parent/fees";
    const cancelUrl = (body.cancelUrl as string) ?? "/portal/parent/fees/pay";
    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    const session = await convex.query(api.sessions.getSession, { sessionToken, serverSecret });
    if (!session) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const invoice = await convex.query(api.modules.finance.queries.getInvoice, {
      invoiceId: invoiceId as any,
    });
    if (!invoice || invoice.tenantId !== session.tenantId) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (invoice.status !== "pending" && invoice.status !== "partially_paid") {
      return NextResponse.json({ error: "Invoice not eligible for payment" }, { status: 400 });
    }

    const absoluteSuccess = successUrl.startsWith("http")
      ? successUrl
      : `${req.nextUrl.origin}${successUrl}`;
    const absoluteCancel = cancelUrl.startsWith("http")
      ? cancelUrl
      : `${req.nextUrl.origin}${cancelUrl}`;

    const stripeResult = await convex.action((api as any).actions.payments.stripe.createCheckoutSession, {
      invoiceId: invoiceId as any,
      successUrl: absoluteSuccess,
      cancelUrl: absoluteCancel,
    });

    return NextResponse.json({
      success: true,
      sessionId: stripeResult.sessionId,
      url: stripeResult.url,
    });
  } catch (e) {
    console.error("Stripe checkout route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
