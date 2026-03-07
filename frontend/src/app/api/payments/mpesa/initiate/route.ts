import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const DARAJA_OAUTH =
  "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const DARAJA_STK_PUSH = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return digits;
}

export async function POST(req: NextRequest) {
  try {
    const convex = getConvexClient();
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("edumyles_session")?.value ?? cookieStore.get("edumyles-session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const invoiceId = body.invoiceId as string | undefined;
    const phone = body.phone as string | undefined;
    if (!invoiceId || !phone) {
      return NextResponse.json({ error: "Missing invoiceId or phone" }, { status: 400 });
    }

    const session = await convex.query(api.sessions.getSession, { sessionToken });
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

    const consumerKey = process.env.CONVEX_MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.CONVEX_MPESA_CONSUMER_SECRET;
    const passkey = process.env.CONVEX_MPESA_PASSKEY;
    const shortcode = process.env.CONVEX_MPESA_SHORTCODE;
    const callbackUrl = process.env.CONVEX_MPESA_CALLBACK_URL;
    const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;

    if (
      !consumerKey ||
      !consumerSecret ||
      !passkey ||
      !shortcode ||
      !callbackUrl ||
      !webhookSecret
    ) {
      return NextResponse.json(
        { error: "M-Pesa server configuration is incomplete" },
        { status: 500 }
      );
    }

    const oauthRes = await fetch(DARAJA_OAUTH, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
      },
    });
    if (!oauthRes.ok) {
      const text = await oauthRes.text();
      return NextResponse.json({ error: `M-Pesa OAuth failed: ${text}` }, { status: 502 });
    }

    const oauth = (await oauthRes.json()) as { access_token?: string };
    if (!oauth.access_token) {
      return NextResponse.json({ error: "M-Pesa access token missing" }, { status: 502 });
    }

    const timestamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const normalizedPhone = normalizePhone(phone);

    const stkRes = await fetch(DARAJA_STK_PUSH, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${oauth.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(invoice.amount),
        PartyA: normalizedPhone,
        PartyB: shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `INV-${invoiceId}`,
        TransactionDesc: "EduMyles fee payment",
      }),
    });

    const stkJson = (await stkRes.json()) as {
      CheckoutRequestID?: string;
      errorMessage?: string;
    };
    if (!stkRes.ok || !stkJson.CheckoutRequestID) {
      return NextResponse.json(
        { error: stkJson.errorMessage ?? "STK push initiation failed" },
        { status: 502 }
      );
    }

    await convex.mutation((api as any).modules.finance.mutations.savePaymentCallbackFromServer, {
      webhookSecret,
      tenantId: session.tenantId,
      gateway: "mpesa",
      externalId: stkJson.CheckoutRequestID,
      invoiceId: String(invoiceId),
      amount: invoice.amount,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkJson.CheckoutRequestID,
      message: "Enter your M-Pesa PIN on your phone to complete the payment.",
    });
  } catch (e) {
    console.error("M-Pesa initiate error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
