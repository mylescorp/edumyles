import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      address,
      website,
      socialMedia,
      experience,
      targetAudience,
      referralChannels,
      promotionStrategy,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For now, just return a success response
    // TODO: Integrate with actual backend when modules are fixed
    return NextResponse.json({
      success: true,
      applicationId: `AFF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      message: "Affiliate application submitted successfully",
    });
  } catch (error) {
    console.error("Affiliate application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
