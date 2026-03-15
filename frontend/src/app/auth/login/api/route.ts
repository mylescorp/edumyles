import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import crypto from "crypto";

function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

function buildAuthUrl(req: NextRequest, email?: string, state?: string) {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;
  const redirectUri =
    process.env.WORKOS_REDIRECT_URI ||
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
    req.nextUrl.origin + "/auth/callback";

  if (!clientId || !apiKey) {
    throw new Error("Authentication service not configured");
  }

  const workos = new WorkOS(apiKey);
  return workos.userManagement.getAuthorizationUrl({
    clientId,
    redirectUri,
    provider: "authkit",
    screenHint: "sign-in",
    state: state,
    ...(email ? { loginHint: email } : {}),
  });
}

export async function POST(req: NextRequest) {
  try {
    // Development bypass - only active when ENABLE_DEV_AUTH_BYPASS=true is explicitly set
    if (process.env.ENABLE_DEV_AUTH_BYPASS === "true") {
      console.log("[auth/login] Dev bypass enabled: Bypassing WorkOS auth");
      const response = NextResponse.json({
        success: true,
        redirectUrl: "/admin"
      });
      return response;
    }

    const body = await req.json().catch(() => ({}));
    const email = body?.email;
    const state = generateState();
    const authUrl = buildAuthUrl(req, email, state);

    const response = NextResponse.json({ authUrl, state });
    response.cookies.set("workos_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Development bypass - only active when ENABLE_DEV_AUTH_BYPASS=true is explicitly set
    if (process.env.ENABLE_DEV_AUTH_BYPASS === "true") {
      console.log("[auth/login] Dev bypass enabled: Bypassing WorkOS auth");
      const response = NextResponse.redirect(new URL("/admin", req.url));
      return response;
    }

    const email = req.nextUrl.searchParams.get("email") ?? undefined;
    const state = generateState();
    const authUrl = buildAuthUrl(req, email, state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("workos_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login redirect error:", error);
    const fallback = new URL("/", req.url);
    fallback.searchParams.set(
      "auth_error",
      "Login service is temporarily unavailable. Please try again later."
    );
    return NextResponse.redirect(fallback);
  }
}
