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

    const session = await convex.query(api.sessions.getSession, { sessionToken, serverSecret });
    if (!session) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const body = await req.json();
    const { recipients, message, priority, category } = body;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Recipients are required and must be an array" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required and must be non-empty" }, { status: 400 });
    }

    if (recipients.length > 100) {
      return NextResponse.json({ error: "Maximum 100 recipients allowed per request" }, { status: 400 });
    }

    if (message.length > 1600) { // 10 SMS max
      return NextResponse.json({ error: "Message too long (max 1600 characters)" }, { status: 400 });
    }

    if (!serverSecret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Check user permissions for SMS sending
    const userPermissions = await convex.query(api.modules.communications.queries.getUserPermissions, {
      sessionToken,
    });

    if (!userPermissions?.canSendSMS) {
      return NextResponse.json({ error: "Insufficient permissions to send SMS" }, { status: 403 });
    }

    // Send SMS via Convex action
    const result = await convex.action(api.modules.communications.sms.sendSMS, {
      webhookSecret: serverSecret,
      tenantId: session.tenantId,
      recipients,
      message,
      priority,
      category,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "SMS sending failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipientsSent: result.recipientsSent,
      recipientsFailed: result.recipientsFailed,
      message: "SMS sent successfully",
    });
  } catch (e) {
    console.error("SMS send API error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
