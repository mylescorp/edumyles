import { NextResponse } from "next/server";

export async function GET() {
  const clientId =
    process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || process.env.WORKOS_CLIENT_ID;
  const redirectUri =
    process.env.WORKOS_REDIRECT_URI ||
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
    "https://edumyles.vercel.app/auth/callback";

  if (!clientId) {
    console.error(
      "WorkOS client ID not configured. Set NEXT_PUBLIC_WORKOS_CLIENT_ID in environment variables.",
    );
    return NextResponse.redirect(
      new URL("/?auth_error=config", "https://edumyles.vercel.app"),
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    provider: "authkit",
    screen_hint: "sign-up",
  });

  return NextResponse.redirect(
    `https://api.workos.com/user-management/authorize?${params.toString()}`,
  );
}
