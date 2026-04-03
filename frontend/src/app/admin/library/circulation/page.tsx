"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, AlertCircle, RotateCcw, Plus } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/components/ui/use-toast";

type Borrow = {
    _id: Id<"bookBorrows">;
    tenantId: string;
    bookId: string;
    borrowerId: string;
    borrowerType: string;
    borrowedAt: number;
    dueDate: number;
    status: string;
    returnedAt?: number;
    fineCents?: number;
    createdAt: number;
    updatedAt: number;
};

type Book = {
    _id: Id<"books">;
    title: string;
    author: string;
};

function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function BorrowsTable({
    borrows,
    books,
    onReturn,
    returningId,
    emptyTitle,
    emptyDescription,
}: {
    borrows: Borrow[];
    books: Book[];
    onReturn: (borrowId: Id<"bookBorrows">) => void;
    returningId: string | null;
    emptyTitle: string;
    emptyDescription: string;
}) {
    const bookMap = new Map(books.map((b) => [b._id as string, b]));

    const columns: Column<Borrow>[] = [
        {
            key: "bookTitle",
            header: "Book Title",
            sortable: true,
            cell: (row) => {
                const book = bookMap.get(row.bookId);
                return book ? book.title : row.bookId;
            },
        },
        {
            key: "borrowerId",
            header: "Borrower ID",
            sortable: true,
            cell: (row) => row.borrowerId,
        },
        {
            key: "borrowerType",
            header: "Borrower Type",
            sortable: true,
            cell: (row) => (
                <span className="capitalize">{row.borrowerType}</span>
            ),
        },
        {
            key: "borrowedAt",
            header: "Borrowed Date",
            sortable: true,
            cell: (row) => formatDate(row.borrowedAt),
        },
        {
            key: "dueDate",
            header: "Due Date",
            sortable: true,
            cell: (row) => formatDate(row.dueDate),
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => {
                const isOverdue = row.dueDate < Date.now() && row.status !== "returned";
                return isOverdue ? (
                    <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                    </Badge>
                ) : (
                    <Badge variant="secondary">Borrowed</Badge>
                );
            },
        },
        {
            key: "actions",
            header: "Actions",
            cell: (row) => (
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={returningId === row._id}
                    onClick={() => onReturn(row._id)}
                >
                    <RotateCcw className="h-3 w-3" />
                    {returningId === row._id ? "Returning…" : "Return"}
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            data={borrows}
            columns={columns}
            searchable
            searchPlaceholder="Search by borrower ID…"
            searchKey={(row) => row.borrowerId}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
        />
    );
}

export default function CirculationPage() {
    const { isLoading, sessionToken } = useAuth();
    const { toast } = useToast();
    const [returningId, setReturningId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isBorrowOpen, setIsBorrowOpen] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [borrowForm, setBorrowForm] = useState({
        bookId: "",
        borrowerId: "",
        borrowerType: "student",
        dueDate: "",
    });

    const activeBorrows = useQuery(
        api.modules.library.queries.listActiveBorrows,
        sessionToken ? { sessionToken } : "skip"
    );

    const overdueBorrows = useQuery(
        api.modules.library.queries.getOverdueBorrows,
        sessionToken ? { sessionToken } : "skip"
    );

    const books = useQuery(
        api.modules.library.queries.listBooks,
        sessionToken ? { sessionToken } : "skip"
    );

    const students = useQuery(
        api.modules.sis.queries.listStudents,
        sessionToken ? { sessionToken, status: "active" } : "skip"
    );

    const staff = useQuery(
        api.modules.hr.queries.listStaff,
        sessionToken ? { sessionToken } : "skip"
    );

    const returnBook = useMutation(api.modules.library.mutations.returnBook);
    const borrowBook = useMutation(api.modules.library.mutations.borrowBook);

    const handleReturn = async (borrowId: Id<"bookBorrows">) => {
        if (!confirm("Are you sure you want to mark this book as returned?")) return;
        setReturningId(borrowId);
        setErrorMessage(null);
        try {
            await returnBook({ borrowId });
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to return book. Please try again."
            );
        } finally {
            setReturningId(null);
        }
    };

    const handleIssueBook = async () => {
        if (!borrowForm.bookId || !borrowForm.borrowerId || !borrowForm.dueDate) {
            setErrorMessage("Book, borrower, and due date are required.");
            return;
        }

        setIssuing(true);
        setErrorMessage(null);
        try {
            await borrowBook({
                bookId: borrowForm.bookId as Id<"books">,
                borrowerId: borrowForm.borrowerId,
                borrowerType: borrowForm.borrowerType,
                dueDate: new Date(`${borrowForm.dueDate}T23:59:59`).getTime(),
            });
            toast({
                title: "Book issued",
                description: "The borrow record has been created.",
            });
            setBorrowForm({
                bookId: "",
                borrowerId: "",
                borrowerType: "student",
                dueDate: "",
            });
            setIsBorrowOpen(false);
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to issue the book. Please try again."
            );
        } finally {
            setIssuing(false);
        }
    };

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const borrowsList = (activeBorrows as Borrow[] | undefined) ?? [];
    const overdueList = (overdueBorrows as Borrow[] | undefined) ?? [];
    const booksList = (books as Book[] | undefined) ?? [];
    const availableBooks = booksList.filter((book: any) => (book.availableQuantity ?? 0) > 0);
    const borrowerOptions = borrowForm.borrowerType === "student"
        ? ((students as any[]) ?? []).map((entry) => ({
            id: entry._id as string,
            label: `${entry.firstName} ${entry.lastName} (${entry.admissionNumber})`,
        }))
        : ((staff as any[]) ?? []).map((entry) => ({
            id: entry._id as string,
            label: `${entry.firstName} ${entry.lastName} (${entry.employeeId})`,
        }));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Library Circulation"
                description="Monitor active borrows, overdue items, and process returns"
                actions={
                    <Button className="gap-2" onClick={() => setIsBorrowOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Issue Book
                    </Button>
                }
            />

            {errorMessage && (
                <div className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMessage}
                </div>
            )}

            <Tabs defaultValue="active">
                <TabsList>
                    <TabsTrigger value="active" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Active Borrows
                        {borrowsList.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {borrowsList.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="overdue" className="gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Overdue
                        {overdueList.length > 0 && (
                            <Badge variant="destructive" className="ml-1">
                                {overdueList.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4">
                    {activeBorrows === undefined ? (
                        <LoadingSkeleton variant="table" />
                    ) : (
                        <BorrowsTable
                            borrows={borrowsList}
                            books={booksList}
                            onReturn={handleReturn}
                            returningId={returningId}
                            emptyTitle="No active borrows"
                            emptyDescription="There are currently no books checked out."
                        />
                    )}
                </TabsContent>

                <TabsContent value="overdue" className="mt-4">
                    {overdueBorrows === undefined ? (
                        <LoadingSkeleton variant="table" />
                    ) : (
                        <BorrowsTable
                            borrows={overdueList}
                            books={booksList}
                            onReturn={handleReturn}
                            returningId={returningId}
                            emptyTitle="No overdue borrows"
                            emptyDescription="All borrowed books are within their due dates."
                        />
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={isBorrowOpen} onOpenChange={setIsBorrowOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Issue Book</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="book">Book</Label>
                            <Select value={borrowForm.bookId} onValueChange={(value) => setBorrowForm((prev) => ({ ...prev, bookId: value }))}>
                                <SelectTrigger id="book">
                                    <SelectValue placeholder="Select an available book" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableBooks.map((book: any) => (
                                        <SelectItem key={book._id} value={book._id}>
                                            {book.title} ({book.availableQuantity} available)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="borrowerType">Borrower type</Label>
                                <Select
                                    value={borrowForm.borrowerType}
                                    onValueChange={(value) => setBorrowForm((prev) => ({ ...prev, borrowerType: value, borrowerId: "" }))}
                                >
                                    <SelectTrigger id="borrowerType">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={borrowForm.dueDate}
                                    onChange={(event) => setBorrowForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="borrower">Borrower</Label>
                            <Select value={borrowForm.borrowerId} onValueChange={(value) => setBorrowForm((prev) => ({ ...prev, borrowerId: value }))}>
                                <SelectTrigger id="borrower">
                                    <SelectValue placeholder={`Select a ${borrowForm.borrowerType}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {borrowerOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsBorrowOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleIssueBook} disabled={issuing}>
                                {issuing ? "Issuing..." : "Issue book"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
