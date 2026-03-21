"use client";

import { useQuery } from "./useSSRSafeConvex";
import { useAuth } from "./useAuth";

/**
 * Wrapper for platform queries that handles session authentication gracefully.
 */
export function usePlatformQuery<T = any>(
  query: any,
  args: any,
  enabled: boolean = true
): T | undefined {
  const { sessionToken } = useAuth();
  const shouldSkip = !enabled || !sessionToken;

  return useQuery(query, shouldSkip ? "skip" : args);
}
