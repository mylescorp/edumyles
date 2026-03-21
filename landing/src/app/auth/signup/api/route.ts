import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import crypto from "crypto";
import { encodeAuthState, getLandingRedirectUri, sanitizeReturnTo } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email") ?? undefined;
    const returnTo = req.nextUrl.searchParams.get("returnTo") ?? undefined;
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId =
      process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;
    const redirectUri = getLandingRedirectUri(req.nextUrl.origin);

    if (!clientId || !apiKey) {
      return NextResponse.redirect(new URL("/auth/signup?error=not_configured", req.url));
    }

    const state = encodeAuthState({
      nonce: crypto.randomBytes(16).toString("hex"),
      mode: "sign-up",
      returnTo: sanitizeReturnTo(returnTo, "/admin"),
    });

    const workos = new WorkOS(apiKey);
    const authUrl = workos.userManagement.getAuthorizationUrl({
      clientId,
      redirectUri,
      provider: "authkit",
      screenHint: "sign-up",
      ...(email ? { loginHint: email } : {}),
      state,
    });

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
    console.error("Signup GET redirect error:", error);
    return NextResponse.redirect(new URL("/auth/signup?error=signup_unavailable", req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email;
    const schoolName = body?.schoolName;
    const provider = body?.provider || "authkit";
    const returnTo = body?.returnTo;
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId =
      process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID ||
      process.env.WORKOS_CLIENT_ID;
    const redirectUri = getLandingRedirectUri(req.nextUrl.origin);

    if (!clientId || !apiKey) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 500 }
      );
    }

    const state = encodeAuthState({
      nonce: crypto.randomBytes(16).toString("hex"),
      mode: "sign-up",
      returnTo: sanitizeReturnTo(returnTo, "/admin"),
      ...(schoolName ? { schoolName } : {}),
    });

    const workos = new WorkOS(apiKey);
    
    // Configure provider based on selection
    const baseConfig = {
      clientId,
      redirectUri,
      screenHint: "sign-up" as const,
      ...(email ? { loginHint: email } : {}),
      state,
    };

    // Set specific provider if Google or Microsoft is selected
    const providerConfig = provider === "google" 
      ? { ...baseConfig, provider: "Google" as const }
      : provider === "microsoft"
      ? { ...baseConfig, provider: "Microsoft" as const }
      : { ...baseConfig, provider: "authkit" as const };

    const authUrl = workos.userManagement.getAuthorizationUrl(providerConfig);

    const response = NextResponse.json({ authUrl });
    response.cookies.set("workos_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
