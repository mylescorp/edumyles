import { ConvexHttpClient } from "convex/browser";
import type { NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";

const PLATFORM_ROLES = new Set(["master_admin", "super_admin"]);

export type VerifiedSession = {
  sessionToken: string;
  role: string;
  expiresAt: number;
  impersonatedBy?: string;
};

function getServerSessionClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

  if (!convexUrl || !serverSecret) {
    return null;
  }

  return {
    client: new ConvexHttpClient(convexUrl),
    serverSecret,
  };
}

export async function getVerifiedSession(sessionToken: string): Promise<VerifiedSession | null> {
  const serverClient = getServerSessionClient();
  if (!serverClient) {
    return null;
  }

  const session = await serverClient.client.query(api.sessions.getSession, {
    sessionToken,
    serverSecret: serverClient.serverSecret,
  });

  if (!session?.sessionToken) {
    return null;
  }

  return {
    sessionToken: session.sessionToken,
    role: session.role,
    expiresAt: session.expiresAt,
    ...(session.impersonatedBy ? { impersonatedBy: session.impersonatedBy } : {}),
  };
}

export function isPlatformAdministrator(role: string) {
  return PLATFORM_ROLES.has(role);
}

export function hasSameOriginRequest(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin;
}

export function impersonationCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function clearImpersonationCookieOptions() {
  return {
    ...impersonationCookieOptions(0),
    expires: new Date(0),
  };
}
