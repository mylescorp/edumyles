import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import Stripe from "stripe";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(stripeSecretKey);
}

export async function POST(req: NextRequest) {
  try {
    const convex = getConvexClient();
    const stripe = getStripeClient();
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

    if (!serverSecret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Get student information for the checkout session
    const student = await convex.query(api.modules.sis.queries.getStudent, {
      studentId: invoice.studentId as any,
      sessionToken
    });

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: invoice.currency?.toLowerCase() || 'kes',
            product_data: {
              name: `School Fees - ${invoice.academicYear || '2025-2026'}`,
              description: `Payment for invoice ${invoice.invoiceNumber || invoiceId}`,
              images: [],
            },
            unit_amount: Math.round(invoice.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: String(invoiceId),
        tenantId: session.tenantId,
        studentId: String(invoice.studentId),
        gateway: 'stripe',
      },
      customer_email: student?.guardians?.[0]?.email || session.email,
      billing_address_collection: 'required',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/cancel?invoice_id=${invoiceId}`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    // Save payment callback for webhook processing
    await convex.action((api as any).modules.finance.actions.savePaymentCallbackFromServer, {
      webhookSecret: serverSecret,
      tenantId: session.tenantId,
      gateway: "stripe",
      externalId: checkoutSession.id,
      invoiceId: String(invoiceId),
      amount: invoice.amount,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      message: "Redirecting to Stripe secure payment page...",
    });

  } catch (e) {
    console.error("Stripe initiate error:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : "Server error" 
    }, { status: 500 });
  }
}
