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
import { BookOpen, AlertCircle, RotateCcw } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

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
    const [returningId, setReturningId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    const returnBook = useMutation(api.modules.library.mutations.returnBook);

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

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const borrowsList = (activeBorrows as Borrow[] | undefined) ?? [];
    const overdueList = (overdueBorrows as Borrow[] | undefined) ?? [];
    const booksList = (books as Book[] | undefined) ?? [];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Library Circulation"
                description="Monitor active borrows, overdue items, and process returns"
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
        </div>
    );
}
