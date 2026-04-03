"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
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
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { useToast } from "@/components/ui/use-toast";

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

type WalletSummary = {
    _id: string;
    balanceCents: number;
    frozen?: boolean;
};

type TopUpRequest = {
    _id: string;
    requesterId: string;
    amountCents: number;
    method: string;
    status: "pending" | "approved" | "rejected";
    reference?: string;
    createdAt: number;
};

export default function EWalletPage() {
    const { isLoading, sessionToken } = useAuth();
    const { toast } = useToast();

    const transactions = usePlatformQuery(
        api.modules.ewallet.queries.listWalletTransactions,
        sessionToken ? { sessionToken } : "skip",
        !!sessionToken
    );
    const wallets = usePlatformQuery(
        api.modules.ewallet.queries.listAllWallets,
        sessionToken ? { sessionToken, limit: 250 } : "skip",
        !!sessionToken
    );
    const topUpRequests = usePlatformQuery(
        api.modules.ewallet.queries.listTopUpRequests,
        sessionToken ? { sessionToken, limit: 50 } : "skip",
        !!sessionToken
    );
    const reviewTopUpRequest = useMutation(api.modules.ewallet.mutations.reviewTopUpRequest);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const currentTransactions = (transactions as Transaction[]) || [];
    const currentWallets = (wallets as WalletSummary[]) || [];
    const currentTopUpRequests = (topUpRequests as TopUpRequest[]) || [];

    const stats = {
        totalWallets: currentWallets.length,
        activeWallets: currentWallets.filter((wallet) => !wallet.frozen).length,
        totalBalance: currentWallets.reduce((sum, wallet) => sum + wallet.balanceCents, 0),
        todayTransactions: currentTransactions.filter(t => 
            new Date(t.createdAt).toDateString() === new Date().toDateString()
        ).length,
        pendingTransactions: currentTopUpRequests.filter((request) => request.status === "pending").length,
        failedTransactions: currentTransactions.filter(t => t.status === "failed").length,
        dailyVolume: currentTransactions.reduce((sum, t) => sum + t.amountCents, 0),
    };

    const handleReviewRequest = async (requestId: string, approved: boolean) => {
        if (!sessionToken) return;
        try {
            await reviewTopUpRequest({
                sessionToken,
                requestId: requestId as any,
                approved,
            });
            toast({
                title: approved ? "Top-up request approved" : "Top-up request rejected",
                description: approved ? "The wallet has been credited." : "The requester will need to submit a new funding request.",
            });
        } catch (error) {
            toast({
                title: "Unable to review request",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
        }
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
                        Funding Requests ({stats.pendingTransactions})
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
                                data={currentTransactions}
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
                            <CardTitle>Pending Wallet Funding Requests</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {currentTopUpRequests.filter((request) => request.status === "pending").length === 0 ? (
                                <p className="text-sm text-muted-foreground">No pending wallet funding requests.</p>
                            ) : (
                                currentTopUpRequests
                                    .filter((request) => request.status === "pending")
                                    .map((request) => (
                                        <div key={request._id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-medium">{request.requesterId}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatCurrency(request.amountCents)} via {request.method.replaceAll("_", " ")}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {request.reference ?? "No reference"} • {formatDateTime(request.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleReviewRequest(request._id, false)}>
                                                    Reject
                                                </Button>
                                                <Button size="sm" onClick={() => handleReviewRequest(request._id, true)}>
                                                    Approve
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                            )}
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
