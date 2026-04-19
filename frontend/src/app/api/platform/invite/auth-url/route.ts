import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function getWorkOSClient() {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!apiKey || !clientId) {
    return null;
  }

  return {
    workos: new WorkOS(apiKey),
    clientId,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const client = getWorkOSClient();
    if (!client) {
      return NextResponse.json({
        url: `${getAppUrl()}/platform/invite/accept?token=${encodeURIComponent(token)}`,
        warning: "WORKOS_NOT_CONFIGURED",
      });
    }

    const authUrl = client.workos.userManagement.getAuthorizationUrl({
      clientId: client.clientId,
      redirectUri: `${getAppUrl()}/api/platform/invite/callback`,
      state: token,
    });

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Error creating auth URL:", error);
    return NextResponse.json({ error: "Failed to create authentication URL" }, { status: 500 });
  }
}
