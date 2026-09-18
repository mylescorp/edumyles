import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getLandingConvexClient } from "@/lib/server/convex";
import type { MarketingAttribution } from "@/lib/attribution";
import { z } from "zod";

const waitlistSchema = z.object({
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().max(100).optional(),
  county: z.string().trim().max(100).optional(),
  schoolName: z.string().trim().max(160).optional(),
  studentCount: z.union([z.number().int().nonnegative(), z.string().trim().regex(/^\d+$/)]).optional(),
  currentSystem: z.string().trim().max(160).optional(),
  referralSource: z.string().trim().max(160).optional(),
  referralCode: z.string().trim().max(160).optional(),
  biggestChallenge: z.string().trim().max(4_000).optional(),
  marketingAttribution: z.custom<MarketingAttribution>().optional(),
});

interface WaitlistSubmission {
  fullName: string;
  email: string;
  schoolName: string;
  country: string;
  county?: string;
  phone?: string;
  studentCount?: number;
  currentSystem?: string;
  referralCode?: string;
  referralSource?: string;
  biggestChallenge?: string;
  sourceChannel?: string;
  marketingAttribution?: MarketingAttribution;
}

/** Send a plain notification email via Resend when Convex is unavailable. */
async function sendFallbackEmail(data: WaitlistSubmission): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const notifyTo = process.env.WAITLIST_NOTIFY_EMAIL ?? "sales@edumyles.com";
  const body = [
    `New waitlist submission (Convex unavailable — manual follow-up needed):`,
    ``,
    `Name:          ${data.fullName}`,
    `Email:         ${data.email}`,
    `School:        ${data.schoolName}`,
    `Country:       ${data.country}`,
    `Students:      ${data.studentCount ?? "Not specified"}`,
    `Phone:         ${data.phone ?? "Not provided"}`,
    `Source:        ${data.referralSource ?? "landing_waitlist"}`,
    `Challenge:     ${data.biggestChallenge ?? "Not specified"}`,
    `CTA:           ${data.marketingAttribution?.ctaSource ?? "Not specified"}`,
    `Campaign:      ${data.marketingAttribution?.utmCampaign ?? "Not specified"}`,
    `Landing page:  ${data.marketingAttribution?.landingPage ?? "Not specified"}`,
  ].join("\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EduMyles Waitlist <no-reply@edumyles.com>",
      to: [notifyTo],
      subject: `[Waitlist] ${data.fullName} — ${data.schoolName}`,
      text: body,
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const parsed = waitlistSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "We could not submit your request. Please review the form and try again." },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const email = body.email?.trim().toLowerCase() ?? "";
    const phone = body.phone?.trim() || undefined;
    const country = body.country?.trim() ?? "";
    const county = body.county?.trim() || undefined;
    const schoolName = body.schoolName?.trim() ?? "";
    const currentSystem = body.currentSystem?.trim() || undefined;
    const biggestChallenge = body.biggestChallenge?.trim() || undefined;
    const referralSource = body.referralSource?.trim() || "landing_waitlist";
    const referralCode = body.referralCode?.trim() || undefined;
    const marketingAttribution = body.marketingAttribution;
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

    const submission: WaitlistSubmission = {
      fullName,
      email,
      phone,
      country,
      county,
      schoolName,
      studentCount,
      currentSystem,
      referralSource,
      referralCode,
      biggestChallenge,
      sourceChannel: "landing_waitlist",
      marketingAttribution,
    };

    // Primary path — save to Convex
    try {
      const convex = getLandingConvexClient();
      const result = await convex.mutation(api.modules.platform.waitlist.addToWaitlist, submission);
      return NextResponse.json({
        success: true,
        waitlistId: result.waitlistId,
        alreadyExists:
          result.status === "updated" || result.status === "already_registered",
      });
    } catch (convexError) {
      // Convex unavailable (not yet deployed, or schema mismatch) —
      // fall back to email notification so the lead is never lost.
      console.error("[landing/api/waitlist] Convex call failed, using email fallback:", convexError);
      await sendFallbackEmail(submission).catch((e) =>
        console.error("[landing/api/waitlist] Fallback email failed:", e)
      );
      return NextResponse.json({
        success: false,
        message: "We could not submit your request right now. Please try again shortly.",
      }, { status: 503 });
    }
  } catch (error) {
    console.error("[landing/api/waitlist] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "We could not submit your request right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
