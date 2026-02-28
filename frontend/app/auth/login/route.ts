import { WorkOS } from "@workos-inc/node";
import { NextResponse } from "next/server";

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export async function GET() {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId: process.env.WORKOS_CLIENT_ID!,
    redirectUri: process.env.WORKOS_REDIRECT_URI!,
    provider: "authkit",
  });

  return NextResponse.redirect(authorizationUrl);
}
