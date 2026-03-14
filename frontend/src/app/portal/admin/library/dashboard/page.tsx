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
  TrendingUp,
  Clock,
  DollarSign,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

interface LibraryStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
  totalFines: number;
  activeBorrows: number;
}

export default function LibraryDashboardPage() {
  const { user, isLoading, sessionToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [focusedBookId, setFocusedBookId] = useState<string | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    title: "",
    author: "",
    category: "",
    quantity: "0",
  });

  const books = useQuery(
    api.modules.library.queries.listBooks,
    user
      ? {
          category: selectedCategory === "all" ? undefined : selectedCategory,
          sessionToken: sessionToken ?? undefined,
        }
      : "skip"
  );

  const activeBorrows = useQuery(
    api.modules.library.queries.listActiveBorrows,
    user ? { sessionToken: sessionToken ?? undefined } : "skip"
  );

  const overdueBorrows = useQuery(
    api.modules.library.queries.getOverdueBorrows,
    user ? { sessionToken: sessionToken ?? undefined } : "skip"
  );

  const lowStockBooks = useQuery(
    api.modules.library.queries.getLowStockBooks,
    user
      ? {
          threshold: 3,
          sessionToken: sessionToken ?? undefined,
        }
      : "skip"
  );

  const createBook = useMutation(api.modules.library.mutations.createBook);
  const updateBook = useMutation(api.modules.library.mutations.updateBook);

  const handleCreateBook = async () => {
    try {
      await createBook({
        title: "New Book",
        author: "Author Name",
        category: "Fiction",
        quantity: 5,
        isbn: "978-0-123456-78-9",
      });

      toast({
        title: "Success",
        description: "Book created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create book",
        variant: "destructive"
      });
    }
  };

  const handleExportLibraryReport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      selectedCategory,
      searchTerm,
      stats: libraryStats,
      totalBooks: filteredBooks.length,
      activeBorrows: activeBorrows?.length ?? 0,
      overdueBorrows: overdueBorrows?.length ?? 0,
    };

    const dataStr = JSON.stringify(payload, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const linkElement = document.createElement("a");
    linkElement.href = dataUri;
    linkElement.download = `library-report-${new Date().toISOString().split("T")[0]}.json`;
    linkElement.click();

    toast({
      title: "Library report exported",
      description: "Downloaded current library dashboard snapshot as JSON.",
    });
  };

  const handleViewBook = (book: any) => {
    setSearchTerm(book.title);
    setFocusedBookId(book._id);
    document.getElementById(`book-${book._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleStartEdit = (book: any) => {
    setEditingBookId(book._id);
    setEditDraft({
      title: book.title ?? "",
      author: book.author ?? "",
      category: book.category ?? "",
      quantity: String(book.quantity ?? 0),
    });
    document.getElementById(`book-${book._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSaveEdit = async () => {
    if (!editingBookId) return;

    const parsedQuantity = Number.parseInt(editDraft.quantity, 10);
    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be a zero or positive whole number.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateBook({
        bookId: editingBookId as any,
        title: editDraft.title.trim(),
        author: editDraft.author.trim(),
        category: editDraft.category.trim().toLowerCase(),
        quantity: parsedQuantity,
      });

      toast({
        title: "Book updated",
        description: "Catalog details were saved.",
      });
      setEditingBookId(null);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not save book changes.",
        variant: "destructive",
      });
    }
  };

  const calculateLibraryStats = (): LibraryStats => {
    const totalBooks = books?.length || 0;
    const availableBooks = (books as any[])?.reduce((sum, book) => sum + book.availableQuantity, 0) || 0;
    const totalQuantity = (books as any[])?.reduce((sum, book) => sum + book.quantity, 0) || 0;
    const borrowedBooks = totalQuantity - availableBooks;
    const overdueBooksCount = overdueBorrows?.length || 0;
    const activeBorrowsCount = activeBorrows?.length || 0;

    // Calculate total fines from overdue books
    const totalFines = (overdueBorrows as any[])?.reduce((sum, borrow) => {
      const daysOverdue = Math.ceil((Date.now() - borrow.dueDate) / (24 * 60 * 60 * 1000));
      return sum + (daysOverdue * 10); // 10 cents per day
    }, 0) || 0;

    return {
      totalBooks,
      availableBooks,
      borrowedBooks,
      overdueBooks: overdueBooksCount,
      totalFines,
      activeBorrows: activeBorrowsCount,
    };
  };

  const libraryStats = calculateLibraryStats();

  const filteredBooks = (books as any[])?.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Library Management"
        description="Manage books, circulation, and fine tracking"
      />

      <div className="space-y-6">
        {/* Statistics Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{libraryStats.totalBooks}</div>
              <p className="text-xs text-muted-foreground">In catalog</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{libraryStats.availableBooks}</div>
              <p className="text-xs text-muted-foreground">Ready to borrow</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Borrows</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{libraryStats.activeBorrows}</div>
              <p className="text-xs text-muted-foreground">Currently borrowed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{libraryStats.overdueBooks}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button className="w-full justify-start" variant="outline" onClick={handleCreateBook}>
                <Book className="h-4 w-4 mr-2" />
                Add New Book
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={handleExportLibraryReport}>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/portal/admin/library/circulation">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Collect Fines
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {(lowStockBooks && lowStockBooks.length > 0) || (overdueBorrows && overdueBorrows.length > 0) ? (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Library Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockBooks && lowStockBooks.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="destructive">Low Stock</Badge>
                    <span className="text-orange-700">
                      {lowStockBooks.length} book{lowStockBooks.length > 1 ? 's' : ''} running low on copies
                    </span>
                  </div>
                )}
                {overdueBorrows && overdueBorrows.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="destructive">Overdue</Badge>
                    <span className="text-orange-700">
                      {overdueBorrows.length} book{overdueBorrows.length > 1 ? 's' : ''} overdue for return
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Books Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Books Catalog ({filteredBooks.length})
              </div>
              <Button size="sm" onClick={handleCreateBook}>
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="space-y-2">
                <Label htmlFor="search">Search Books</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title, author, or ISBN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="fiction">Fiction</SelectItem>
                    <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                    <SelectItem value="reference">Reference</SelectItem>
                    <SelectItem value="textbook">Textbook</SelectItem>
                    <SelectItem value="children">Children</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Books List */}
            <div className="space-y-4">
              {(filteredBooks as any[]).slice(0, 10).map((book) => (
                <div
                  key={book._id}
                  id={`book-${book._id}`}
                  className={`border rounded-lg p-4 ${focusedBookId === book._id ? "ring-2 ring-primary/40" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{book.title}</h4>
                        <Badge variant={book.availableQuantity > 0 ? "default" : "secondary"}>
                          {book.availableQuantity > 0 ? `Available (${book.availableQuantity})` : "Out of Stock"}
                        </Badge>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Author</p>
                          <p className="font-medium">{book.author}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Category</p>
                          <p className="font-medium capitalize">{book.category}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">ISBN</p>
                          <p className="font-medium">{book.isbn || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Copies</p>
                          <p className="font-medium">{book.quantity}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewBook(book)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStartEdit(book)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {editingBookId === book._id && (
                    <div className="mt-4 border-t pt-4 space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`title-${book._id}`}>Title</Label>
                          <Input
                            id={`title-${book._id}`}
                            value={editDraft.title}
                            onChange={(e) => setEditDraft((current) => ({ ...current, title: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`author-${book._id}`}>Author</Label>
                          <Input
                            id={`author-${book._id}`}
                            value={editDraft.author}
                            onChange={(e) => setEditDraft((current) => ({ ...current, author: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`category-${book._id}`}>Category</Label>
                          <Input
                            id={`category-${book._id}`}
                            value={editDraft.category}
                            onChange={(e) => setEditDraft((current) => ({ ...current, category: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`quantity-${book._id}`}>Quantity</Label>
                          <Input
                            id={`quantity-${book._id}`}
                            type="number"
                            min={0}
                            value={editDraft.quantity}
                            onChange={(e) => setEditDraft((current) => ({ ...current, quantity: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setEditingBookId(null)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredBooks.length > 10 && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/portal/admin/library/circulation">
                    View All Books ({filteredBooks.length - 10} more)
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(activeBorrows as any[])?.slice(0, 5).map((borrow) => (
                <div key={borrow._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Book #{borrow.bookId.slice(-6)}</p>
                    <p className="text-sm text-muted-foreground">
                      Borrowed by {borrow.borrowerId} • Due {format(new Date(borrow.dueDate), "PPP")}
                    </p>
                  </div>
                  <Badge
                    variant={borrow.dueDate < Date.now() ? "destructive" : "default"}
                  >
                    {borrow.dueDate < Date.now() ? "Overdue" : "Active"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
