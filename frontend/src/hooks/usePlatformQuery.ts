"use client";

import { useQuery } from "./useSSRSafeConvex";

/**
 * Wrapper for platform queries that handles session authentication gracefully.
 */
export function usePlatformQuery<T = any>(
  query: any,
  args: any,
  enabled: boolean = true
): T | undefined {
  const hasSessionToken =
    typeof args?.sessionToken === "string" ? args.sessionToken.trim().length > 0 : true;
  const shouldSkip = !enabled || !hasSessionToken;

  const result = useQuery(query, shouldSkip ? "skip" : args);
  return result?.data;
}
