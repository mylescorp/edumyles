import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import crypto from "crypto";
import { encodeAuthState, getLandingRedirectUri, sanitizeReturnTo } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getWorkOSClient() {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId =
    process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;

  if (!apiKey || !clientId) {
    return null;
  }

  return {
    workos: new WorkOS(apiKey),
    clientId,
  };
}

function createAuthResponse({
  authUrl,
  state,
  response,
}: {
  authUrl: string;
  state: string;
  response: NextResponse;
}) {
  response.cookies.set("workos_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}

function buildAuthorizationUrl(params: {
  req: NextRequest;
  email?: string;
  provider?: string;
  returnTo?: string;
}) {
  const workosClient = getWorkOSClient();
  if (!workosClient) {
    return null;
  }

  const state = encodeAuthState({
    nonce: crypto.randomBytes(16).toString("hex"),
    mode: "sign-in",
    returnTo: sanitizeReturnTo(params.returnTo, "/admin"),
  });

  const redirectUri = getLandingRedirectUri(params.req.nextUrl.origin);
  const baseConfig = {
    clientId: workosClient.clientId,
    redirectUri,
    screenHint: "sign-in" as const,
    ...(params.email ? { loginHint: params.email } : {}),
    state,
  };

  const providerConfig =
    params.provider === "google"
      ? { ...baseConfig, provider: "Google" as const }
      : params.provider === "microsoft"
        ? { ...baseConfig, provider: "Microsoft" as const }
        : { ...baseConfig, provider: "authkit" as const };

  return {
    authUrl: workosClient.workos.userManagement.getAuthorizationUrl(providerConfig),
    state,
  };
}

export async function GET(req: NextRequest) {
  const redirect = buildAuthorizationUrl({
    req,
    email: req.nextUrl.searchParams.get("email") ?? undefined,
    provider: req.nextUrl.searchParams.get("provider") ?? undefined,
    returnTo: req.nextUrl.searchParams.get("returnTo") ?? undefined,
  });

  if (!redirect) {
    return NextResponse.redirect(new URL("/auth/login?error=not_configured", req.url));
  }

  return createAuthResponse({
    authUrl: redirect.authUrl,
    state: redirect.state,
    response: NextResponse.redirect(redirect.authUrl),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const redirect = buildAuthorizationUrl({
      req,
      email: body?.email,
      provider: body?.provider,
      returnTo: body?.returnTo,
    });

    if (!redirect) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 500 }
      );
    }

    return createAuthResponse({
      authUrl: redirect.authUrl,
      state: redirect.state,
      response: NextResponse.json({ authUrl: redirect.authUrl }),
    });
  } catch (error) {
    console.error("[landing auth login] Failed to build sign-in URL:", error);
    return NextResponse.json(
      { error: "Sign-in is currently unavailable" },
      { status: 500 }
    );
  }
}
