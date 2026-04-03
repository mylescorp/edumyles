"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Users, 
  Download, 
  Calendar,
  FileText,
  PieChart,
  Activity
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatPercentage } from "@/lib/formatters";

type PopularCategory = {
  color: string;
  name: string;
  value: number;
};

type TopBook = {
  title: string;
  author: string;
  rating: number | null;
  borrows: number;
};

type CirculationPoint = {
  name: string;
  borrowed: number;
  returned: number;
  overdue: number;
};

type BorrowerStat = {
  name: string;
  value: number;
  color: string;
};

export default function LibraryReportsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [reportType, setReportType] = useState("circulation");

  const reports = usePlatformQuery(
    api.modules.library.queries.getLibraryReports,
    sessionToken ? { sessionToken, period: reportPeriod } : "skip",
    !!sessionToken
  );

  if (isLoading || !reports) return <LoadingSkeleton variant="page" />;

  const { stats, circulationData, popularCategories, borrowerStats, topBooks } = reports;
  const latestCirculation = circulationData[circulationData.length - 1];
  const inventorySummary = useMemo(() => {
    const borrowedNow = latestCirculation?.borrowed ?? 0;
    const returnedNow = latestCirculation?.returned ?? 0;
    const overdueNow = latestCirculation?.overdue ?? 0;
    const availableEstimate = Math.max(
      0,
      stats.totalBooks - Math.max(0, borrowedNow - returnedNow)
    );

    return {
      availableEstimate,
      borrowedNow: Math.max(0, borrowedNow - returnedNow),
      overdueNow,
    };
  }, [latestCirculation, stats.totalBooks]);

  const peakBorrowerType = borrowerStats[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library Reports"
        description="Comprehensive analytics and insights for library management"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" disabled>
              <Download className="h-4 w-4" />
              Export CSV Soon
            </Button>
            <Button className="gap-2" disabled>
              <FileText className="h-4 w-4" />
              PDF Export Soon
            </Button>
          </div>
        }
      />

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Report Period</label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circulation">Circulation Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="borrowers">Borrower Analysis</SelectItem>
                  <SelectItem value="performance">Performance Metrics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Reports currently show live Convex analytics for circulation, categories, borrower mix, and top books.
            File export actions are intentionally disabled until the export pipeline is wired.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total Books"
          value={stats.totalBooks.toLocaleString()}
          description="In library collection"
          icon={BookOpen}
          trend={{ value: 8, isPositive: true }}
        />
        <AdminStatsCard
          title="Active Borrowers"
          value={stats.activeBorrowers}
          description="This month"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <AdminStatsCard
          title="Monthly Circulation"
          value={stats.monthlyCirculation}
          description="Books borrowed/returned"
          icon={Activity}
          variant="success"
          trend={{ value: 5, isPositive: true }}
        />
        <AdminStatsCard
          title="Collection Efficiency"
          value={`${stats.collectionEfficiency}%`}
          description="Return rate"
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Circulation Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {circulationData.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No circulation trend data is available for the selected period yet.
              </div>
            ) : (
              <div className="space-y-4">
                {circulationData.map((month: CirculationPoint) => {
                  const maxValue = Math.max(
                    1,
                    ...circulationData.flatMap((entry: CirculationPoint) => [entry.borrowed, entry.returned, entry.overdue])
                  );
                  return (
                    <div key={month.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month.name}</span>
                        <span className="text-muted-foreground">
                          {month.borrowed} borrowed · {month.returned} returned · {month.overdue} overdue
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-xs text-muted-foreground">Borrowed</span>
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${(month.borrowed / maxValue) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-xs text-muted-foreground">Returned</span>
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-green-500"
                              style={{ width: `${(month.returned / maxValue) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-xs text-muted-foreground">Overdue</span>
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-amber-500"
                              style={{ width: `${(month.overdue / maxValue) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Popular Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularCategories.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No category data is available yet.
              </div>
            ) : (
              <div className="space-y-4">
                {popularCategories.map((category: PopularCategory, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${category.value}%`,
                          backgroundColor: category.color 
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {category.value}%
                    </span>
                  </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Books Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Most Popular Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topBooks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No borrowing activity has been recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {topBooks.map((book: TopBook, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-success-bg text-primary rounded-full text-xs font-bold">
                        {index + 1}
                      </span>
                      <h4 className="font-medium">{book.title}</h4>
                      {book.rating !== null ? (
                        <Badge variant="outline" className="text-xs">
                          ⭐ {book.rating}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Borrow data only
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground ml-9">{book.author}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{book.borrows} borrows</p>
                    <p className="text-xs text-muted-foreground">Across recorded history</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reading Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg. Reading Time</span>
              <span className="text-sm font-medium">
                {stats.averageReadingTime == null ? "Not enough data" : `${stats.averageReadingTime} days`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overdue Rate</span>
              <span className="text-sm font-medium">{formatPercentage((stats.overdueRate ?? 0) / 100)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Collection Efficiency</span>
              <span className="text-sm font-medium">
                {stats.collectionEfficiency == null ? "Not enough data" : `${stats.collectionEfficiency}%`}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Estimate</span>
              <span className="text-sm font-medium text-green-600">{inventorySummary.availableEstimate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Currently Borrowed</span>
              <span className="text-sm font-medium text-blue-600">{inventorySummary.borrowedNow}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overdue Right Now</span>
              <span className="text-sm font-medium text-red-600">{inventorySummary.overdueNow}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Borrower Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {borrowerStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No borrower activity has been recorded yet.</p>
            ) : (
              borrowerStats.map((entry: BorrowerStat) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="text-sm font-medium">{entry.value}</span>
                </div>
              ))
            )}
            {peakBorrowerType && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Most active borrower segment</p>
                <p className="text-muted-foreground">
                  {peakBorrowerType.name} currently leads with {peakBorrowerType.value} recorded borrows.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
