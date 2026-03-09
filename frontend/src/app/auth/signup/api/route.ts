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
    screenHint: "sign-up",
    state: state,
    ...(email ? { loginHint: email } : {}),
  });
}

export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[auth/signup] Development mode: Bypassing WorkOS auth");
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
    console.error("Signup redirect error:", error);
    const fallback = new URL("/", req.url);
    fallback.searchParams.set(
      "auth_error",
      "Signup service is temporarily unavailable. Please try again later."
    );
    return NextResponse.redirect(fallback);
  }
}
