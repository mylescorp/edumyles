import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
  const redirectUri =
    process.env.WORKOS_REDIRECT_URI ||
    `${req.nextUrl.origin}/auth/callback`;

  if (!apiKey || !clientId) {
    console.error("[landing/auth/signup/api] Missing WorkOS env vars");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const errorUrl = appUrl
      ? `${appUrl}/auth/error?reason=not_configured`
      : `${req.nextUrl.origin}/auth/error?reason=not_configured`;
    return NextResponse.redirect(errorUrl);
  }

  const email = req.nextUrl.searchParams.get("email");
  const state = Buffer.from(
    JSON.stringify({
      nonce: crypto.randomBytes(16).toString("hex"),
      mode: "sign-up",
      ...(email ? { email } : {}),
    })
  ).toString("base64url");

  const workos = new WorkOS(apiKey);
  const authUrl = workos.userManagement.getAuthorizationUrl({
    clientId,
    redirectUri,
    provider: "authkit",
    screenHint: "sign-up",
    state,
  });

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("workos_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}

export async function POST() {
  return NextResponse.json({ error: "Use GET" }, { status: 405 });
}
