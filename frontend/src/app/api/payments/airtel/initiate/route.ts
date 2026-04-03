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

export async function POST(req: NextRequest) {
  try {
    const convex = getConvexClient();
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("edumyles_session")?.value ?? 
      cookieStore.get("edumyles-session")?.value;
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const invoiceId = body.invoiceId as string | undefined;
    const phone = body.phone as string | undefined;
    
    if (!invoiceId || !phone) {
      return NextResponse.json({ error: "Missing invoiceId or phone" }, { status: 400 });
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

    if (!serverSecret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Normalize phone number and detect country
    const normalizedPhone = normalizePhone(phone);
    const result = await convex.action(api.modules.finance.actions.initiateAirtelPayment, {
      webhookSecret: serverSecret,
      tenantId: session.tenantId,
      invoiceId: String(invoiceId),
      phoneNumber: normalizedPhone,
      amount: invoice.amount,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Airtel Money payment initiation failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      airtelTransactionId: result.transactionId,
      message:
        result.message ||
        "Airtel Money payment initiated. Please check your phone to complete the payment.",
    });

  } catch (e) {
    console.error("Airtel Money initiate error:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : "Server error" 
    }, { status: 500 });
  }
}
