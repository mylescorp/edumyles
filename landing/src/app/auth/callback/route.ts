import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");
  const baseUrl = request.nextUrl.origin;

  // Handle errors from WorkOS
  if (error) {
    console.error("WorkOS auth error:", error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/?auth_error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=no_code`);
  }

  // Redirect to frontend callback with the same code and state
  const frontendUrl = "https://edumyles.vercel.app";
  const callbackUrl = `${frontendUrl}/auth/callback${request.nextUrl.search}`;
  
  console.log("Redirecting to frontend callback:", callbackUrl);
  return NextResponse.redirect(callbackUrl);
}
