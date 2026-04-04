import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      country?: string;
      county?: string;
      schoolName?: string;
      requestedRole?: string;
      message?: string;
    };

    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const phone = body.phone?.trim() || undefined;
    const country = body.country?.trim() || undefined;
    const county = body.county?.trim() || undefined;
    const schoolName = body.schoolName?.trim() ?? "";
    const requestedRole = body.requestedRole?.trim() || "school_admin";
    const message = body.message?.trim() || undefined;

    if (!firstName || !lastName || !schoolName || !email) {
      return NextResponse.json(
        { error: "Please complete your name, work email, and school name." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid work email address." },
        { status: 400 }
      );
    }

    const convexUrl =
      process.env.CONVEX_URL ||
      process.env.NEXT_PUBLIC_CONVEX_URL ||
      "https://insightful-alpaca-351.convex.cloud";
    if (!convexUrl) {
      return NextResponse.json(
        { error: "The application service is not configured right now." },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(convexUrl);
    const result = await convex.mutation(api.waitlist.submitWaitlistApplication, {
      email,
      firstName,
      lastName,
      phone,
      country,
      county,
      schoolName,
      requestedRole,
      message,
      source: "landing_public_signup",
    });

    return NextResponse.json({
      success: true,
      status: result.status,
      alreadyExists: !result.isNew,
    });
  } catch (error) {
    console.error("[landing/api/waitlist] Failed to submit application:", error);
    return NextResponse.json(
      { error: "We couldn't submit your application right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
