"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Library, BookOpen, AlertCircle, ArrowRight, BookmarkPlus } from "lucide-react";
import Link from "next/link";

export default function LibraryDashboardPage() {
    const { isLoading, sessionToken } = useAuth();

    const activeBorrows = useQuery(
        api.modules.library.queries.listActiveBorrows,
        sessionToken ? {} : "skip"
    );

    const overdue = useQuery(
        api.modules.library.queries.getOverdueBorrows,
        sessionToken ? {} : "skip"
    );

    const lowStock = useQuery(
        api.modules.library.queries.getLowStockBooks,
        sessionToken ? {} : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Library Dashboard"
                description="Manage books and student borrowings"
                actions={
                    <Link href="/admin/library/books">
                        <Button className="gap-2">
                            <BookmarkPlus className="h-4 w-4" />
                            Add Books
                        </Button>
                    </Link>
                }
            />

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    label="Active Borrows"
                    value={activeBorrows?.length ?? 0}
                    icon={BookOpen}
                />
                <StatCard
                    label="Overdue Books"
                    value={overdue?.length ?? 0}
                    icon={AlertCircle}
                    className={overdue && overdue.length > 0 ? "border-destructive/20 bg-destructive/5" : ""}
                />
                <StatCard
                    label="Low Stock Alert"
                    value={lowStock?.length ?? 0}
                    icon={Library}
                    className={lowStock && lowStock.length > 0 ? "border-amber-200 bg-amber-50/50" : ""}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link href="/admin/library/books">
                            <Button className="w-full justify-start gap-2" variant="outline">
                                <Library className="h-4 w-4" />
                                Book Catalog
                                <ArrowRight className="ml-auto h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {overdue && overdue.length > 0 ? (
                                overdue.slice(0, 5).map((b) => (
                                    <div key={b._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div className="text-sm">
                                            <p className="font-medium">Book ID: {b.bookId.slice(-6)}</p>
                                            <p className="text-muted-foreground text-xs">Borrower: {b.borrowerId.slice(-6)}</p>
                                        </div>
                                        <Badge variant="destructive">Overdue</Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No overdue books at the moment.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode, variant?: string }) {
    const variants: Record<string, string> = {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${variants[variant]}`}>
            {children}
        </span>
    );
}
