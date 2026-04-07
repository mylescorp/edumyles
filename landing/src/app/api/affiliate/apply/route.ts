import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

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

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Submit affiliate application (using reseller application with affiliate type)
    const result = await convex.mutation(api.modules.reseller.mutations.applications.submitApplication, {
      businessName: `${firstName} ${lastName}`,
      applicantType: "affiliate",
      businessDescription: promotionStrategy || "",
      website: website || "",
      contactPhone: phone || "",
      contactAddress: address || "",
      country,
      targetMarket: targetAudience || "",
      experience: experience || "",
      marketingChannels: referralChannels || [],
      expectedVolume: "",
      // Additional affiliate-specific fields
      affiliateInfo: {
        firstName,
        lastName,
        email,
        socialMedia: socialMedia || "",
      },
    });

    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
    });
  } catch (error) {
    console.error("Affiliate application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
