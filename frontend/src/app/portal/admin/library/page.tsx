"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Library,
  BookOpen,
  RefreshCw,
  ArrowRight,
  BookMarked,
  AlertTriangle,
} from "lucide-react";

export default function LibraryIndexPage() {
  const { isLoading, sessionToken } = useAuth();

  const books = useQuery(
    api.modules.library.queries.listBooks,
    sessionToken ? { sessionToken } : "skip"
  );

  const circulations = useQuery(
    api.modules.library.queries.listBorrowHistory,
    sessionToken ? { sessionToken } : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const bookList        = (books ?? []) as any[];
  const circulationList = (circulations ?? []) as any[];
  const activeLoans     = circulationList.filter((c: any) => c.status === "borrowed").length;
  const overdue         = circulationList.filter((c: any) => c.status === "overdue").length;
  const available       = bookList.filter((b: any) => (b.availableCopies ?? b.copies ?? 1) > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Book catalogue, borrowing records and circulation management"
        breadcrumbs={[
          { label: "Admin Portal", href: "/portal/admin" },
          { label: "Library" },
        ]}
        actions={
          <Link href="/admin/library">
            <Button variant="outline" size="sm" className="gap-1.5">
              Full Library Panel <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Library className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bookList.length}</p>
              <p className="text-sm text-muted-foreground">Total Titles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{available}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <BookMarked className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeLoans}</p>
              <p className="text-sm text-muted-foreground">Active Loans</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-2xl font-bold">{overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
              {overdue > 0 && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">!</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Library className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-base">Library Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Full statistics dashboard — catalogue summary, popular titles and usage analytics.
            </p>
            <Link href="/portal/admin/library/dashboard">
              <Button className="w-full gap-2">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base">Circulation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Track borrowing and returns, manage overdue items and fine collections.
            </p>
            {overdue > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {overdue} overdue item{overdue !== 1 ? "s" : ""} need attention
              </div>
            )}
            <Link href="/portal/admin/library/circulation">
              <Button className="w-full gap-2">
                Manage Circulation <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
