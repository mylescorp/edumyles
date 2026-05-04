"use client";

import { useMemo, useState } from "react";
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
    bookTitle?: string;
    borrowerName?: string;
    borrowerReference?: string;
};

type Book = {
    _id: Id<"books">;
    title: string;
    author: string;
};

const EMPTY_BORROWS: Borrow[] = [];
const EMPTY_BOOKS: Book[] = [];
const EMPTY_PEOPLE: any[] = [];

function formatCurrency(cents?: number): string {
    if (!cents) return "KES 0.00";
    return `KES ${(cents / 100).toFixed(2)}`;
}

function calculateSuggestedFine(dueDate: number, currentTime: number): number {
    if (dueDate >= currentTime) return 0;
    const daysOverdue = Math.ceil((currentTime - dueDate) / (24 * 60 * 60 * 1000));
    return daysOverdue * 10;
}

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
    currentTime,
}: {
    borrows: Borrow[];
    books: Book[];
    onReturn: (borrowId: Id<"bookBorrows">) => void;
    returningId: string | null;
    emptyTitle: string;
    emptyDescription: string;
    currentTime: number;
}) {
    const bookMap = new Map(books.map((b) => [b._id as string, b]));

    const columns: Column<Borrow>[] = [
        {
            key: "bookTitle",
            header: "Book Title",
            sortable: true,
            cell: (row) => {
                return row.bookTitle ?? bookMap.get(row.bookId)?.title ?? row.bookId;
            },
        },
        {
            key: "borrower",
            header: "Borrower",
            sortable: true,
            cell: (row) => (
                <div>
                    <p className="font-medium">{row.borrowerName ?? row.borrowerId}</p>
                    <p className="text-xs text-muted-foreground">{row.borrowerReference ?? row.borrowerId}</p>
                </div>
            ),
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
                const isOverdue = row.dueDate < currentTime && row.status !== "returned";
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
            key: "fine",
            header: "Fine",
            cell: (row) => (
                <span>{row.fineCents ? `KES ${(row.fineCents / 100).toFixed(2)}` : "—"}</span>
            ),
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
            searchPlaceholder="Search by borrower or book…"
            searchKey={(row) => `${row.borrowerName ?? ""} ${row.borrowerReference ?? row.borrowerId} ${row.bookTitle ?? ""}`}
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
    const [selectedReturnBorrow, setSelectedReturnBorrow] = useState<Borrow | null>(null);
    const [fineMode, setFineMode] = useState<"auto" | "manual" | "waive">("auto");
    const [manualFine, setManualFine] = useState("");
    const [issuing, setIssuing] = useState(false);
    const [currentTime] = useState(() => Date.now());
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

    const borrowHistory = useQuery(
        api.modules.library.queries.listBorrowHistory,
        sessionToken ? { sessionToken, status: "returned", limit: 50 } : "skip"
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

    const handleReturn = async (borrowId: Id<"bookBorrows">, fineCents?: number) => {
        setReturningId(borrowId);
        setErrorMessage(null);
        try {
            await returnBook({ borrowId, fineCents });
            toast({
                title: "Book returned",
                description: fineCents && fineCents > 0
                    ? `The item was returned with a fine of ${formatCurrency(fineCents)}.`
                    : "The item has been marked as returned.",
            });
            setSelectedReturnBorrow(null);
            setFineMode("auto");
            setManualFine("");
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

    const borrowsList = (activeBorrows as Borrow[] | undefined) ?? EMPTY_BORROWS;
    const overdueList = (overdueBorrows as Borrow[] | undefined) ?? EMPTY_BORROWS;
    const returnedList = (borrowHistory as Borrow[] | undefined) ?? EMPTY_BORROWS;
    const booksList = (books as Book[] | undefined) ?? EMPTY_BOOKS;
    const availableBooks = booksList.filter((book: any) => (book.availableQuantity ?? 0) > 0);
    const borrowerOptions = borrowForm.borrowerType === "student"
        ? ((students as any[] | undefined) ?? EMPTY_PEOPLE).map((entry) => ({
            id: entry._id as string,
            label: `${entry.firstName} ${entry.lastName} (${entry.admissionNumber})`,
        }))
        : ((staff as any[] | undefined) ?? EMPTY_PEOPLE).map((entry) => ({
            id: entry._id as string,
            label: `${entry.firstName} ${entry.lastName} (${entry.employeeId})`,
        }));
    const selectedSuggestedFine = useMemo(
        () => (selectedReturnBorrow ? calculateSuggestedFine(selectedReturnBorrow.dueDate, currentTime) : 0),
        [currentTime, selectedReturnBorrow]
    );
    const parsedManualFine = manualFine.trim() === "" ? 0 : Math.round(Number(manualFine) * 100);

    if (isLoading) return <LoadingSkeleton variant="page" />;

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
                    <TabsTrigger value="returned" className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Returned
                        {returnedList.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {returnedList.length}
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
                            onReturn={(borrowId) => {
                                const borrow = borrowsList.find((entry) => entry._id === borrowId);
                                if (borrow) {
                                    setSelectedReturnBorrow(borrow);
                                    setFineMode(calculateSuggestedFine(borrow.dueDate, currentTime) > 0 ? "auto" : "waive");
                                    setManualFine("");
                                }
                            }}
                            returningId={returningId}
                            currentTime={currentTime}
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
                            onReturn={(borrowId) => {
                                const borrow = overdueList.find((entry) => entry._id === borrowId);
                                if (borrow) {
                                    setSelectedReturnBorrow(borrow);
                                    setFineMode("auto");
                                    setManualFine("");
                                }
                            }}
                            returningId={returningId}
                            currentTime={currentTime}
                            emptyTitle="No overdue borrows"
                            emptyDescription="All borrowed books are within their due dates."
                        />
                    )}
                </TabsContent>

                <TabsContent value="returned" className="mt-4">
                    {borrowHistory === undefined ? (
                        <LoadingSkeleton variant="table" />
                    ) : (
                        <DataTable
                            data={returnedList}
                            columns={[
                                {
                                    key: "bookTitle",
                                    header: "Book Title",
                                    sortable: true,
                                    cell: (row: Borrow) => row.bookTitle ?? row.bookId,
                                },
                                {
                                    key: "borrowerName",
                                    header: "Borrower",
                                    sortable: true,
                                    cell: (row: Borrow) => (
                                        <div>
                                            <p className="font-medium">{row.borrowerName ?? row.borrowerId}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {row.borrowerReference ?? row.borrowerId}
                                            </p>
                                        </div>
                                    ),
                                },
                                {
                                    key: "returnedAt",
                                    header: "Returned",
                                    sortable: true,
                                    cell: (row: Borrow) => row.returnedAt ? formatDate(row.returnedAt) : "—",
                                },
                                {
                                    key: "fineCents",
                                    header: "Fine",
                                    sortable: true,
                                    cell: (row: Borrow) => row.fineCents ? formatCurrency(row.fineCents) : "—",
                                },
                            ]}
                            searchable
                            searchPlaceholder="Search returned books…"
                            searchKey={(row: Borrow) =>
                                `${row.borrowerName ?? ""} ${row.borrowerReference ?? ""} ${row.bookTitle ?? ""}`
                            }
                            emptyTitle="No returned history"
                            emptyDescription="Returned circulation records will appear here."
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

            <Dialog
                open={selectedReturnBorrow !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedReturnBorrow(null);
                        setFineMode("auto");
                        setManualFine("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Return Book</DialogTitle>
                    </DialogHeader>
                    {selectedReturnBorrow && (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                <p className="font-medium">{selectedReturnBorrow.bookTitle ?? selectedReturnBorrow.bookId}</p>
                                <p className="text-muted-foreground">
                                    Borrower: {selectedReturnBorrow.borrowerName ?? selectedReturnBorrow.borrowerId}
                                </p>
                                <p className="text-muted-foreground">
                                    Due: {formatDate(selectedReturnBorrow.dueDate)}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Fine handling</Label>
                                <Select value={fineMode} onValueChange={(value: "auto" | "manual" | "waive") => setFineMode(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">
                                            Automatic {selectedSuggestedFine > 0 ? `(${formatCurrency(selectedSuggestedFine)})` : "(No fine)"}
                                        </SelectItem>
                                        <SelectItem value="manual">Manual amount</SelectItem>
                                        <SelectItem value="waive">Waive fine</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {fineMode === "manual" && (
                                <div className="space-y-2">
                                    <Label htmlFor="manualFine">Fine amount (KES)</Label>
                                    <Input
                                        id="manualFine"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={manualFine}
                                        onChange={(event) => setManualFine(event.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            )}
                            <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                                {fineMode === "auto" && (
                                    <p>
                                        The automatic fine will use the overdue period and current library rules.
                                        Suggested fine: {formatCurrency(selectedSuggestedFine)}.
                                    </p>
                                )}
                                {fineMode === "manual" && (
                                    <p>
                                        Enter the exact fine to charge for this return. This overrides the automatic calculation.
                                    </p>
                                )}
                                {fineMode === "waive" && (
                                    <p>No fine will be recorded for this return.</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedReturnBorrow(null);
                                        setFineMode("auto");
                                        setManualFine("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    disabled={
                                        returningId === selectedReturnBorrow._id ||
                                        (fineMode === "manual" && (!manualFine || Number.isNaN(parsedManualFine) || parsedManualFine < 0))
                                    }
                                    onClick={() => {
                                        const fineCents =
                                            fineMode === "manual"
                                                ? parsedManualFine
                                                : fineMode === "waive"
                                                    ? 0
                                                    : undefined;
                                        void handleReturn(selectedReturnBorrow._id, fineCents);
                                    }}
                                >
                                    {returningId === selectedReturnBorrow._id ? "Returning..." : "Confirm return"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
