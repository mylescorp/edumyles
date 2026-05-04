import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { api } from "../../../../../convex/_generated/api";
import { getLandingConvexClient } from "@/lib/server/convex";

const chatSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("A valid email is required").max(160).optional().or(z.literal("")),
  phone: z.string().max(60).optional(),
  schoolName: z.string().max(160).optional(),
  role: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  topic: z.string().min(1, "Topic is required").max(120),
  message: z.string().min(1, "Message is required").max(2000, "Message is too long"),
  pagePath: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  marketingAttribution: z.any().optional(),
});

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: NextRequest) {
  try {
    const parsed = chatSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request payload" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    let engagementId: string | null = null;

    try {
      const convex = getLandingConvexClient();
      const result = await convex.mutation(api.publicEngagements.submitLandingEngagement, {
        channel: "live_chat",
        name: data.name,
        email: data.email || undefined,
        phone: data.phone,
        schoolName: data.schoolName,
        role: data.role,
        country: data.country,
        topic: data.topic,
        message: data.message,
        pagePath: data.pagePath,
        referrer: data.referrer,
        userAgent: data.userAgent,
        marketingAttribution: data.marketingAttribution,
        source: "landing_live_chat",
      });
      engagementId = String(result.engagementId);
    } catch (error) {
      console.error("Convex landing chat storage error:", error);
    }

    const resend = getResendClient();

    if (!resend) {
      console.warn("Chat message received but RESEND_API_KEY is not configured");
      return NextResponse.json({ success: true, queued: false, engagementId });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "EduMyles <noreply@edumyles.com>";
    const supportEmail = process.env.RESEND_SUPPORT_EMAIL || "support@edumyles.com";

    const result = await resend.emails.send({
      from: fromEmail,
      to: [supportEmail],
      subject: `Live Chat from ${data.name}`,
      html: `
        <h2>New landing page chat message</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email || "Not provided")}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone || "Not provided")}</p>
        <p><strong>School:</strong> ${escapeHtml(data.schoolName || "Not provided")}</p>
        <p><strong>Role:</strong> ${escapeHtml(data.role || "Not provided")}</p>
        <p><strong>Country:</strong> ${escapeHtml(data.country || "Not provided")}</p>
        <p><strong>Topic:</strong> ${escapeHtml(data.topic)}</p>
        <p><strong>Page:</strong> ${escapeHtml(data.pagePath || "Not provided")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(data.message).replace(/\n/g, "<br />")}</p>
      `,
    });

    if (result.error) {
      console.error("Resend chat email error:", result.error);
      return NextResponse.json({ error: "Failed to send message." }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      queued: true,
      id: result.data?.id ?? null,
      engagementId,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
