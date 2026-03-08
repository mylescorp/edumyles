"use client";

import { useQuery } from "./useSSRSafeConvex";
import { useAuth } from "./useAuth";

/**
 * Wrapper for platform queries that handles session authentication gracefully.
 * In development mode, bypass authentication to prevent errors.
 */
export function usePlatformQuery<T = any>(
  query: any,
  args: any,
  enabled: boolean = true
): T | undefined {
  const { sessionToken } = useAuth();
  
  // In development, skip authentication to prevent UNAUTHENTICATED errors
  const isDevMode = process.env.NODE_ENV === "development";
  const shouldSkip = !enabled || (!sessionToken && !isDevMode);

  return useQuery(query, shouldSkip ? "skip" : args);
}
