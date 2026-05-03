import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { api } from "../../../../../../convex/_generated/api";
import { getLandingConvexClient } from "@/lib/server/convex";

const whatsappTrackSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(160).optional().or(z.literal("")),
  phone: z.string().max(60).optional(),
  schoolName: z.string().max(160).optional(),
  role: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  topic: z.string().min(1).max(120),
  message: z.string().min(1).max(3000),
  composedWhatsAppMessage: z.string().min(1).max(4000),
  whatsappUrl: z.string().url().max(1200),
  pagePath: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  marketingAttribution: z.any().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = whatsappTrackSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request payload" },
      { status: 400 }
    );
  }

  try {
    const data = parsed.data;
    const convex = getLandingConvexClient();
    const result = await convex.mutation(api.publicEngagements.submitLandingEngagement, {
      channel: "whatsapp",
      name: data.name,
      email: data.email || undefined,
      phone: data.phone,
      schoolName: data.schoolName,
      role: data.role,
      country: data.country,
      topic: data.topic,
      message: data.message,
      composedWhatsAppMessage: data.composedWhatsAppMessage,
      whatsappUrl: data.whatsappUrl,
      pagePath: data.pagePath,
      referrer: data.referrer,
      userAgent: data.userAgent,
      marketingAttribution: data.marketingAttribution,
      source: "landing_whatsapp_widget",
    });

    return NextResponse.json({
      success: true,
      engagementId: String(result.engagementId),
      alreadyExists: result.alreadyExists,
    });
  } catch (error) {
    console.error("WhatsApp tracking error:", error);
    return NextResponse.json({ success: true, tracked: false });
  }
}
