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

/**
 * Server-side M-Pesa initiate: validates session and returns success.
 * The client should call the Convex action actions.payments.mpesa.initiateStkPush(invoiceId, phone)
 * directly so that the action runs with the user's auth. This route is an alternative that
 * could be used from server components or with a custom token.
 */
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

    return NextResponse.json({
      success: true,
      message:
        "Use the Convex action api.actions.payments.mpesa.initiateStkPush from the client with invoiceId and phone to trigger the STK push.",
    });
  } catch (e) {
    console.error("M-Pesa initiate error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
