"use client";

import { ReactNode } from "react";
import { ConvexProvider } from "@/hooks/useSSRSafeConvex";
import { convexClient } from "@/lib/convex";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
