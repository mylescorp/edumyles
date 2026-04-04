import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const redirectUrl = new URL("/auth/signup", req.url);
  if (email) redirectUrl.searchParams.set("email", email);
  return NextResponse.redirect(redirectUrl);
}

export async function POST() {
  return NextResponse.json({ error: "Use GET" }, { status: 405 });
}
