import { NextRequest, NextResponse } from "next/server";

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
      ? forwarded.split(",")[0].trim() 
      : realIp || "unknown";

    // For now, just return success without backend integration
    // TODO: Integrate with actual backend when modules are fixed
    console.log("Referral tracked:", {
      referralCode,
      source: source || "direct",
      landingPage: landingPage || "/",
      userAgent: userAgent || "unknown",
      referrer: referrer || null,
      ipAddress,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Referral tracking error:", error);
    return NextResponse.json({ error: "Failed to track referral" }, { status: 500 });
  }
}
