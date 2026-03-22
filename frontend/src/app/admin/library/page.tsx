"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Library, 
  BookOpen, 
  AlertCircle, 
  ArrowRight, 
  BookmarkPlus,
  Users,
  TrendingUp,
  Activity,
  BarChart3
} from "lucide-react";
import Link from "next/link";

export default function LibraryDashboardPage() {
    const { isLoading, sessionToken } = useAuth();

    const activeBorrows = useQuery(
        api.modules.library.queries.listActiveBorrows,
        sessionToken ? { sessionToken } : "skip"
    );

    const overdue = useQuery(
        api.modules.library.queries.getOverdueBorrows,
        sessionToken ? { sessionToken } : "skip"
    );

    const lowStock = useQuery(
        api.modules.library.queries.getLowStockBooks,
        sessionToken ? { sessionToken } : "skip"
    );

    const allBooks = useQuery(
        api.modules.library.queries.listBooks,
        sessionToken ? { sessionToken } : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const stats = {
        totalBooks: allBooks?.length ?? 0,
        totalBorrowers: (activeBorrows as any[])?.map((b: any) => b.borrowerId).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).length ?? 0,
        monthlyCirculation: activeBorrows?.length ?? 0,
        averageRating: 0,
    };

    const overdueList = (overdue as any[]) ?? [];
    const activeBorrowList = (activeBorrows as any[]) ?? [];
    const recentActivity = [
        ...overdueList.slice(0, 2).map((b: any) => ({
            id: String(b._id),
            type: "overdue",
            title: "Overdue Book",
            description: `"${b.bookTitle ?? b.bookId}" is overdue`,
            time: b.dueDate ? `Due ${new Date(b.dueDate).toLocaleDateString()}` : "Overdue",
            user: b.borrowerName ?? "Student",
        })),
        ...activeBorrowList.slice(0, 3).map((b: any) => ({
            id: String(b._id),
            type: "borrow",
            title: "Book Borrowed",
            description: `"${b.bookTitle ?? b.bookId}" borrowed`,
            time: b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString() : "Recently",
            user: b.borrowerName ?? "Student",
        })),
    ].slice(0, 5);

    const quickActions = [
        {
            title: "Add New Book",
            description: "Add books to the catalog",
            href: "/admin/library/books",
            icon: BookmarkPlus,
            color: "bg-blue-500",
        },
        {
            title: "Borrow Book",
            description: "Process book borrowing",
            href: "/admin/library/circulation",
            icon: BookOpen,
            color: "bg-green-500",
        },
        {
            title: "View Reports",
            description: "Library analytics",
            href: "/admin/library/reports",
            icon: BarChart3,
            color: "bg-purple-500",
        },
        {
            title: "Manage Circulation",
            description: "Track borrowing activity",
            href: "/admin/library/circulation",
            icon: Activity,
            color: "bg-orange-500",
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Library Management"
                description="Comprehensive library system with catalog management and circulation tracking"
                actions={
                    <div className="flex gap-2">
                        <Link href="/admin/library/books">
                            <Button variant="outline" className="gap-2">
                                <BookmarkPlus className="h-4 w-4" />
                                Add Books
                            </Button>
                        </Link>
                        <Link href="/admin/library/reports">
                            <Button className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                View Reports
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="Total Books"
                    value={stats.totalBooks.toLocaleString()}
                    description="In library collection"
                    icon={Library}
                    trend={{ value: 8, isPositive: true }}
                />
                <AdminStatsCard
                    title="Active Borrowers"
                    value={stats.totalBorrowers}
                    description="This month"
                    icon={Users}
                    trend={{ value: 12, isPositive: true }}
                />
                <AdminStatsCard
                    title="Active Borrows"
                    value={activeBorrows?.length ?? 0}
                    description="Books currently borrowed"
                    icon={BookOpen}
                    trend={{ value: 5, isPositive: false }}
                />
                <AdminStatsCard
                    title="Overdue Books"
                    value={overdue?.length ?? 0}
                    description="Require immediate attention"
                    icon={AlertCircle}
                    variant={overdue && overdue.length > 0 ? "danger" : "default"}
                />
            </div>

            {/* Quick Actions Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <Link key={index} href={action.href}>
                                    <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${action.color}`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="font-medium text-center">{action.title}</h3>
                                        <p className="text-sm text-muted-foreground text-center mt-1">
                                            {action.description}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                    <div className="p-2 bg-muted rounded-full">
                                        {activity.type === 'borrow' && <BookOpen className="h-4 w-4 text-blue-600" />}
                                        {activity.type === 'return' && <AlertCircle className="h-4 w-4 text-green-600" />}
                                        {activity.type === 'overdue' && <AlertCircle className="h-4 w-4 text-red-600" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-sm">{activity.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {activity.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <span>{activity.user}</span>
                                            <span>•</span>
                                            <span>{activity.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Links & Alerts */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Library Links</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/admin/library/books">
                                <Button className="w-full justify-start gap-2" variant="outline">
                                    <Library className="h-4 w-4" />
                                    Book Catalog
                                    <ArrowRight className="ml-auto h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/admin/library/circulation">
                                <Button className="w-full justify-start gap-2" variant="outline">
                                    <Activity className="h-4 w-4" />
                                    Circulation Tracking
                                    <ArrowRight className="ml-auto h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/admin/library/reports">
                                <Button className="w-full justify-start gap-2" variant="outline">
                                    <BarChart3 className="h-4 w-4" />
                                    Analytics & Reports
                                    <ArrowRight className="ml-auto h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Alerts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Alerts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {overdue && overdue.length > 0 && (
                                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-800">
                                            {overdue.length} overdue books
                                        </p>
                                        <p className="text-xs text-red-600">
                                            Action required
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {lowStock && lowStock.length > 0 && (
                                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                                    <TrendingUp className="h-4 w-4 text-amber-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800">
                                            {lowStock.length} books low in stock
                                        </p>
                                        <p className="text-xs text-amber-600">
                                            Restock recommended
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!overdue?.length && !lowStock?.length && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    All systems operational
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
