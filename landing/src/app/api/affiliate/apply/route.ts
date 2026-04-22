import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../../convex/_generated/api";
import { getLandingConvexClient } from "@/lib/server/convex";

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

    const convex = getLandingConvexClient();

    const result = await convex.mutation(api.publicApplications.submitPublicResellerApplication, {
      applicantEmail: email,
      businessName: `${firstName} ${lastName}`.trim(),
      businessType: "affiliate",
      businessDescription: [
        promotionStrategy ? `Promotion strategy: ${promotionStrategy}` : null,
        targetAudience ? `Target audience: ${targetAudience}` : null,
        socialMedia ? `Social media presence: ${socialMedia}` : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
      website: website || undefined,
      contactPhone: phone || "Not provided",
      contactAddress: address || "Not provided",
      country,
      targetMarket: targetAudience || "General education audience",
      experience: experience || "Not provided",
      marketingChannels: Array.isArray(referralChannels) ? referralChannels : [],
      expectedVolume: "Affiliate referral partner",
    });

    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
      alreadyExists: Boolean(result.duplicate),
      message: result.duplicate
        ? "Affiliate application already exists and remains on file"
        : "Affiliate application submitted successfully",
    });
  } catch (error) {
    console.error("Affiliate application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
