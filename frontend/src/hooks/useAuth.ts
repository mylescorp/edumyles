"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback } from "react";

function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("edumyles_session="));
  return match ? match.split("=")[1] : null;
}

export function useAuth() {
  const sessionToken = getSessionToken();

  const user = useQuery(
    api.users.getCurrentUser,
    sessionToken ? { sessionToken } : "skip"
  );

  const isLoading = user === undefined;
  const isAuthenticated = !!user;

  const logout = useCallback(() => {
    window.location.href = "/auth/logout";
  }, []);

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated,
    role: user?.role ?? null,
    tenantId: user?.tenantId ?? null,
    logout,
    sessionToken,
  };
}
