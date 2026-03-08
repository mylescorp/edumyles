"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useState } from "react";

type WalletUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: "student" | "staff" | "parent";
  status: "active" | "inactive" | "suspended";
};

type Wallet = {
  _id: string;
  userId: string;
  user: WalletUser;
  balance: number;
  currency: string;
  status: "active" | "inactive" | "frozen";
  lastTransaction: string;
  totalTransactions: number;
  monthlySpending: number;
  createdAt: string;
};

export default function WalletsPage() {
  const { isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // Mock data for demonstration
  const wallets: Wallet[] = [
    {
      _id: "wallet1",
      userId: "user1",
      user: {
        _id: "user1",
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice.j@school.com",
        phone: "+254 712 345 678",
        type: "student",
        status: "active",
      },
      balance: 2500.50,
      currency: "KES",
      status: "active",
      lastTransaction: "2 hours ago",
      totalTransactions: 45,
      monthlySpending: 1250.00,
      createdAt: "2024-01-15",
    },
    {
      _id: "wallet2",
      userId: "user2",
      user: {
        _id: "user2",
        firstName: "Bob",
        lastName: "Wilson",
        email: "bob.w@school.com",
        phone: "+254 723 456 789",
        type: "student",
        status: "active",
      },
      balance: 1850.25,
      currency: "KES",
      status: "active",
      lastTransaction: "1 day ago",
      totalTransactions: 32,
      monthlySpending: 980.50,
      createdAt: "2024-02-01",
    },
    {
      _id: "wallet3",
      userId: "user3",
      user: {
        _id: "user3",
        firstName: "Mary",
        lastName: "Wanjiku",
        email: "mary.w@school.com",
        phone: "+254 734 567 890",
        type: "staff",
        status: "active",
      },
      balance: 3200.00,
      currency: "KES",
      status: "active",
      lastTransaction: "3 hours ago",
      totalTransactions: 67,
      monthlySpending: 2100.00,
      createdAt: "2023-12-10",
    },
    {
      _id: "wallet4",
      userId: "user4",
      user: {
        _id: "user4",
        firstName: "James",
        lastName: "Otieno",
        email: "james.o@school.com",
        phone: "+254 745 678 901",
        type: "parent",
        status: "inactive",
      },
      balance: 5000.00,
      currency: "KES",
      status: "frozen",
      lastTransaction: "1 week ago",
      totalTransactions: 23,
      monthlySpending: 0,
      createdAt: "2024-01-20",
    },
  ];

  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = searchTerm === "" || 
      wallet.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.user.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || wallet.status === statusFilter;
    const matchesType = typeFilter === "all" || wallet.user.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    totalWallets: wallets.length,
    activeWallets: wallets.filter(w => w.status === "active").length,
    totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
    monthlyTransactions: wallets.reduce((sum, w) => sum + w.monthlySpending, 0),
    frozenWallets: wallets.filter(w => w.status === "frozen").length,
  };

  const columns: Column<Wallet>[] = [
    {
      key: "user",
      header: "User",
      sortable: true,
      cell: (row: Wallet) => (
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-forest-600" />
            </div>
            <div>
              <p className="font-medium">{row.user.firstName} {row.user.lastName}</p>
              <p className="text-sm text-muted-foreground">{row.user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {row.user.type}
                </Badge>
                <Badge variant={row.user.status === "active" ? "default" : "secondary"} className="text-xs">
                  {row.user.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      sortable: true,
      cell: (row: Wallet) => (
        <div>
          <p className="font-medium">{formatCurrency(row.balance)}</p>
          <p className="text-xs text-muted-foreground">{row.currency}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Wallet) => {
        const statusConfig = {
          active: { color: "default", label: "Active" },
          inactive: { color: "secondary", label: "Inactive" },
          frozen: { color: "destructive", label: "Frozen" },
        };
        const config = statusConfig[row.status];
        return (
          <Badge variant={config.color as any}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "activity",
      header: "Activity",
      cell: (row: Wallet) => (
        <div>
          <p className="text-sm">{row.totalTransactions} transactions</p>
          <p className="text-xs text-muted-foreground">Last: {row.lastTransaction}</p>
          <p className="text-xs text-muted-foreground">
            This month: {formatCurrency(row.monthlySpending)}
          </p>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (row: Wallet) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Wallet) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">View</Button>
          <Button size="sm" variant="outline">Top Up</Button>
          {row.status === "active" && (
            <Button size="sm" variant="outline">Freeze</Button>
          )}
          {row.status === "frozen" && (
            <Button size="sm" variant="outline">Unfreeze</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet Management"
        description="Manage digital wallets and monitor user balances"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Wallet
            </Button>
            <Button className="gap-2">
              <CreditCard className="h-4 w-4" />
              Bulk Top Up
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total Wallets"
          value={stats.totalWallets}
          description="Registered users"
          icon={Wallet}
          trend={{ value: 8, isPositive: true }}
        />
        <AdminStatsCard
          title="Active Wallets"
          value={stats.activeWallets}
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
          title="Frozen Wallets"
          value={stats.frozenWallets}
          description="Require attention"
          icon={ArrowUpRight}
          variant={stats.frozenWallets > 0 ? "warning" : "default"}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Wallet Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">User Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="parent">Parents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallets Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Wallet Directory</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {filteredWallets.length} of {wallets.length} wallets
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredWallets}
            columns={columns}
            searchable={false} // We have custom search
            emptyTitle="No wallets found"
            emptyDescription="No wallets match your current filters."
          />
        </CardContent>
      </Card>
    </div>
  );
}
