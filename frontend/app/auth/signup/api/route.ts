import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, schoolName } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!schoolName || typeof schoolName !== "string") {
      return NextResponse.json(
        { error: "School name is required" },
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
    const redirectUri =
      process.env.WORKOS_REDIRECT_URI ?? "http://localhost:3000/auth/callback";

    if (!clientId) {
      return NextResponse.json(
        { error: "Authentication service not configured" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      provider: "authkit",
      login_hint: email,
      screen_hint: "sign-up",
    });

    // Store school name in state parameter so the callback can use it
    const state = Buffer.from(JSON.stringify({ schoolName })).toString("base64url");
    params.set("state", state);

    const authUrl = `https://api.workos.com/user-management/authorize?${params.toString()}`;

    return NextResponse.json({ authUrl });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
