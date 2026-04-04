// ============================================================
// EduMyles — Frontend Hook for getStudentsBySchool Query
// ============================================================

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

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

/**
 * Example usage component
 */
export function StudentList({ orgId }: { orgId?: string }) {
  const {
    students,
    hasMore,
    total,
    filters,
    updateFilters,
    loadMore,
    isLoading,
  } = useStudentsBySchool(orgId);

  const { data: countData } = useStudentCount(orgId);

  if (isLoading && !students) {
    return <div>Loading students...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {countData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{countData.total}</div>
            <div className="text-sm text-blue-800">Total Students</div>
          </div>
          {Object.entries(countData.byStatus).map(([status, count]) => (
            <div key={status} className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{count}</div>
              <div className="text-sm text-gray-800 capitalize">{status}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.status || ""}
          onChange={(e) => updateFilters({ status: e.target.value || undefined })}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
          <option value="suspended">Suspended</option>
        </select>

        <input
          type="text"
          placeholder="Search students..."
          value={filters.search || ""}
          onChange={(e) => updateFilters({ search: e.target.value || undefined })}
          className="px-3 py-2 border rounded-md"
        />

        <select
          value={filters.sortBy || ""}
          onChange={(e) => updateFilters({ sortBy: e.target.value || undefined })}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Sort By</option>
          <option value="name">Name</option>
          <option value="admissionNumber">Admission Number</option>
          <option value="enrolledAt">Enrollment Date</option>
        </select>

        <select
          value={filters.sortOrder || ""}
          onChange={(e) => updateFilters({ sortOrder: e.target.value || undefined })}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Order</option>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {students?.length || 0} of {total} students
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {students?.map((student) => (
          <div key={student._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">
                  {student.firstName} {student.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  Admission: {student.admissionNumber}
                </p>
                <p className="text-sm text-gray-600">
                  Class: {student.class?.name || 'Unassigned'}
                </p>
                <p className="text-sm text-gray-600">
                  Status: <span className="capitalize">{student.status}</span>
                </p>
              </div>
              {student.photoUrl && (
                <img
                  src={student.photoUrl}
                  alt={`${student.firstName} ${student.lastName}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={loadMore}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Load More Students
        </button>
      )}

      {/* No Results */}
      {!isLoading && (!students || students.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No students found matching the current filters.
        </div>
      )}
    </div>
  );
}
