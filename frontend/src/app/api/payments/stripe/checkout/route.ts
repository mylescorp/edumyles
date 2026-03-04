import { NextRequest, NextResponse } from "next/server";

/**
 * Create Stripe Checkout session.
 * The client should call the Convex action api.actions.payments.stripe.createCheckoutSession
 * with invoiceId, successUrl, cancelUrl so that the session is created with the user's auth.
 * This route can be used as a server-side alternative if needed (e.g. pass session token).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const invoiceId = body.invoiceId as string | undefined;
    const successUrl = (body.successUrl as string) ?? "/portal/parent/fees";
    const cancelUrl = (body.cancelUrl as string) ?? "/portal/parent/fees/pay";
    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: "Use the Convex action api.actions.payments.stripe.createCheckoutSession from the client.",
      invoiceId,
      successUrl,
      cancelUrl,
    });
  } catch (e) {
    console.error("Stripe checkout route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
