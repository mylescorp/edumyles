import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
);

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get("edumyles_session")?.value;

  if (sessionToken) {
    try {
      const { api } = await import("../../convex/_generated/api");
      await convex.mutation(api.sessions.deleteSession, { sessionToken });
    } catch {
      // Session may already be expired/deleted — continue with logout
    }
  }

  const response = NextResponse.redirect(new URL("/auth/login", req.url));

  response.cookies.set("edumyles_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("edumyles_role", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
