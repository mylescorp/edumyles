import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST(request: NextRequest) {
  try {
    const { schoolCode, identifier } = await request.json();

    if (!schoolCode || !identifier) {
      return NextResponse.json({ error: "School code and identifier are required" }, { status: 400 });
    }

    const convex = getConvexClient();
    const result = await convex.mutation(api.parentOnboarding.requestParentOtp, {
      schoolCode,
      identifier,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send verification code";
    const status = message.includes("not find a parent record") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
