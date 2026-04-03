import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import crypto from "crypto";
import { api } from "@/convex/_generated/api";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST(req: NextRequest) {
  try {
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!serverSecret || !appUrl) {
      return NextResponse.json(
        { error: "Mobile auth is not configured on this deployment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String((body as { email?: string }).email ?? "")
      .trim()
      .toLowerCase();
    const deviceInfo = String((body as { deviceInfo?: string }).deviceInfo ?? "").trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const requestId = crypto.randomBytes(24).toString("hex");
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const convex = getConvexClient();

    await convex.mutation(api.sessions.createMobileAuthRequest, {
      serverSecret,
      requestId,
      email,
      expiresAt,
      deviceInfo: deviceInfo || undefined,
    });

    const approvalUrl = new URL("/auth/login", appUrl);
    approvalUrl.searchParams.set("returnTo", `/api/auth/mobile/complete?requestId=${requestId}`);

    return NextResponse.json({
      requestId,
      approvalUrl: approvalUrl.toString(),
      expiresAt,
      pollIntervalMs: 2500,
    });
  } catch (error) {
    console.error("[api/auth/mobile/start] Failed to create auth request", error);
    return NextResponse.json({ error: "Failed to start mobile sign-in" }, { status: 500 });
  }
}
