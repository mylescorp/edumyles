import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../../convex/_generated/api";
import { getLandingConvexClient } from "@/lib/server/convex";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, source, landingPage, userAgent, referrer } = body;

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
    }

    // Get client IP address - handle Next.js properly
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwarded 
      ? (forwarded.split(",")[0]?.trim() || "unknown")
      : realIp || "unknown";

    const convex = getLandingConvexClient();

    const result = await convex.mutation(api.publicApplications.trackPublicReferralClick, {
      referralCode,
      source: source || "direct",
      campaign: body.campaign || undefined,
      landingPage: landingPage || "/",
      userAgent: userAgent || "unknown",
      referrer: referrer || undefined,
      ipAddress,
    });

    return NextResponse.json({ success: true, clickId: result.clickId });
  } catch (error) {
    console.error("Referral tracking error:", error);
    return NextResponse.json({ error: "Failed to track referral" }, { status: 500 });
  }
}
