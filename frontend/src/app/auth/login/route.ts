import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("[auth/login/route] GET request received");
  
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  
  console.log("[auth/login/route] Request params:", { error, searchParams: Object.fromEntries(searchParams) });
  
  // If there's an error, redirect to home page (avoid redirect loop)
  if (error) {
    console.log("[auth/login/route] Error detected, redirecting to home");
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Get returnTo parameter or default to platform
  const returnTo = searchParams.get("returnTo") || "/platform";
  
  console.log("[auth/login/route] Redirecting to API with returnTo:", returnTo);
  
  // Instant server-side redirect to WorkOS API
  const loginApiUrl = new URL("/auth/login/api", request.url);
  if (returnTo !== "/platform") {
    loginApiUrl.searchParams.set("returnTo", returnTo);
  }
  
  console.log("[auth/login/route] Final redirect URL:", loginApiUrl.toString());
  
  return NextResponse.redirect(loginApiUrl);
}

export async function POST(request: NextRequest) {
  // Handle POST requests the same way
  const loginApiUrl = new URL("/auth/login/api", request.url);
  return NextResponse.redirect(loginApiUrl);
}
