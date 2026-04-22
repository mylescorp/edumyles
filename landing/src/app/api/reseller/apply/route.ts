import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../../convex/_generated/api";
import { getLandingConvexClient } from "@/lib/server/convex";

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
      email,
    } = body;

    // Validate required fields
    if (!businessName || !businessType || !country || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const convex = getLandingConvexClient();

    const result = await convex.mutation(api.publicApplications.submitPublicResellerApplication, {
      applicantEmail: email,
      businessName,
      businessType,
      businessDescription,
      website: website || undefined,
      contactPhone,
      contactAddress,
      country,
      targetMarket,
      experience,
      marketingChannels: Array.isArray(marketingChannels) ? marketingChannels : [],
      expectedVolume,
    });

    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
      alreadyExists: Boolean(result.duplicate),
      message: result.duplicate
        ? "Reseller application already exists and remains on file"
        : "Reseller application submitted successfully",
    });
  } catch (error) {
    console.error("Reseller application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
