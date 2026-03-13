import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";

function buildAuthUrl(req: NextRequest, email?: string) {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId =
    process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;
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
    ...(email ? { loginHint: email } : {}),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email;
    const authUrl = buildAuthUrl(req, email);
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Login API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email") ?? undefined;
    const authUrl = buildAuthUrl(req, email);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Login redirect error:", error);
    const fallback = new URL("/", req.url);
    fallback.searchParams.set("authError", "login_unavailable");
    return NextResponse.redirect(fallback);
  }
}
