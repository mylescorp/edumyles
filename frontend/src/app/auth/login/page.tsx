import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const error = searchParams.get("error");
  
  // If there's an error, redirect to platform dashboard
  if (error) {
    return NextResponse.redirect(new URL("/platform", req.url));
  }
  
  // Get returnTo parameter or default to platform
  const returnTo = searchParams.get("returnTo") || "/platform";
  
  // Instant server-side redirect to WorkOS API
  const loginApiUrl = new URL("/auth/login/api", req.url);
  if (returnTo !== "/platform") {
    loginApiUrl.searchParams.set("returnTo", returnTo);
  }
  
  return NextResponse.redirect(loginApiUrl);
}

export async function POST(req: NextRequest) {
  // Handle POST requests the same way
  const loginApiUrl = new URL("/auth/login/api", req.url);
  return NextResponse.redirect(loginApiUrl);
}
