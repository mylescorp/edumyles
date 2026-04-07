import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

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
    } = body;

    // Validate required fields
    if (!businessName || !businessType || !contactPhone || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Submit publisher application
    const result = await convex.mutation(api.modules.publisher.mutations.applications.submitApplication, {
      businessName,
      businessType,
      businessDescription: businessDescription || "",
      website: website || "",
      contactPhone,
      contactAddress: contactAddress || "",
      country,
      modules: modules || [],
      experience: experience || "",
    });

    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
    });
  } catch (error) {
    console.error("Publisher application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
