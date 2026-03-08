"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  Users, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Plus
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import Link from "next/link";

type Transaction = {
    _id: string;
    walletId: string;
    type: string;
    amountCents: number;
    reference?: string;
    createdAt: number;
    status: "pending" | "completed" | "failed";
    user?: {
        name: string;
        type: string;
    };
};

export default function EWalletPage() {
    const { isLoading, sessionToken } = useAuth();

    const transactions = useQuery(
        api.modules.ewallet.queries.listWalletTransactions,
        sessionToken ? {} : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    // Mock enhanced data for demonstration
    const mockTransactions: Transaction[] = [
        {
            _id: "txn1",
            walletId: "wallet1",
            type: "credit",
            amountCents: 100000, // 1000.00 KES
            reference: "TOPUP-2024-001",
            createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
            status: "completed",
            user: {
                name: "Alice Johnson",
                type: "student",
            },
        },
        {
            _id: "txn2",
            walletId: "wallet2",
            type: "debit",
            amountCents: 25050, // 250.50 KES
            reference: "PAY-2024-042",
            createdAt: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
            status: "completed",
            user: {
                name: "Bob Wilson",
                type: "student",
            },
        },
        {
            _id: "txn3",
            walletId: "wallet3",
            type: "transfer",
            amountCents: 50000, // 500.00 KES
            reference: "TRANSFER-2024-018",
            createdAt: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
            status: "completed",
            user: {
                name: "Mary Wanjiku",
                type: "staff",
            },
        },
        {
            _id: "txn4",
            walletId: "wallet4",
            type: "credit",
            amountCents: 200000, // 2000.00 KES
            reference: "TOPUP-2024-002",
            createdAt: Date.now() - 1000 * 60 * 60 * 8, // 8 hours ago
            status: "pending",
            user: {
                name: "James Otieno",
                type: "parent",
            },
        },
        {
            _id: "txn5",
            walletId: "wallet5",
            type: "debit",
            amountCents: 15000, // 150.00 KES
            reference: "PAY-2024-043",
            createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
            status: "failed",
            user: {
                name: "Grace Kimani",
                type: "student",
            },
        },
    ];

    const stats = {
        totalWallets: 1247,
        activeWallets: 1189,
        totalBalance: 2847500, // 28,475.00 KES
        todayTransactions: mockTransactions.filter(t => 
            new Date(t.createdAt).toDateString() === new Date().toDateString()
        ).length,
        pendingTransactions: mockTransactions.filter(t => t.status === "pending").length,
        failedTransactions: mockTransactions.filter(t => t.status === "failed").length,
        dailyVolume: mockTransactions.reduce((sum, t) => sum + t.amountCents, 0),
    };

    const transactionColumns: Column<Transaction>[] = [
        {
            key: "type",
            header: "Type",
            cell: (row: Transaction) => (
                <div className="flex items-center gap-2">
                    {row.type === "credit" || row.type === "topup" ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                    )}
                    <span className="capitalize">{row.type}</span>
                </div>
            ),
        },
        {
            key: "user",
            header: "User",
            cell: (row: Transaction) => (
                <div>
                    <p className="font-medium">{row.user?.name || "Unknown"}</p>
                    <Badge variant="outline" className="text-xs">
                        {row.user?.type || "N/A"}
                    </Badge>
                </div>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            cell: (row: Transaction) => (
                <span className={row.type === "credit" || row.type === "topup" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {row.type === "credit" || row.type === "topup" ? "+" : "-"}
                    {formatCurrency(row.amountCents)}
                </span>
            ),
            sortable: true,
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Transaction) => {
                const statusConfig = {
                    pending: { color: "secondary", icon: Activity, label: "Pending" },
                    completed: { color: "default", icon: CheckCircle, label: "Completed" },
                    failed: { color: "destructive", icon: AlertTriangle, label: "Failed" },
                };
                const config = statusConfig[row.status];
                const Icon = config.icon;
                return (
                    <Badge variant={config.color as any} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            key: "reference",
            header: "Reference",
            cell: (row: Transaction) => row.reference ?? "—",
        },
        {
            key: "createdAt",
            header: "Date & Time",
            cell: (row: Transaction) => formatDateTime(row.createdAt),
            sortable: true,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="eWallet Management"
                description="Comprehensive digital wallet system for students, staff, and parents"
                actions={
                    <div className="flex gap-2">
                        <Link href="/admin/ewallet/wallets">
                            <Button variant="outline" className="gap-2">
                                <Wallet className="h-4 w-4" />
                                Manage Wallets
                            </Button>
                        </Link>
                        <Link href="/admin/ewallet/transactions">
                            <Button className="gap-2">
                                <CreditCard className="h-4 w-4" />
                                Process Transaction
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="Total Wallets"
                    value={stats.totalWallets.toLocaleString()}
                    description="Registered users"
                    icon={Wallet}
                    trend={{ value: 8, isPositive: true }}
                />
                <AdminStatsCard
                    title="Active Wallets"
                    value={stats.activeWallets.toLocaleString()}
                    description="Currently active"
                    icon={Users}
                    variant="success"
                />
                <AdminStatsCard
                    title="Total Balance"
                    value={formatCurrency(stats.totalBalance)}
                    description="Across all wallets"
                    icon={TrendingUp}
                    trend={{ value: 12, isPositive: true }}
                />
                <AdminStatsCard
                    title="Today's Transactions"
                    value={stats.todayTransactions}
                    description="Processed today"
                    icon={Activity}
                    trend={{ value: 5, isPositive: true }}
                />
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Link href="/admin/ewallet/wallets">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                                    <Wallet className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Manage Wallets</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    View and manage user wallets
                                </p>
                            </div>
                        </Link>
                        <Link href="/admin/ewallet/transactions">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                                    <CreditCard className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Process Transaction</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Handle wallet transactions
                                </p>
                            </div>
                        </Link>
                        <Link href="/admin/ewallet/reports">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Analytics</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    View wallet analytics
                                </p>
                            </div>
                        </Link>
                        <Link href="/admin/ewallet/topup">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                                    <Plus className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Bulk Top-up</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Add funds to multiple wallets
                                </p>
                            </div>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="transactions">
                <TabsList className="mb-4">
                    <TabsTrigger value="transactions" className="gap-2">
                        <History className="h-4 w-4" />
                        Recent Transactions
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Pending ({stats.pendingTransactions})
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="transactions">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Transactions</CardTitle>
                            <Link href="/admin/ewallet/transactions">
                                <Button size="sm" variant="outline">
                                    View All
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={mockTransactions}
                                columns={transactionColumns}
                                searchable
                                searchPlaceholder="Search by reference or user..."
                                emptyTitle="No transactions found"
                                emptyDescription="Wallet transactions will appear here as they occur."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={mockTransactions.filter(t => t.status === "pending")}
                                columns={transactionColumns}
                                searchable={false}
                                emptyTitle="No pending transactions"
                                emptyDescription="All transactions have been processed."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="overview">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>System Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">{stats.totalWallets}</p>
                                        <p className="text-sm text-muted-foreground">Total Wallets</p>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">{stats.activeWallets}</p>
                                        <p className="text-sm text-muted-foreground">Active Wallets</p>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalBalance)}</p>
                                        <p className="text-sm text-muted-foreground">Total Balance</p>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-2xl font-bold text-orange-600">{stats.todayTransactions}</p>
                                        <p className="text-sm text-muted-foreground">Today's Activity</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Alerts & Notifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {stats.pendingTransactions > 0 && (
                                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                                        <Activity className="h-4 w-4 text-amber-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-amber-800">
                                                {stats.pendingTransactions} pending transactions
                                            </p>
                                            <p className="text-xs text-amber-600">
                                                Require processing
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {stats.failedTransactions > 0 && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-red-800">
                                                {stats.failedTransactions} failed transactions
                                            </p>
                                            <p className="text-xs text-red-600">
                                                Need attention
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {stats.pendingTransactions === 0 && stats.failedTransactions === 0 && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-green-800">
                                                All systems operational
                                            </p>
                                            <p className="text-xs text-green-600">
                                                No pending issues
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
