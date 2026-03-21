"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { type ReactNode, useEffect, useState } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

// Singleton Convex client — lazy-initialized client-side only
let _client: ConvexReactClient | null = null;
function getClient(): ConvexReactClient {
  if (!_client) {
    if (!convexUrl) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
    _client = new ConvexReactClient(convexUrl);
  }
  return _client;
}

/**
 * Wraps the app with a plain ConvexProvider.
 *
 * We use custom cookie-based sessions (edumyles_session) — auth tokens are
 * passed directly as query/mutation arguments, not via WorkOS JWT sessions.
 * A plain ConvexProvider is all that's needed here.
 *
 * Defers rendering until client-side to avoid SSR issues
 * (Convex requires browser environment).
 */
export function ConvexAuthProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR / static generation, render nothing to avoid Convex context errors.
  if (!mounted) return null;

  return <ConvexProvider client={getClient()}>{children}</ConvexProvider>;
}
