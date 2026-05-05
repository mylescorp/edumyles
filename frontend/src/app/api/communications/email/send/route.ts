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
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await convex.query(api.sessions.getSession, { sessionToken, serverSecret });
    if (!session) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const body = await req.json();
    const { to, subject, html, text, templateId, templateVariables } = body;

    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: "Recipients are required and must be an array" }, { status: 400 });
    }

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return NextResponse.json({ error: "Subject is required and must be non-empty" }, { status: 400 });
    }

    if (!html && !text && !templateId) {
      return NextResponse.json({ error: "Either HTML content, text content, or template ID is required" }, { status: 400 });
    }

    if (to.length > 100) {
      return NextResponse.json({ error: "Maximum 100 recipients allowed per request" }, { status: 400 });
    }

    const canSendEmail =
      session.role === "school_admin" ||
      session.role === "principal" ||
      session.permissions?.includes("communications:write") ||
      session.permissions?.includes("communications:broadcast") ||
      session.permissions?.includes("*");

    if (!canSendEmail) {
      return NextResponse.json({ error: "Insufficient permissions to send emails" }, { status: 403 });
    }

    // Send email via Convex action
    const result = await convex.action((api as any)["modules/communications/email"].sendEmail, {
      webhookSecret: serverSecret,
      tenantId: session.activeTenantId ?? session.tenantId,
      to,
      subject,
      html,
      text,
      templateId,
      templateVariables,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Email sending failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipients: result.recipients ?? to,
      message: "Email sent successfully",
    });
  } catch (e) {
    console.error("Email send API error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
