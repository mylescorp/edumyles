"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        sessionToken ? {} : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<Book>[] = [
        {
            key: "title",
            header: "Title",
            sortable: true,
        },
        {
            key: "author",
            header: "Author",
            sortable: true,
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
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Book
                    </Button>
                }
            />

            <DataTable
                data={(books as Book[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search by title, author, or ISBN..."
                emptyTitle="No books found"
                emptyDescription="Start adding books to your library catalog."
            />
        </div>
    );
}
