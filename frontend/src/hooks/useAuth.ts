"use client";
import { useCallback, useEffect, useState } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

type Session = {
  _id: string;
  sessionToken: string;
  tenantId: string;
  userId: string;
  email: string;
  role: string;
  expiresAt: number;
};

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
);

const SESSION_COOKIE_NAME = "edumyles_session";

function getSessionTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (match) return decodeURIComponent(match.split("=")[1]);
  return null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const token = getSessionTokenFromCookie();
        if (!token) {
          if (!cancelled) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        const result = await convex.query(api.sessions.getSession, {
          sessionToken: token,
        });

        console.log("[useAuth] Session query result:", result);
        console.log("[useAuth] Token from cookie:", token);

        if (!cancelled) {
          setSession(result as Session | null);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call the logout API route
      const response = await fetch("/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Clear local storage and session storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login page
        const returnUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?returnUrl=${returnUrl}`;
      } else {
        console.error("Logout failed");
        // Fallback: still redirect to login
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: still redirect to login
      window.location.href = "/login";
    }
  }, []);

  return {
    user: session
      ? {
          _id: session.userId,
          email: session.email,
          role: session.role,
          tenantId: session.tenantId,
        }
      : null,
    isLoading,
    isAuthenticated: !!session,
    role: session?.role ?? null,
    tenantId: session?.tenantId ?? null,
    logout,
    sessionToken: session?.sessionToken ?? null,
  };
}
