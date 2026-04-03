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

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || !serverSecret) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const absoluteSuccess = successUrl.startsWith("http")
      ? successUrl
      : `${req.nextUrl.origin}${successUrl}`;
    const absoluteCancel = cancelUrl.startsWith("http")
      ? cancelUrl
      : `${req.nextUrl.origin}${cancelUrl}`;

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price_data][currency]": "kes",
        "line_items[0][price_data][unit_amount]": String(Math.round(invoice.amount * 100)),
        "line_items[0][price_data][product_data][name]": `Fee payment - Invoice ${invoiceId}`,
        "line_items[0][quantity]": "1",
        mode: "payment",
        success_url: absoluteSuccess,
        cancel_url: absoluteCancel,
        client_reference_id: String(invoiceId),
        "metadata[tenantId]": session.tenantId,
        "metadata[invoiceId]": String(invoiceId),
      }),
    });

    const stripeJson = (await stripeRes.json()) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };
    if (!stripeRes.ok || !stripeJson.id || !stripeJson.url) {
      return NextResponse.json(
        { error: stripeJson.error?.message ?? "Stripe checkout session creation failed" },
        { status: 502 }
      );
    }

    await convex.action((api as any).modules.finance.actions.savePaymentCallbackFromServer, {
      webhookSecret: serverSecret,
      tenantId: session.tenantId,
      gateway: "stripe",
      externalId: stripeJson.id,
      invoiceId: String(invoiceId),
      amount: invoice.amount,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      sessionId: stripeJson.id,
      url: stripeJson.url,
    });
  } catch (e) {
    console.error("Stripe checkout route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
