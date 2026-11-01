"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
let client: ConvexReactClient | null = null;

function getClient() {
  if (!client && convexUrl) client = new ConvexReactClient(convexUrl);
  return client;
}

export function LandingConvexProvider({ children }: { children: ReactNode }) {
  if (typeof window === "undefined" || !convexUrl) return <>{children}</>;
  const convex = getClient();
  return convex ? <ConvexProvider client={convex}>{children}</ConvexProvider> : <>{children}</>;
}
