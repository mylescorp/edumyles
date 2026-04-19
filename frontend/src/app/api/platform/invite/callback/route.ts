import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This is our invite token

    if (!code || !state) {
      return NextResponse.redirect(`${getAppUrl()}/platform/invite/accept?token=${state}&error=auth_failed`);
    }

    const client = getWorkOSClient();
    if (!client) {
      return NextResponse.redirect(`${getAppUrl()}/platform/invite/accept?token=${state}&error=workos_not_configured`);
    }

    const { user } = await client.workos.userManagement.authenticateWithCode({
      code,
      clientId: client.clientId,
    });

    // Accept the invite with the existing user
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    await convex.mutation(api.modules.platform.rbac.acceptPlatformInvite, {
      token: state,
      workosUserId: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    });

    // Redirect to success page
    return NextResponse.redirect(`${getAppUrl()}/platform/invite/accept?token=${state}&success=true`);
  } catch (error) {
    console.error("Error in invite callback:", error);
    const searchParams = request.nextUrl.searchParams;
    return NextResponse.redirect(`${getAppUrl()}/platform/invite/accept?token=${searchParams.get("state")}&error=callback_failed`);
  }
}
