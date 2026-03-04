import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId =
      process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID ||
      process.env.WORKOS_CLIENT_ID;
    const redirectUri =
      process.env.WORKOS_REDIRECT_URI ||
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
      req.nextUrl.origin + "/auth/callback";

    if (!clientId || !apiKey) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 500 }
      );
    }

    const workos = new WorkOS(apiKey);
    const authUrl = workos.userManagement.getAuthorizationUrl({
      clientId,
      redirectUri,
      provider: "authkit",
      screenHint: "sign-in",
      ...(email ? { loginHint: email } : {}),
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
