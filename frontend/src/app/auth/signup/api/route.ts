import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Dev bypass
  if (process.env.ENABLE_DEV_AUTH_BYPASS === "true") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
  const redirectUri =
    process.env.WORKOS_REDIRECT_URI || `${req.nextUrl.origin}/auth/callback`;

  if (!apiKey || !clientId) {
    console.error("[auth/signup/api] Missing WORKOS_API_KEY or client ID");
    return NextResponse.redirect(new URL("/?auth_error=not_configured", req.url));
  }

  const email = req.nextUrl.searchParams.get("email") ?? undefined;
  const state = Buffer.from(
    JSON.stringify({
      nonce: crypto.randomBytes(16).toString("hex"),
      mode: "sign-up",
    })
  ).toString("base64url");

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
}
