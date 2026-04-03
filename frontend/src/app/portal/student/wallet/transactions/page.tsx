"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpCircle, ArrowDownCircle, Clock, Wallet, Search, Filter } from "lucide-react";

type WalletTransaction = {
  _id: string;
  description: string;
  type: "credit" | "debit" | "refund";
  amountCents: number;
  balanceAfter: number;
  referenceType: string;
  createdAt: number;
};

export default function StudentTransactionsPage() {
  const { isLoading, sessionToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  const myTransactions = useQuery(
    api.modules.ewallet.queries.getMyTransactionHistory,
    sessionToken
      ? { sessionToken, limit, type: typeFilter === "all" ? undefined : typeFilter }
      : "skip"
  ) as WalletTransaction[] | undefined;

  const myWallet = useQuery(
    api.modules.ewallet.queries.getMyWalletBalance,
    sessionToken ? { sessionToken } : "skip"
  );

  if (isLoading || myTransactions === undefined || myWallet === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const formatCurrency = (cents: number, currency: string) => `${(cents / 100).toFixed(2)} ${currency}`;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit":
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
      case "debit":
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      case "refund":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "credit":
        return "bg-green-50 text-green-800 border-green-200";
      case "debit":
        return "bg-red-50 text-red-800 border-red-200";
      case "refund":
        return "bg-blue-50 text-blue-800 border-blue-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  const filteredTransactions = myTransactions.filter((transaction) =>
    `${transaction.description} ${transaction.referenceType}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Transaction History"
        description="View your complete eWallet transaction history"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="credit">Credits Only</SelectItem>
                    <SelectItem value="debit">Debits Only</SelectItem>
                    <SelectItem value="refund">Refunds Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Balance</label>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(myWallet.balanceCents, myWallet.currency)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Transactions ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || typeFilter !== "all"
                    ? "Try adjusting your filters to see more transactions."
                    : "Your transaction history will appear here once you start using your eWallet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-muted rounded-full">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{format(new Date(transaction.createdAt), "PPP p")}</span>
                          <Badge variant="outline" className="text-xs">
                            {transaction.referenceType.replaceAll("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={`${getTransactionColor(transaction.type)} border mb-2`}
                        variant="outline"
                      >
                        <div className="flex items-center space-x-1">
                          {getTransactionIcon(transaction.type)}
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </Badge>
                      <p className="font-bold">
                        {transaction.type === "credit" || transaction.type === "refund" ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amountCents), myWallet.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: {formatCurrency(transaction.balanceAfter, myWallet.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {filteredTransactions.length >= limit && (
          <div className="text-center">
            <Button variant="outline" onClick={() => setLimit((current) => current + 50)}>
              Load More Transactions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
