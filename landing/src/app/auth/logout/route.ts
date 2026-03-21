import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return null;
  }
  return new ConvexHttpClient(convexUrl);
}

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get("edumyles_session")?.value;
  const res = NextResponse.redirect(req.nextUrl.origin + "/");
  const isProduction = process.env.NODE_ENV === "production";

  if (sessionToken) {
    try {
      const convex = getConvexClient();
      if (convex) {
        await convex.mutation(api.sessions.deleteSession, { sessionToken });
      }
    } catch (error) {
      console.error("[landing logout] Failed to invalidate session:", error);
    }
  }

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
  res.cookies.set("workos_state", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return res;
}
