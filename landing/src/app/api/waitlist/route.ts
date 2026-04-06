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
      schoolName?: string;
      studentCount?: number | string;
      referralSource?: string;
      biggestChallenge?: string;
    };

    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const email = body.email?.trim().toLowerCase() ?? "";
    const phone = body.phone?.trim() || undefined;
    const country = body.country?.trim() ?? "";
    const schoolName = body.schoolName?.trim() ?? "";
    const biggestChallenge = body.biggestChallenge?.trim() || undefined;
    const referralSource = body.referralSource?.trim() || "landing_waitlist";
    const parsedStudentCount =
      typeof body.studentCount === "string"
        ? Number(body.studentCount)
        : body.studentCount;
    const studentCount =
      typeof parsedStudentCount === "number" && Number.isFinite(parsedStudentCount)
        ? parsedStudentCount
        : undefined;

    if (!fullName || !schoolName || !email || !country) {
      return NextResponse.json(
        { error: "Please complete your name, work email, school name, and country." },
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
    const result = await convex.mutation(api.modules.platform.waitlist.addToWaitlist, {
      fullName,
      email,
      phone,
      country,
      schoolName,
      studentCount,
      referralSource,
      biggestChallenge,
    });

    return NextResponse.json({
      success: true,
      waitlistId: result.waitlistId,
      alreadyExists: Boolean(result.duplicate),
    });
  } catch (error) {
    console.error("[landing/api/waitlist] Failed to submit application:", error);
    return NextResponse.json(
      { error: "We couldn't submit your application right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
