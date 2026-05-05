import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getLandingConvexClient } from "@/lib/server/convex";
import type { MarketingAttribution } from "@/lib/attribution";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface DemoRequestSubmission {
  fullName: string;
  email: string;
  phone?: string;
  schoolName: string;
  schoolType?: string;
  jobTitle?: string;
  preferredDemoDate?: string;
  needs?: string;
  country?: string;
  county?: string;
  studentCount?: number;
  currentSystem?: string;
  referralSource?: string;
  referralCode?: string;
  sourceChannel?: string;
  marketingAttribution?: MarketingAttribution;
}

async function sendFallbackEmail(data: DemoRequestSubmission): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const notifyTo = process.env.DEMO_NOTIFY_EMAIL ?? "sales@edumyles.com";
  const body = [
    "New demo request (Convex unavailable - manual follow-up needed):",
    "",
    `Name:          ${data.fullName}`,
    `Email:         ${data.email}`,
    `Phone:         ${data.phone ?? "Not provided"}`,
    `School:        ${data.schoolName}`,
    `School type:   ${data.schoolType ?? "Not provided"}`,
    `Role:          ${data.jobTitle ?? "Not provided"}`,
    `Preferred:     ${data.preferredDemoDate ?? "Not provided"}`,
    `Country:       ${data.country ?? "Not provided"}`,
    `Students:      ${data.studentCount ?? "Not provided"}`,
    `Source:        ${data.sourceChannel ?? "demo_request"}`,
    `CTA:           ${data.marketingAttribution?.ctaSource ?? "Not specified"}`,
    `Campaign:      ${data.marketingAttribution?.utmCampaign ?? "Not specified"}`,
    `Landing page:  ${data.marketingAttribution?.landingPage ?? "Not specified"}`,
    `Needs:         ${data.needs ?? "Not provided"}`,
  ].join("\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EduMyles Demo Requests <no-reply@edumyles.com>",
      to: [notifyTo],
      subject: `[Demo Request] ${data.fullName} - ${data.schoolName}`,
      text: body,
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
      schoolName?: string;
      schoolType?: string;
      jobTitle?: string;
      preferredDemoDate?: string;
      needs?: string;
      country?: string;
      county?: string;
      studentCount?: number | string;
      currentSystem?: string;
      referralSource?: string;
      referralCode?: string;
      marketingAttribution?: MarketingAttribution;
    };

    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const email = body.email?.trim().toLowerCase() ?? "";
    const schoolName = body.schoolName?.trim() ?? "";
    const phone = body.phone?.trim() || undefined;
    const schoolType = body.schoolType?.trim() || undefined;
    const jobTitle = body.jobTitle?.trim() || undefined;
    const preferredDemoDate = body.preferredDemoDate?.trim() || undefined;
    const needs = body.needs?.trim() || undefined;
    const country = body.country?.trim() || undefined;
    const county = body.county?.trim() || undefined;
    const currentSystem = body.currentSystem?.trim() || undefined;
    const referralSource = body.referralSource?.trim() || undefined;
    const referralCode = body.referralCode?.trim() || undefined;
    const parsedStudentCount =
      typeof body.studentCount === "string" ? Number(body.studentCount) : body.studentCount;
    const studentCount =
      typeof parsedStudentCount === "number" && Number.isFinite(parsedStudentCount)
        ? parsedStudentCount
        : undefined;

    if (!fullName || !email || !phone || !schoolName || !schoolType || !jobTitle) {
      return NextResponse.json(
        { error: "Please complete your name, work email, phone number, school name, school type, and role." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid work email address." },
        { status: 400 }
      );
    }

    const submission: DemoRequestSubmission = {
      fullName,
      email,
      phone,
      schoolName,
      schoolType,
      jobTitle,
      preferredDemoDate,
      needs,
      country,
      county,
      studentCount,
      currentSystem,
      referralSource,
      referralCode,
      sourceChannel: "demo_request",
      marketingAttribution: body.marketingAttribution,
    };

    try {
      const convex = getLandingConvexClient();
      const result = await convex.mutation(
        api.modules.platform.demoRequests.submitDemoRequest,
        submission
      );

      return NextResponse.json({
        success: true,
        demoRequestId: result.demoRequestId,
        crmLeadId: result.crmLeadId,
      });
    } catch (convexError) {
      console.error("[landing/api/demo-request] Convex call failed, using email fallback:", convexError);
      await sendFallbackEmail(submission).catch((error) =>
        console.error("[landing/api/demo-request] Fallback email failed:", error)
      );
      return NextResponse.json(
        {
          success: true,
          capturedViaFallback: true,
        },
        { status: 202 }
      );
    }
  } catch (error) {
    console.error("[landing/api/demo-request] Unexpected error:", error);
    return NextResponse.json(
      { error: "We couldn't submit your demo request right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
