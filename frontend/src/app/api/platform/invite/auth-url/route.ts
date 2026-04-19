import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";

function getWorkOSClient() {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID;

  if (!apiKey || !clientId) {
    throw new Error("WORKOS_NOT_CONFIGURED");
  }

  return { workos: new WorkOS(apiKey), clientId };
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const { workos, clientId } = getWorkOSClient();

    // Store the token in session/cookie for post-auth processing
    const authUrl = workos.userManagement.getAuthorizationUrl({
      clientId,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/platform/invite/callback`,
      state: token, // Pass the invite token as state
    });

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Error creating auth URL:", error);
    if (error instanceof Error && error.message.includes("WORKOS_NOT_CONFIGURED")) {
      return NextResponse.json({ error: "WorkOS is not configured in this environment" }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create authentication URL" }, { status: 500 });
  }
}
