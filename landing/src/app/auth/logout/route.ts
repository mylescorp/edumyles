import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  const response = NextResponse.redirect(`${baseUrl}/`);

  // Clear all auth cookies
  response.cookies.set("edumyles_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("edumyles_user", "", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
