"use client";
import { useCallback, useEffect, useState } from "react";

type Session = {
  sessionToken: string;
  tenantId: string;
  userId: string;
  email: string;
  role: string;
  expiresAt: number;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        // Use server-side API endpoint to validate the httpOnly session cookie
        const res = await fetch("/api/auth/session", {
          credentials: "same-origin",
        });

        if (!res.ok) {
          if (!cancelled) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        const data = await res.json();

        if (!cancelled) {
          setSession(data.session as Session | null);
          setIsLoading(false);
          
          // Store session in localStorage for Convex client
          if (data.session) {
            localStorage.setItem('convex_auth', JSON.stringify(data.session));
          }
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
        setSession(null);
        setIsLoading(false);
        
        // Clear session from localStorage
        localStorage.removeItem('convex_auth');
      }

      if (response.ok) {
        // Clear local storage and session storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to login page
        const returnUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/auth/login?returnUrl=${returnUrl}`;
      } else {
        console.error("Logout failed");
        // Fallback: still redirect to login
        window.location.href = "/auth/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: still redirect to login
      window.location.href = "/auth/login";
    }
  }, []);

  return {
    user: session
      ? {
          _id: session.userId,
          email: session.email,
          role: session.role,
          tenantId: session.tenantId,
          firstName: session.email.split("@")[0],
          lastName: "",
          avatarUrl: undefined as string | undefined,
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
