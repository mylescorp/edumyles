import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.WORKOS_API_KEY;
    const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
    const redirectUri =
      process.env.WORKOS_REDIRECT_URI ?? "http://localhost:3000/auth/callback";

    if (!apiKey || !clientId) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 500 }
      );
    }

    // Build the WorkOS authorization URL for magic link
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      provider: "authkit",
      login_hint: email,
    });

    const authUrl = `https://api.workos.com/sso/authorize?${params.toString()}`;

    return NextResponse.json({ authUrl });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
