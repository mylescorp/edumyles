"use client";

import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
export function useQuery(query: any, args: any) {
  return useConvexQuery(query, args);
}

export function useMutation(mutation: any) {
  return useConvexMutation(mutation);
}
