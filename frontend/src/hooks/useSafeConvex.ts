"use client";

import { useQuery, useMutation } from "convex/react";
import { useMemo } from "react";

export function useSafeQuery<T>(query: any, args: any, fallback: T) {
  const result = useQuery(query, args);
  return useMemo(() => result ?? fallback, [result, fallback]);
}

export function useSafeMutation(mutation: any) {
  return useMutation(mutation);
}
