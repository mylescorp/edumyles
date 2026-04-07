import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, source, landingPage, userAgent, referrer } = body;

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
    }

    // Get client IP address
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.ip || "unknown";

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Track the referral click
    await convex.mutation(api.modules.reseller.mutations.marketing.trackReferralClick, {
      referralCode,
      source: source || "direct",
      landingPage: landingPage || "/",
      userAgent: userAgent || "unknown",
      referrer: referrer || null,
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Referral tracking error:", error);
    return NextResponse.json({ error: "Failed to track referral" }, { status: 500 });
  }
}
