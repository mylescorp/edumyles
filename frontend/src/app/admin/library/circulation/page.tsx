"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Calendar, 
  AlertCircle, 
  ArrowRight, 
  Search,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/formatters";

type BorrowRecord = {
  _id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  borrowerId: string;
  borrowerName: string;
  borrowerType: string;
  borrowedAt: number;
  dueDate: number;
  returnedAt?: number;
  status: "borrowed" | "returned" | "overdue";
  fineCents?: number;
};

export default function CirculationPage() {
  const { isLoading, sessionToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [borrowerTypeFilter, setBorrowerTypeFilter] = useState<string>("all");

  const activeBorrows = useQuery(
    api.modules.library.queries.listActiveBorrows,
    sessionToken ? {} : "skip"
  );

  const overdueBorrows = useQuery(
    api.modules.library.queries.getOverdueBorrows,
    sessionToken ? {} : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // Mock data for demonstration - in real app, this would come from API
  const allBorrows: BorrowRecord[] = [
    {
      _id: "1",
      bookId: "book1",
      bookTitle: "Introduction to Mathematics",
      bookAuthor: "John Smith",
      borrowerId: "student1",
      borrowerName: "Alice Johnson",
      borrowerType: "student",
      borrowedAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
      dueDate: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
      status: "overdue",
      fineCents: 200,
    },
    {
      _id: "2",
      bookId: "book2",
      bookTitle: "Science Explorations",
      bookAuthor: "Dr. Sarah Lee",
      borrowerId: "student2",
      borrowerName: "Bob Wilson",
      borrowerType: "student",
      borrowedAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
      dueDate: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days from now
      status: "borrowed",
    },
    {
      _id: "3",
      bookId: "book3",
      bookTitle: "History of Africa",
      bookAuthor: "Prof. Michael Okonkwo",
      borrowerId: "teacher1",
      borrowerName: "Mrs. Grace Kimani",
      borrowerType: "teacher",
      borrowedAt: Date.now() - 1000 * 60 * 60 * 24 * 14, // 14 days ago
      dueDate: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
      returnedAt: Date.now() - 1000 * 60 * 60 * 24 * 6, // 6 days ago
      status: "returned",
    },
  ];

  const filteredBorrows = allBorrows.filter(borrow => {
    const matchesSearch = searchTerm === "" || 
      borrow.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrow.bookAuthor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrow.borrowerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || borrow.status === statusFilter;
    const matchesBorrowerType = borrowerTypeFilter === "all" || borrow.borrowerType === borrowerTypeFilter;
    
    return matchesSearch && matchesStatus && matchesBorrowerType;
  });

  const stats = {
    totalActive: allBorrows.filter(b => b.status === "borrowed").length,
    overdue: allBorrows.filter(b => b.status === "overdue").length,
    returnedToday: allBorrows.filter(b => 
      b.status === "returned" && 
      b.returnedAt && 
      new Date(b.returnedAt).toDateString() === new Date().toDateString()
    ).length,
    totalFines: allBorrows.reduce((sum, b) => sum + (b.fineCents || 0), 0),
  };

  const columns: Column<BorrowRecord>[] = [
    {
      key: "bookTitle",
      header: "Book",
      sortable: true,
      cell: (row: BorrowRecord) => (
        <div>
          <p className="font-medium">{row.bookTitle}</p>
          <p className="text-sm text-muted-foreground">{row.bookAuthor}</p>
        </div>
      ),
    },
    {
      key: "borrowerName",
      header: "Borrower",
      sortable: true,
      cell: (row: BorrowRecord) => (
        <div>
          <p className="font-medium">{row.borrowerName}</p>
          <Badge variant="outline" className="text-xs">
            {row.borrowerType}
          </Badge>
        </div>
      ),
    },
    {
      key: "borrowedAt",
      header: "Borrowed",
      sortable: true,
      cell: (row: BorrowRecord) => formatDate(row.borrowedAt),
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortable: true,
      cell: (row: BorrowRecord) => {
        const isOverdue = row.dueDate < Date.now() && row.status === "borrowed";
        return (
          <div className="flex items-center gap-2">
            <span className={isOverdue ? "text-destructive font-medium" : ""}>
              {formatDate(row.dueDate)}
            </span>
            {isOverdue && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row: BorrowRecord) => {
        const statusConfig = {
          borrowed: { icon: BookOpen, color: "default", label: "Borrowed" },
          returned: { icon: CheckCircle, color: "secondary", label: "Returned" },
          overdue: { icon: XCircle, color: "destructive", label: "Overdue" },
        };
        
        const config = statusConfig[row.status];
        const Icon = config.icon;
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant={config.color as any} className="gap-1">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
            {row.fineCents && row.fineCents > 0 && (
              <span className="text-sm text-destructive">
                KES {(row.fineCents / 100).toFixed(2)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: BorrowRecord) => (
        <div className="flex items-center gap-2">
          {row.status === "borrowed" && (
            <Button size="sm" variant="outline">
              Return Book
            </Button>
          )}
          {row.status === "overdue" && (
            <Button size="sm" variant="destructive">
              Return & Collect Fine
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Circulation Tracking"
        description="Monitor book borrowing, returns, and overdue items"
        actions={
          <Button className="gap-2">
            <BookOpen className="h-4 w-4" />
            Borrow Book
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Active Borrows"
          value={stats.totalActive}
          description="Books currently borrowed"
          icon={BookOpen}
          trend={{ value: 5, isPositive: false }}
        />
        <AdminStatsCard
          title="Overdue Books"
          value={stats.overdue}
          description="Require immediate attention"
          icon={AlertCircle}
          variant="danger"
        />
        <AdminStatsCard
          title="Returned Today"
          value={stats.returnedToday}
          description="Books returned today"
          icon={CheckCircle}
          variant="success"
        />
        <AdminStatsCard
          title="Outstanding Fines"
          value={`KES ${(stats.totalFines / 100).toFixed(2)}`}
          description="Total unpaid fines"
          icon={AlertCircle}
          variant={stats.totalFines > 0 ? "warning" : "default"}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search books, authors, borrowers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="borrowed">Borrowed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="borrowerType">Borrower Type</Label>
              <Select value={borrowerTypeFilter} onValueChange={setBorrowerTypeFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Circulation Records */}
      <DataTable
        data={filteredBorrows}
        columns={columns}
        searchable={false} // We have custom search
        emptyTitle="No circulation records found"
        emptyDescription="No borrowing activity matches your current filters."
      />
    </div>
  );
}
