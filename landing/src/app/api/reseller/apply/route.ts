import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      businessType,
      businessDescription,
      website,
      contactPhone,
      contactAddress,
      country,
      targetMarket,
      experience,
      marketingChannels,
      expectedVolume,
    } = body;

    // Validate required fields
    if (!businessName || !businessType || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For now, just return a success response
    // TODO: Integrate with actual backend when modules are fixed
    return NextResponse.json({
      success: true,
      applicationId: `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      message: "Reseller application submitted successfully",
    });
  } catch (error) {
    console.error("Reseller application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
