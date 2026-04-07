import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This is our invite token

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/platform/invite/accept?token=${state}&error=auth_failed`);
    }

    // Exchange code for access token and get user
    const { user } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: process.env.WORKOS_CLIENT_ID!,
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
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/platform/invite/accept?token=${searchParams.get("state")}&error=callback_failed`);
  }
}
