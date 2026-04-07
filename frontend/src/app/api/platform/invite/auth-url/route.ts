import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Store the token in session/cookie for post-auth processing
    const authUrl = workos.userManagement.getAuthorizationUrl({
      clientId: process.env.WORKOS_CLIENT_ID!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/platform/invite/callback`,
      state: token, // Pass the invite token as state
    });

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Error creating auth URL:", error);
    return NextResponse.json({ error: "Failed to create authentication URL" }, { status: 500 });
  }
}
