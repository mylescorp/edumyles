import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;
    const redirectUri =
      process.env.WORKOS_REDIRECT_URI ||
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
      `${req.nextUrl.origin}/auth/callback`;

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
      login_hint: email,
      screen_hint: "sign-up",
    });

    const authUrl = `https://api.workos.com/user-management/authorize?${params.toString()}`;

    return NextResponse.json({ authUrl });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
