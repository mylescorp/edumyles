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

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("requestId");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  if (!requestId) {
    return NextResponse.redirect(new URL("/auth/error?reason=missing_mobile_request", appUrl));
  }

  try {
    const cookieSession =
      req.cookies.get("edumyles_session")?.value ?? req.cookies.get("edumyles-session")?.value;
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

    if (!cookieSession || !serverSecret) {
      return NextResponse.redirect(new URL("/auth/error?reason=mobile_session_missing", appUrl));
    }

    const convex = getConvexClient();
    const session = await convex.query(api.sessions.getSession, {
      sessionToken: cookieSession,
      serverSecret,
    });

    if (!session || !session.email) {
      return NextResponse.redirect(new URL("/auth/error?reason=invalid_mobile_session", appUrl));
    }

    await convex.mutation(api.sessions.completeMobileAuthRequest, {
      serverSecret,
      requestId,
      sessionToken: session.sessionToken,
      email: session.email,
      tenantId: session.tenantId,
      userId: session.userId,
      role: session.role,
    });

    return NextResponse.redirect(new URL("/auth/mobile/success", appUrl));
  } catch (error) {
    console.error("[api/auth/mobile/complete] Failed to complete mobile auth", error);
    return NextResponse.redirect(new URL("/auth/error?reason=mobile_completion_failed", appUrl));
  }
}
