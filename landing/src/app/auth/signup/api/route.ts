import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Redirect to the main app's auth flow — all WorkOS handling is there.
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.redirect(new URL("/?auth_error=not_configured", req.url));
  }
  const email = req.nextUrl.searchParams.get("email");
  const qs = new URLSearchParams();
  if (email) qs.set("email", email);
  return NextResponse.redirect(`${appUrl}/auth/signup/api?${qs.toString()}`);
}

export async function POST() {
  return NextResponse.json({ error: "Use GET" }, { status: 405 });
}
