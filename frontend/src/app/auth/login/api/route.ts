import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import crypto from "crypto";
import {
  canUseLocalDevAuth,
  redirectWithLocalDevSession,
} from "@/lib/devAuthRedirect";

export const dynamic = "force-dynamic";

function resolveRedirectUri(req: NextRequest): string {
  const currentOrigin = req.nextUrl.origin;
  const currentHost = req.nextUrl.host;
  const canonicalAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const configuredRedirectUri =
    process.env.WORKOS_REDIRECT_URI || process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;

  const approvedHosts = new Set(
    [
      canonicalAppUrl ? new URL(canonicalAppUrl).host : null,
      "app.edumyles.com",
    ].filter((host): host is string => Boolean(host))
  );
  const isPreviewHost =
    currentHost.endsWith(".vercel.app") && !approvedHosts.has(currentHost);

  if (isPreviewHost) {
    if (configuredRedirectUri) return configuredRedirectUri;
    if (canonicalAppUrl) return `${canonicalAppUrl}/auth/callback`;
    return "https://app.edumyles.com/auth/callback";
  }

  return `${currentOrigin}/auth/callback`;
}

export async function GET(req: NextRequest) {
  // Dev bypass — only permitted outside production to prevent redirect loops
  if (
    process.env.ENABLE_DEV_AUTH_BYPASS === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return redirectWithLocalDevSession(req);
  }

  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID || process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
  const redirectUri = resolveRedirectUri(req);

  if (!apiKey || !clientId) {
    if (canUseLocalDevAuth(req)) {
      console.warn(
        "[auth/login/api] WorkOS is not configured; using local development session."
      );
      return redirectWithLocalDevSession(req);
    }

    console.error("[auth/login/api] Missing WORKOS_API_KEY or client ID");
    return NextResponse.redirect(new URL("/auth/error?reason=not_configured", req.url));
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
    maxAge: 600,
    path: "/",
  });
  return response;
}
