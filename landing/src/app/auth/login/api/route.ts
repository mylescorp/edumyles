import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function resolveRedirectUri(req: NextRequest): string {
  const currentOrigin = req.nextUrl.origin;
  const currentHost = req.nextUrl.host;
  const canonicalLandingUrl = process.env.NEXT_PUBLIC_LANDING_URL?.replace(/\/$/, "");
  const configuredRedirectUri =
    process.env.WORKOS_REDIRECT_URI || process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;

  const approvedHosts = new Set(["edumyles.vercel.app", "edumyles-frontend.vercel.app"]);
  const isPreviewHost =
    currentHost.endsWith(".vercel.app") && !approvedHosts.has(currentHost);

  if (isPreviewHost) {
    if (configuredRedirectUri) return configuredRedirectUri;
    if (canonicalLandingUrl) return `${canonicalLandingUrl}/auth/callback`;
    return "https://edumyles.vercel.app/auth/callback";
  }

  return `${currentOrigin}/auth/callback`;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
  const redirectUri = resolveRedirectUri(req);

  if (!apiKey || !clientId) {
    console.error("[landing/auth/login/api] Missing WorkOS env vars");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const errorUrl = appUrl
      ? `${appUrl}/auth/error?reason=not_configured`
      : `${req.nextUrl.origin}/auth/error?reason=not_configured`;
    return NextResponse.redirect(errorUrl);
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
