import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
  // Redirect URI must be the landing callback (or the frontend callback if separately deployed)
  const redirectUri =
    process.env.WORKOS_REDIRECT_URI ||
    `${req.nextUrl.origin}/auth/callback`;

  if (!apiKey || !clientId) {
    console.error("[landing/auth/login/api] Missing WorkOS env vars");
    return NextResponse.redirect(new URL("/?auth_error=not_configured", req.url));
  }

  const returnTo = req.nextUrl.searchParams.get("returnTo");
  const state = Buffer.from(
    JSON.stringify({
      nonce: crypto.randomBytes(16).toString("hex"),
      returnTo: returnTo?.startsWith("/") ? returnTo : undefined,
    })
  ).toString("base64url");

  const workos = new WorkOS(apiKey);
  const authUrl = workos.userManagement.getAuthorizationUrl({
    clientId,
    redirectUri,
    provider: "authkit",
    screenHint: "sign-in",
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
