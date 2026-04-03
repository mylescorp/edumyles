"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function StudentWalletPage() {
  const { isLoading, sessionToken } = useAuth();

  const myWallet = useQuery(
    api.modules.ewallet.queries.getMyWalletBalance,
    sessionToken ? { sessionToken } : "skip"
  );

  const myTransactions = useQuery(
    api.modules.ewallet.queries.getMyTransactionHistory,
    sessionToken ? { sessionToken, limit: 20 } : "skip"
  );

  if (isLoading || myWallet === undefined || myTransactions === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const formatCurrency = (cents: number, currency: string) => {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  };

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

  return (
    <div>
      <PageHeader
        title="My eWallet"
        description="Manage your digital wallet and view transaction history"
      />

      <div className="space-y-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Current Balance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">
              {formatCurrency(myWallet.balanceCents, myWallet.currency)}
            </div>
            <p className="text-blue-100 text-sm mt-2">
              Available for payments and purchases
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Top up your wallet with various payment methods
              </p>
              <Button className="w-full" asChild>
                <Link href="/portal/student/wallet/topup">
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Add Funds
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send Money</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Send money to other students or make payments
              </p>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/portal/student/wallet/send">
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Send Money
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View your complete transaction history
              </p>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/portal/student/wallet/transactions">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Transactions</span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/portal/student/wallet/transactions">
                  View All
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                <p className="text-muted-foreground">
                  Your transaction history will appear here once you start using your eWallet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myTransactions.map((transaction: any) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-full">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.createdAt), "PPP p")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        className={`${getTransactionColor(transaction.type)} border`}
                        variant="outline"
                      >
                        <div className="flex items-center space-x-1">
                          {getTransactionIcon(transaction.type)}
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </Badge>
                      <p className="font-bold mt-1">
                        {transaction.type === "credit" || transaction.type === "refund" ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amountCents), myWallet.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
