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
      cookieStore.get("edumyles_session")?.value ?? 
      cookieStore.get("edumyles-session")?.value;
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

    if (!serverSecret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const invoiceId = body.invoiceId as string | undefined;
    const successUrl = body.successUrl as string | undefined;
    const cancelUrl = body.cancelUrl as string | undefined;
    
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

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const stripeResult = await convex.action((api as any).actions.payments.stripe.createCheckoutSession, {
      invoiceId: invoiceId as any,
      successUrl:
        successUrl ||
        `${appBaseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl:
        cancelUrl ||
        `${appBaseUrl}/payments/cancel?invoice_id=${invoiceId}`,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: stripeResult.url,
      sessionId: stripeResult.sessionId,
      message: "Redirecting to Stripe secure payment page...",
    });

  } catch (e) {
    console.error("Stripe initiate error:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : "Server error" 
    }, { status: 500 });
  }
}
