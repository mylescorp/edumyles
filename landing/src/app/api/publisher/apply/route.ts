import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

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
      experience,
      modules,
      email,
    } = body;

    // Validate required fields
    if (!businessName || !businessType || !country || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const convexUrl =
      process.env.CONVEX_URL ||
      process.env.NEXT_PUBLIC_CONVEX_URL ||
      "https://insightful-alpaca-351.convex.cloud";
    const convex = new ConvexHttpClient(convexUrl);

    const result = await convex.mutation(api.publicApplications.submitPublicPublisherApplication, {
      applicantEmail: email,
      businessName,
      businessType,
      businessDescription,
      website: website || undefined,
      contactPhone,
      contactAddress,
      country,
      experience,
      modules: Array.isArray(modules) ? modules : [],
    });

    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
      alreadyExists: Boolean(result.duplicate),
      message: result.duplicate
        ? "Publisher application already exists and remains on file"
        : "Publisher application submitted successfully",
    });
  } catch (error) {
    console.error("Publisher application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
