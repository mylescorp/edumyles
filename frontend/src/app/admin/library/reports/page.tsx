"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
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
import { useState } from "react";

export default function LibraryReportsPage() {
  const { isLoading } = useAuth();
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [reportType, setReportType] = useState("circulation");

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // Mock data for reports - in real app, this would come from API
  const circulationData = [
    { name: "Jan", borrowed: 145, returned: 132, overdue: 8 },
    { name: "Feb", borrowed: 167, returned: 158, overdue: 12 },
    { name: "Mar", borrowed: 189, returned: 176, overdue: 15 },
    { name: "Apr", borrowed: 156, returned: 148, overdue: 10 },
    { name: "May", borrowed: 178, returned: 165, overdue: 18 },
    { name: "Jun", borrowed: 195, returned: 182, overdue: 22 },
  ];

  const popularCategories = [
    { name: "Fiction", value: 34, color: "#056C40" },
    { name: "Science", value: 28, color: "#056CB8" },
    { name: "History", value: 18, color: "#FFD731" },
    { name: "Mathematics", value: 12, color: "#DC2626" },
    { name: "Literature", value: 8, color: "#7C3AED" },
  ];

  const borrowerStats = [
    { name: "Students", value: 245, color: "#056C40" },
    { name: "Teachers", value: 67, color: "#056CB8" },
    { name: "Staff", value: 23, color: "#FFD731" },
  ];

  const topBooks = [
    { title: "Introduction to Mathematics", author: "John Smith", borrows: 45, rating: 4.8 },
    { title: "Science Explorations", author: "Dr. Sarah Lee", borrows: 38, rating: 4.6 },
    { title: "History of Africa", author: "Prof. Michael Okonkwo", borrows: 32, rating: 4.7 },
    { title: "Literature Classics", author: "Jane Austen", borrows: 28, rating: 4.9 },
    { title: "Computer Science Fundamentals", author: "Tech Writers", borrows: 25, rating: 4.5 },
  ];

  const stats = {
    totalBooks: 1250,
    activeBorrowers: 335,
    monthlyCirculation: 892,
    overdueRate: 3.2,
    averageReadingTime: 14, // days
    collectionEfficiency: 94.5,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library Reports"
        description="Comprehensive analytics and insights for library management"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Generate PDF
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
            <div className="text-center text-muted-foreground py-8">
              Chart visualization would be implemented here
            </div>
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
            <div className="space-y-4">
              {popularCategories.map((category, index) => (
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
          <div className="space-y-4">
            {topBooks.map((book, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-forest-100 text-forest-600 rounded-full text-xs font-bold">
                      {index + 1}
                    </span>
                    <h4 className="font-medium">{book.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      ⭐ {book.rating}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground ml-9">{book.author}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{book.borrows} borrows</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>
            ))}
          </div>
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
              <span className="text-sm font-medium">{stats.averageReadingTime} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overdue Rate</span>
              <span className="text-sm font-medium">{stats.overdueRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Renewal Rate</span>
              <span className="text-sm font-medium">23%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className="text-sm font-medium text-green-600">1,125</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Borrowed</span>
              <span className="text-sm font-medium text-blue-600">89</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lost/Damaged</span>
              <span className="text-sm font-medium text-red-600">36</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Borrower Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Students</span>
              <span className="text-sm font-medium">245</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Teachers</span>
              <span className="text-sm font-medium">67</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Staff</span>
              <span className="text-sm font-medium">23</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
