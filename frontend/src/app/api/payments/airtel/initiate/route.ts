import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Airtel Money API endpoints (production URLs)
const AIRTEL_AUTH_URL = process.env.AIRTEL_ENVIRONMENT === "production"
  ? "https://openapi.airtel.africa/auth/oauth2/token"
  : "https://openapi.airtel.africa/auth/oauth2/token"; // Same for sandbox
const AIRTEL_STK_PUSH = process.env.AIRTEL_ENVIRONMENT === "production"
  ? "https://openapi.airtel.africa/merchant/v1/payments/"
  : "https://openapi.airtel.africa/merchant/v1/payments/"; // Same for sandbox

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("256")) return digits; // Uganda
  if (digits.startsWith("254")) return digits; // Kenya
  if (digits.startsWith("255")) return digits; // Tanzania
  if (digits.startsWith("250")) return digits; // Rwanda
  if (digits.startsWith("251")) return digits; // Ethiopia
  if (digits.startsWith("233")) return digits; // Ghana
  return digits;
}

function getCountryCode(phone: string): string {
  if (phone.startsWith("256")) return "UG";
  if (phone.startsWith("254")) return "KE";
  if (phone.startsWith("255")) return "TZ";
  if (phone.startsWith("250")) return "RW";
  if (phone.startsWith("251")) return "ET";
  if (phone.startsWith("233")) return "GH";
  return "UG"; // Default to Uganda
}

async function getAirtelAccessToken(): Promise<string> {
  const clientId = process.env.AIRTEL_CLIENT_ID;
  const clientSecret = process.env.AIRTEL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Airtel Money credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  const response = await fetch(AIRTEL_AUTH_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials"
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtel auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const convex = getConvexClient();
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("edumyles_session")?.value ?? 
      cookieStore.get("edumyles-session")?.value;
    
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

    const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Get Airtel Money access token
    const accessToken = await getAirtelAccessToken();
    
    // Normalize phone number and detect country
    const normalizedPhone = normalizePhone(phone);
    const countryCode = getCountryCode(normalizedPhone);
    
    // Generate unique transaction ID
    const transactionId = `EDU-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Prepare Airtel Money STK push request
    const airtelPayload = {
      reference: transactionId,
      subscriber: {
        country: countryCode,
        currency: invoice.currency || "UGX",
        msisdn: normalizedPhone
      },
      transaction: {
        amount: Math.round(invoice.amount),
        country: countryCode,
        currency: invoice.currency || "UGX",
        id: transactionId
      },
      payee: {
        partyId: process.env.AIRTEL_PARTY_ID || "100001",
        partyIdType: "MSISDN"
      }
    };

    // Make STK push request to Airtel
    const stkResponse = await fetch(`${AIRTEL_STK_PUSH}${countryCode}/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Country": countryCode,
        "X-Currency": invoice.currency || "UGX",
      },
      body: JSON.stringify(airtelPayload),
    });

    if (!stkResponse.ok) {
      const error = await stkResponse.text();
      console.error("Airtel STK push failed:", error);
      return NextResponse.json({ 
        error: "Airtel Money payment initiation failed",
        details: error 
      }, { status: 502 });
    }

    const stkResult = await stkResponse.json();
    
    if (!stkResult.status?.success) {
      return NextResponse.json({ 
        error: stkResult.status?.message || "STK push initiation failed" 
      }, { status: 502 });
    }

    // Save payment callback for webhook processing
    await convex.action((api as any).modules.finance.actions.savePaymentCallbackFromServer, {
      webhookSecret,
      tenantId: session.tenantId,
      gateway: "airtel",
      externalId: transactionId,
      invoiceId: String(invoiceId),
      amount: invoice.amount,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      transactionId,
      message: "Airtel Money payment initiated. Please check your phone to complete the payment.",
      airtelTransactionId: stkResult.data?.transaction_id,
    });

  } catch (e) {
    console.error("Airtel Money initiate error:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : "Server error" 
    }, { status: 500 });
  }
}
