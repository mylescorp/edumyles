import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface WaitlistSubmission {
  fullName: string;
  email: string;
  schoolName: string;
  country: string;
  phone?: string;
  studentCount?: number;
  referralSource?: string;
  biggestChallenge?: string;
}

async function sendFallbackEmail(data: WaitlistSubmission): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const notifyEmail = process.env.WAITLIST_NOTIFY_EMAIL ?? "sales@edumyles.com";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "no-reply@edumyles.com",
      to: [notifyEmail],
      subject: `New waitlist signup: ${data.schoolName}`,
      text: [
        `Name: ${data.fullName}`,
        `Email: ${data.email}`,
        `School: ${data.schoolName}`,
        `Country: ${data.country}`,
        data.phone ? `Phone: ${data.phone}` : null,
        data.studentCount != null ? `Students: ${data.studentCount}` : null,
        data.referralSource ? `Source: ${data.referralSource}` : null,
        data.biggestChallenge ? `Challenge: ${data.biggestChallenge}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    }),
  });
}

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

    const submission: WaitlistSubmission = {
      fullName,
      email,
      phone,
      country,
      schoolName,
      studentCount,
      referralSource,
      biggestChallenge,
    };

    const convexUrl =
      process.env.CONVEX_URL ||
      process.env.NEXT_PUBLIC_CONVEX_URL ||
      "https://insightful-alpaca-351.convex.cloud";

    try {
      const convex = new ConvexHttpClient(convexUrl);
      const result = await convex.mutation(api.modules.platform.waitlist.addToWaitlist, submission);
      return NextResponse.json({
        success: true,
        waitlistId: result.waitlistId,
        alreadyExists: Boolean(result.duplicate),
      });
    } catch (convexError) {
      console.error("[landing/api/waitlist] Convex mutation failed, using fallback:", convexError);
      await sendFallbackEmail(submission).catch((e) =>
        console.error("[landing/api/waitlist] Fallback email failed:", e)
      );
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("[landing/api/waitlist] Request parsing failed:", error);
    return NextResponse.json(
      { error: "We couldn't submit your application right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
