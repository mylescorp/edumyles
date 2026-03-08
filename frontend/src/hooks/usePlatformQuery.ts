"use client";

import { useEffect, useState } from "react";
import { useQuery } from "./useSSRSafeConvex";

/**
 * Wrapper for platform queries that handles session authentication errors gracefully.
 * In development mode, mock sessions may not exist in the database, causing
 * "UNAUTHENTICATED: Session not found" errors. This hook detects such errors
 * and prevents repeated failed queries.
 */
export function usePlatformQuery<T = any>(
  query: any,
  args: any,
  enabled: boolean = true
): T | undefined {
  const [queryError, setQueryError] = useState(false);
  
  const result = useQuery(
    query,
    enabled && !queryError ? args : "skip"
  );

  // Handle query errors gracefully
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (result === undefined && enabled && args !== "skip") {
      // If we have valid args but get undefined, it might be an auth error
      // Set error state to prevent repeated failed queries
      timer = setTimeout(() => {
        setQueryError(true);
      }, 1000);
    } else if (result !== undefined) {
      setQueryError(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [result, enabled, args]);

  return result;
}
