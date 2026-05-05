"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./SearchInput";
import { EmptyState } from "./EmptyState";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

/** When provided, enables server-side load-more pagination (Convex usePaginatedQuery style). */
interface ServerPagination {
  /** Whether the server has more pages to load. */
  isDone: boolean;
  /** Call to fetch the next page (pass desired items per page). */
  loadMore: (numItems: number) => void;
  /** Optional total count shown in the footer. */
  totalCount?: number;
  /** Show a loading spinner on the load-more button. */
  isLoading?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKey?: (row: T) => string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: string;
  className?: string;
  /** When provided, replaces client-side pagination with a server-side load-more control. */
  serverPagination?: ServerPagination;
}

export function DataTable<T>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = "Search...",
  searchKey,
  pageSize = 25,
  emptyTitle = "No data",
  emptyDescription = "No records found.",
  emptyMessage,
  className,
  serverPagination,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const safeData = Array.isArray(data) ? data : [];

  const filtered = useMemo(() => {
    if (!search || !searchKey) return safeData;
    const lower = search.toLowerCase();
    return safeData.filter((row) => searchKey(row).toLowerCase().includes(lower));
  }, [safeData, search, searchKey]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const col = columns.find((c) => c.key === sortKey);
      if (!col) return 0;
      const aVal = String(col.cell(a) ?? "");
      const bVal = String(col.cell(b) ?? "");
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  // When server pagination is active, skip client-side slicing — data grows via loadMore.
  const totalPages = serverPagination ? 1 : Math.ceil(sorted.length / pageSize);
  const paginated = serverPagination ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {searchable && (
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          className="max-w-sm"
        />
      )}

      {paginated.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={emptyTitle}
          description={emptyMessage ?? emptyDescription}
        />
      ) : (
        <>
          <div className="overflow-x-auto -mx-1">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(col.sortable && "cursor-pointer select-none", col.className)}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        <span className="text-xs">{sortDir === "asc" ? "^" : "v"}</span>
                      )}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {/* Server-side load-more pagination */}
          {serverPagination && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
              <span>
                {serverPagination.totalCount !== undefined
                  ? `Showing ${sorted.length} of ${serverPagination.totalCount}`
                  : `Showing ${sorted.length} records`}
              </span>
              {!serverPagination.isDone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => serverPagination.loadMore(pageSize)}
                  disabled={serverPagination.isLoading}
                >
                  {serverPagination.isLoading ? "Loading..." : "Load more"}
                  {!serverPagination.isLoading && <ChevronRight className="ml-1 h-4 w-4" />}
                </Button>
              )}
            </div>
          )}

          {/* Client-side pagination */}
          {!serverPagination && totalPages > 1 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
              <span>
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sorted.length)} of{" "}
                {sorted.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
