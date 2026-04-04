// ============================================================
// EduMyles — Frontend Hook for getStudentsBySchool Query
// ============================================================

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useCallback } from "react";

export interface StudentFilters {
  status?: string;
  classId?: string;
  grade?: string;
  streamId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface StudentsBySchoolResult {
  students: any[];
  hasMore: boolean;
  total: number;
  nextCursor: string | null;
}

/**
 * Hook for fetching students by school with pagination and filtering
 */
export function useStudentsBySchool(orgId?: string) {
  const [filters, setFilters] = useState<StudentFilters>({});
  const [limit, setLimit] = useState(20);
  const [cursor, setCursor] = useState<string | null>(null);

  // Build query arguments
  const queryArgs = {
    orgId,
    limit,
    cursor,
    ...filters,
  };

  const result = useQuery(
    api.sis.studentQueries.getStudentsBySchool,
    Object.values(queryArgs).some(v => v !== undefined) ? queryArgs : null
  );

  const loadMore = useCallback(() => {
    if (result?.nextCursor) {
      setCursor(result.nextCursor);
    }
  }, [result?.nextCursor]);

  const reset = useCallback(() => {
    setCursor(null);
    setFilters({});
  }, []);

  const updateFilters = useCallback((newFilters: Partial<StudentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCursor(null); // Reset cursor when filters change
  }, []);

  return {
    ...result,
    filters,
    updateFilters,
    loadMore,
    reset,
    setLimit,
    isLoading: result === undefined,
  };
}

/**
 * Hook for student count statistics
 */
export function useStudentCount(orgId?: string) {
  return useQuery(api.sis.studentQueries.getStudentCountBySchool, {
    orgId,
  });
}
