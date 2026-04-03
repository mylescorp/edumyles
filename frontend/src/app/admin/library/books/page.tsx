"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Book = {
    _id: string;
    isbn?: string;
    title: string;
    author: string;
    category: string;
    quantity: number;
    availableQuantity: number;
};

export default function BookCatalogPage() {
    const { isLoading, sessionToken } = useAuth();

    const books = useQuery(
        api.modules.library.queries.listBooks,
        sessionToken ? { sessionToken } : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<Book>[] = [
        {
            key: "title",
            header: "Title",
            sortable: true,
            cell: (row: Book) => row.title,
        },
        {
            key: "author",
            header: "Author",
            sortable: true,
            cell: (row: Book) => row.author,
        },
        {
            key: "isbn",
            header: "ISBN",
            cell: (row: Book) => row.isbn ?? "—",
        },
        {
            key: "category",
            header: "Category",
            sortable: true,
            cell: (row: Book) => row.category,
        },
        {
            key: "available",
            header: "Availability",
            cell: (row: Book) => (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {row.availableQuantity} / {row.quantity}
                    </span>
                    {row.availableQuantity === 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                    ) : row.availableQuantity <= 2 ? (
                        <Badge variant="secondary">Low Stock</Badge>
                    ) : (
                        <Badge variant="default">Available</Badge>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Book Catalog"
                description="Browse and manage the library collection"
                actions={
                    <div className="flex gap-2">
                        <Link href="/admin/library/books/create">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add New Book
                            </Button>
                        </Link>
                        <Link href="/admin/library/reports">
                            <Button variant="outline" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                View Reports
                            </Button>
                        </Link>
                    </div>
                }
            />

            <DataTable
                data={(books as Book[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search by title, author, or ISBN..."
                searchKey={(row) => `${row.title} ${row.author} ${row.isbn ?? ""} ${row.category}`}
                emptyTitle="No books found"
                emptyDescription="Start adding books to your library catalog."
            />
        </div>
    );
}
