import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(req.nextUrl.origin + "/");
  const isProduction = process.env.NODE_ENV === "production";

  res.cookies.set("edumyles_session", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  res.cookies.set("edumyles_user", "", {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  res.cookies.set("edumyles_role", "", {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return res;
}
