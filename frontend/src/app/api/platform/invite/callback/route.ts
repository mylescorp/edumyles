import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getWorkOSClient() {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID;

  if (!apiKey || !clientId) {
    throw new Error("WORKOS_NOT_CONFIGURED");
  }

  return { workos: new WorkOS(apiKey), clientId };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This is our invite token

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/platform/invite/accept?token=${state}&error=auth_failed`);
    }

    const { workos, clientId } = getWorkOSClient();

    // Exchange code for access token and get user
    const { user } = await workos.userManagement.authenticateWithCode({
      code,
      clientId,
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
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/platform/invite/accept?token=${state}&success=true`);
  } catch (error) {
    console.error("Error in invite callback:", error);
    const searchParams = request.nextUrl.searchParams;
    const failureCode =
      error instanceof Error && error.message.includes("WORKOS_NOT_CONFIGURED")
        ? "workos_not_configured"
        : "callback_failed";
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/platform/invite/accept?token=${searchParams.get("state")}&error=${failureCode}`);
  }
}
