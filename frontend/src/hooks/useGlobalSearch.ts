"use client";

import { useState, useMemo, useCallback } from "react";

interface SearchFilters {
  query: string;
  tenantId: string;
  status: string;
  plan: string;
  dateRange: string;
}

export function useGlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    tenantId: '',
    status: '',
    plan: '',
    dateRange: ''
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    (value: string) => {
      const timer = setTimeout(() => {
        setSearchTerm(value);
      }, 300);
      return () => clearTimeout(timer);
    },
    []
  );

  const updateFilter = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      tenantId: '',
      status: '',
      plan: '',
      dateRange: ''
    });
    setSearchTerm('');
  }, []);

  // Filtered data based on search and filters
  const filteredData = useMemo(() => {
    // This would be used to filter tenant/user data
    return {
      searchTerm,
      filters,
      hasActiveFilters: Object.values(filters).some(v => v !== ''),
      clearFilters
    };
  }, [searchTerm, filters]);

  return {
    searchTerm,
    debouncedSearch,
    filters,
    updateFilter,
    clearFilters,
    filteredData
  };
}
