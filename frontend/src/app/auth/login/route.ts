import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  
  // If there's an error, redirect to platform dashboard
  if (error) {
    return NextResponse.redirect(new URL("/platform", request.url));
  }
  
  // Get returnTo parameter or default to platform
  const returnTo = searchParams.get("returnTo") || "/platform";
  
  // Instant server-side redirect to WorkOS API
  const loginApiUrl = new URL("/auth/login/api", request.url);
  if (returnTo !== "/platform") {
    loginApiUrl.searchParams.set("returnTo", returnTo);
  }
  
  return NextResponse.redirect(loginApiUrl);
}

export async function POST(request: NextRequest) {
  // Handle POST requests the same way
  const loginApiUrl = new URL("/auth/login/api", request.url);
  return NextResponse.redirect(loginApiUrl);
}
