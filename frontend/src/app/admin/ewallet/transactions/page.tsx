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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Wallet, 
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { useState } from "react";

type Transaction = {
  _id: string;
  type: "credit" | "debit" | "transfer" | "fee" | "refund";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "reversed";
  fromWallet?: {
    id: string;
    user: string;
    type: string;
  };
  toWallet?: {
    id: string;
    user: string;
    type: string;
  };
  reference: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  fee?: number;
  method: "wallet" | "card" | "bank" | "mobile";
};

export default function TransactionsPage() {
  const { isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: "credit",
    amount: "",
    walletId: "",
    reference: "",
    description: "",
    method: "wallet",
  });

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // Mock data for demonstration
  const transactions: Transaction[] = [
    {
      _id: "txn1",
      type: "credit",
      amount: 1000.00,
      currency: "KES",
      status: "completed",
      toWallet: {
        id: "wallet1",
        user: "Alice Johnson",
        type: "student",
      },
      reference: "TOPUP-2024-001",
      description: "Monthly allowance top-up",
      createdAt: "2024-03-08T10:30:00Z",
      completedAt: "2024-03-08T10:30:15Z",
      method: "mobile",
    },
    {
      _id: "txn2",
      type: "debit",
      amount: 250.50,
      currency: "KES",
      status: "completed",
      fromWallet: {
        id: "wallet1",
        user: "Alice Johnson",
        type: "student",
      },
      reference: "PAY-2024-042",
      description: "School fees payment",
      createdAt: "2024-03-08T09:15:00Z",
      completedAt: "2024-03-08T09:15:30Z",
      fee: 5.00,
      method: "wallet",
    },
    {
      _id: "txn3",
      type: "transfer",
      amount: 500.00,
      currency: "KES",
      status: "completed",
      fromWallet: {
        id: "wallet3",
        user: "Mary Wanjiku",
        type: "staff",
      },
      toWallet: {
        id: "wallet2",
        user: "Bob Wilson",
        type: "student",
      },
      reference: "TRANSFER-2024-018",
      description: "Pocket money transfer",
      createdAt: "2024-03-08T08:45:00Z",
      completedAt: "2024-03-08T08:45:20Z",
      fee: 2.50,
      method: "wallet",
    },
    {
      _id: "txn4",
      type: "credit",
      amount: 2000.00,
      currency: "KES",
      status: "pending",
      toWallet: {
        id: "wallet4",
        user: "James Otieno",
        type: "parent",
      },
      reference: "TOPUP-2024-002",
      description: "Bulk wallet funding",
      createdAt: "2024-03-08T07:30:00Z",
      method: "bank",
    },
    {
      _id: "txn5",
      type: "debit",
      amount: 150.00,
      currency: "KES",
      status: "failed",
      fromWallet: {
        id: "wallet2",
        user: "Bob Wilson",
        type: "student",
      },
      reference: "PAY-2024-043",
      description: "Cafeteria purchase",
      createdAt: "2024-03-07T15:20:00Z",
      method: "wallet",
    },
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === "" || 
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.fromWallet?.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.toWallet?.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    totalTransactions: transactions.length,
    completedTransactions: transactions.filter(t => t.status === "completed").length,
    pendingTransactions: transactions.filter(t => t.status === "pending").length,
    failedTransactions: transactions.filter(t => t.status === "failed").length,
    totalVolume: transactions.reduce((sum, t) => sum + t.amount, 0),
    totalFees: transactions.reduce((sum, t) => sum + (t.fee || 0), 0),
  };

  const columns: Column<Transaction>[] = [
    {
      key: "type",
      header: "Type",
      cell: (row: Transaction) => {
        const typeConfig = {
          credit: { icon: ArrowDownLeft, color: "text-green-500", label: "Credit" },
          debit: { icon: ArrowUpRight, color: "text-red-500", label: "Debit" },
          transfer: { icon: ArrowUpRight, color: "text-blue-500", label: "Transfer" },
          fee: { icon: AlertCircle, color: "text-orange-500", label: "Fee" },
          refund: { icon: ArrowDownLeft, color: "text-purple-500", label: "Refund" },
        };
        const config = typeConfig[row.type];
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className="capitalize">{config.label}</span>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (row: Transaction) => (
        <div>
          <p className={`font-medium ${
            row.type === "credit" || row.type === "refund" ? "text-green-600" : "text-red-600"
          }`}>
            {row.type === "credit" || row.type === "refund" ? "+" : "-"}
            {formatCurrency(row.amount)}
          </p>
          {row.fee && (
            <p className="text-xs text-muted-foreground">
              Fee: {formatCurrency(row.fee)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "parties",
      header: "Parties",
      cell: (row: Transaction) => (
        <div className="text-sm">
          {row.fromWallet && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">From:</span>
              <span>{row.fromWallet.user}</span>
              <Badge variant="outline" className="text-xs">
                {row.fromWallet.type}
              </Badge>
            </div>
          )}
          {row.toWallet && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">To:</span>
              <span>{row.toWallet.user}</span>
              <Badge variant="outline" className="text-xs">
                {row.toWallet.type}
              </Badge>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Transaction) => {
        const statusConfig = {
          pending: { color: "secondary", icon: Clock, label: "Pending" },
          completed: { color: "default", icon: CheckCircle, label: "Completed" },
          failed: { color: "destructive", icon: AlertCircle, label: "Failed" },
          reversed: { color: "outline", icon: ArrowUpRight, label: "Reversed" },
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
      key: "details",
      header: "Details",
      cell: (row: Transaction) => (
        <div className="text-sm">
          <p className="font-medium">{row.reference}</p>
          <p className="text-muted-foreground">{row.description}</p>
          <p className="text-xs text-muted-foreground">
            {row.method} • {formatDateTime(row.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Transaction) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">View</Button>
          {row.status === "pending" && (
            <Button size="sm" variant="outline">Process</Button>
          )}
          {row.status === "failed" && (
            <Button size="sm" variant="outline">Retry</Button>
          )}
        </div>
      ),
    },
  ];

  const handleNewTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to createTransaction mutation when eWallet module is configured
    setShowNewTransaction(false);
    setNewTransaction({
      type: "credit",
      amount: "",
      walletId: "",
      reference: "",
      description: "",
      method: "wallet",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Processing"
        description="Process and monitor all wallet transactions"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Export Transactions
            </Button>
            <Button 
              className="gap-2"
              onClick={() => setShowNewTransaction(true)}
            >
              <Plus className="h-4 w-4" />
              New Transaction
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total Transactions"
          value={stats.totalTransactions}
          description="All time"
          icon={Wallet}
          trend={{ value: 15, isPositive: true }}
        />
        <AdminStatsCard
          title="Completed"
          value={stats.completedTransactions}
          description="Successfully processed"
          icon={CheckCircle}
          variant="success"
        />
        <AdminStatsCard
          title="Pending"
          value={stats.pendingTransactions}
          description="Awaiting processing"
          icon={Clock}
          variant="warning"
        />
        <AdminStatsCard
          title="Total Volume"
          value={formatCurrency(stats.totalVolume)}
          description="Transaction amount"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* New Transaction Modal */}
      {showNewTransaction && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNewTransaction} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select 
                    value={newTransaction.type} 
                    onValueChange={(value) => setNewTransaction({...newTransaction, type: value as any})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit (Add Funds)</SelectItem>
                      <SelectItem value="debit">Debit (Remove Funds)</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <Select 
                    value={newTransaction.method} 
                    onValueChange={(value) => setNewTransaction({...newTransaction, method: value as any})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wallet">Wallet Balance</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="mobile">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="amount">Amount (KES)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    placeholder="0.00"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="walletId">Wallet ID</Label>
                  <Input
                    id="walletId"
                    value={newTransaction.walletId}
                    onChange={(e) => setNewTransaction({...newTransaction, walletId: e.target.value})}
                    placeholder="Enter wallet ID"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={newTransaction.reference}
                  onChange={(e) => setNewTransaction({...newTransaction, reference: e.target.value})}
                  placeholder="Transaction reference"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  placeholder="Transaction description"
                  rows={3}
                  className="mt-1"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Process Transaction
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewTransaction(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
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

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredTransactions}
            columns={columns}
            searchable={false} // We have custom search
            emptyTitle="No transactions found"
            emptyDescription="No transactions match your current filters."
          />
        </CardContent>
      </Card>
    </div>
  );
}
