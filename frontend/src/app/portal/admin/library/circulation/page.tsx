"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Book,
  Users,
  AlertTriangle,
  Clock,
  DollarSign,
  CheckCircle,
  RefreshCw,
  Search,
  Calendar,
  User
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function LibraryCirculationPage() {
  const { user, isLoading, sessionToken } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [borrowerId, setBorrowerId] = useState("");
  const [bookId, setBookId] = useState("");
  const [showAllOverdue, setShowAllOverdue] = useState(false);

  const activeBorrows = useQuery(
    api.modules.library.queries.listActiveBorrows,
    user ? { sessionToken: sessionToken ?? undefined } : "skip"
  );

  const overdueBorrows = useQuery(
    api.modules.library.queries.getOverdueBorrows,
    user ? { sessionToken: sessionToken ?? undefined } : "skip"
  );

  const books = useQuery(
    api.modules.library.queries.listBooks,
    user ? { sessionToken: sessionToken ?? undefined } : "skip"
  );

  const borrowBook = useMutation(api.modules.library.mutations.borrowBook);
  const returnBook = useMutation(api.modules.library.mutations.returnBook);

  const handleBorrowBook = async () => {
    if (!bookId || !borrowerId) {
      toast({
        title: "Error",
        description: "Please select both book and borrower",
        variant: "destructive"
      });
      return;
    }

    try {
      const dueDate = Date.now() + (14 * 24 * 60 * 60 * 1000); // 14 days from now

      await borrowBook({
        bookId: bookId as any,
        borrowerId,
        borrowerType: "student",
        dueDate,
      });

      toast({
        title: "Success",
        description: "Book borrowed successfully",
      });

      setBookId("");
      setBorrowerId("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to borrow book",
        variant: "destructive"
      });
    }
  };

  const handleReturnBook = async (borrowId: string) => {
    try {
      await returnBook({ borrowId: borrowId as any });

      toast({
        title: "Success",
        description: "Book returned successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to return book",
        variant: "destructive"
      });
    }
  };

  const calculateFine = (dueDate: number) => {
    const now = Date.now();
    if (dueDate >= now) return 0;

    const daysOverdue = Math.ceil((now - dueDate) / (24 * 60 * 60 * 1000));
    return daysOverdue * 10; // 10 cents per day
  };

  const filteredBorrows = (activeBorrows as any[])?.filter((borrow: any) => {
    const matchesSearch = borrow.borrowerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" ||
      (selectedStatus === "overdue" && borrow.dueDate < Date.now()) ||
      (selectedStatus === "active" && borrow.dueDate >= Date.now());

    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Library Circulation"
        description="Manage book borrowing, returns, and fine tracking"
      />

      <div className="space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="book">Select Book</Label>
                <Select value={bookId} onValueChange={setBookId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a book..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(books as any[])?.filter(book => book.availableQuantity > 0).map((book) => (
                      <SelectItem key={book._id} value={book._id}>
                        {book.title} - {book.author} ({book.availableQuantity} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="borrower">Borrower ID</Label>
                <Input
                  id="borrower"
                  placeholder="Enter student/staff ID..."
                  value={borrowerId}
                  onChange={(e) => setBorrowerId(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleBorrowBook}
              disabled={!bookId || !borrowerId}
              className="w-full mt-4"
            >
              <Book className="h-4 w-4 mr-2" />
              Borrow Book
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Borrows</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {activeBorrows?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Currently borrowed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overdueBorrows?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                KES {(overdueBorrows as any[])?.reduce((sum, borrow) => sum + calculateFine(borrow.dueDate), 0) / 100 || 0}
              </div>
              <p className="text-xs text-muted-foreground">Outstanding fines</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="search">Search Borrower</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by borrower ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Borrows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active Borrows ({filteredBorrows.length})
              </div>
                <Button size="sm" variant="outline" onClick={() => router.refresh()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBorrows.length === 0 ? (
              <div className="text-center py-8">
                <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Borrows Found</h3>
                <p className="text-muted-foreground">
                  No borrows match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(filteredBorrows as any[]).map((borrow) => {
                  const fine = calculateFine(borrow.dueDate);
                  const isOverdue = borrow.dueDate < Date.now();

                  return (
                    <div key={borrow._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">Book #{borrow.bookId.slice(-6)}</h4>
                            <Badge
                              variant={isOverdue ? "destructive" : "default"}
                            >
                              {isOverdue ? "Overdue" : "Active"}
                            </Badge>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Borrower</p>
                              <p className="font-medium">{borrow.borrowerId}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Type</p>
                              <p className="font-medium capitalize">{borrow.borrowerType}</p>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Borrowed</p>
                              <p className="font-medium">
                                {format(new Date(borrow.borrowedAt), "PPP")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Due Date</p>
                              <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                {format(new Date(borrow.dueDate), "PPP")}
                              </p>
                            </div>
                          </div>

                          {fine > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                              <DollarSign className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-600">
                                Fine: KES {fine / 100}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleReturnBook(borrow._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Return
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Alerts */}
        {overdueBorrows && overdueBorrows.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Overdue Books Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(showAllOverdue ? (overdueBorrows as any[]) : (overdueBorrows as any[])?.slice(0, 3)).map((borrow) => (
                  <div key={borrow._id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <p className="font-medium">Book #{borrow.bookId.slice(-6)}</p>
                      <p className="text-sm text-red-600">
                        {borrow.borrowerId} • {Math.ceil((Date.now() - borrow.dueDate) / (24 * 60 * 60 * 1000))} days overdue
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleReturnBook(borrow._id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Return Now
                    </Button>
                  </div>
                ))}
                {overdueBorrows.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => setShowAllOverdue((current) => !current)}
                  >
                    {showAllOverdue
                      ? "Show Top 3 Overdue"
                      : `View All Overdue (${overdueBorrows.length - 3} more)`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
