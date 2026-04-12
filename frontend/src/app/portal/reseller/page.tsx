"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  LineChart,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";

type ResellerStats = {
  schools: {
    total: number;
    active: number;
    leads: number;
    trials: number;
  };
  commissions: {
    total: number;
    pending: number;
    available: number;
    paid: number;
    totalAmount: number;
  };
  payouts: {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
  };
  conversionRate?: number;
};

type CommissionBalance = {
  availableAmount: number;
  pendingAmount: number;
  availableCount: number;
  pendingCount: number;
  minPayout: number;
  canPayout: boolean;
};

type ResellerOrder = {
  _id: string;
  orderNumber: string;
  totalCents: number;
  status: string;
  schoolName: string;
  itemCount: number;
};

type ResellerCustomer = {
  schoolId: string;
  schoolName: string;
  status: string;
  orderCount: number;
  totalOrderCents: number;
  commissionEarned: number;
  county: string | null;
  country: string | null;
};

function formatMoney(amount: number) {
  return `KES ${amount.toLocaleString()}`;
}

function formatMoneyFromCents(amountCents: number) {
  return `KES ${(amountCents / 100).toLocaleString()}`;
}

function statusVariant(status: string) {
  if (["converted", "completed", "delivered", "active"].includes(status)) return "default";
  if (["trial", "processing", "paid"].includes(status)) return "secondary";
  if (["lead", "contacted", "pending"].includes(status)) return "outline";
  return "destructive";
}

export default function ResellerDashboardPage() {
  const stats = useQuery(api.modules.reseller.mutations.profile.getStats, {}) as
    | ResellerStats
    | undefined;
  const balance = useQuery(
    api.modules.reseller.mutations.profile.getCommissionBalance,
    {}
  ) as CommissionBalance | undefined;
  const orders = useQuery(api.modules.reseller.queries.orders.getOrders, {}) as
    | ResellerOrder[]
    | undefined;
  const customers = useQuery((api as any)["modules/reseller/queries/customers"].getCustomers, {}) as
    | ResellerCustomer[]
    | undefined;

  const recentOrders = useMemo(() => (orders ?? []).slice(0, 5), [orders]);
  const topCustomers = useMemo(() => (customers ?? []).slice(0, 5), [customers]);
  const customerStageSummary = useMemo(() => {
    const summary = new Map<string, number>();
    for (const customer of customers ?? []) {
      summary.set(customer.status, (summary.get(customer.status) ?? 0) + 1);
    }
    return Array.from(summary.entries()).sort((a, b) => b[1] - a[1]);
  }, [customers]);

  const derivedOrderValueCents = useMemo(
    () => (orders ?? []).reduce((sum, order) => sum + order.totalCents, 0),
    [orders]
  );
  const averageOrderValueCents = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    return Math.round(derivedOrderValueCents / orders.length);
  }, [derivedOrderValueCents, orders]);

  if (!stats || !balance || !orders || !customers) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reseller Dashboard"
        description="Live performance across your assigned schools, order activity, and commission balance."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/portal/reseller/customers">Manage Customers</Link>
            </Button>
            <Button asChild>
              <Link href="/portal/reseller/analytics">View Analytics</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Tracked Schools</p>
              <p className="text-2xl font-semibold">{stats.schools.total}</p>
              <p className="text-xs text-muted-foreground">
                {stats.schools.active} converted, {stats.schools.trials} in trial
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShoppingCart className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-sm text-muted-foreground">Order Value</p>
              <p className="text-2xl font-semibold">{formatMoneyFromCents(derivedOrderValueCents)}</p>
              <p className="text-xs text-muted-foreground">{orders.length} live orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Banknote className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Available Commission</p>
              <p className="text-2xl font-semibold">{formatMoney(balance.availableAmount)}</p>
              <p className="text-xs text-muted-foreground">
                {balance.availableCount} commissions ready for payout
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <LineChart className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-semibold">{stats.conversionRate ?? 0}%</p>
              <p className="text-xs text-muted-foreground">
                Avg order {formatMoneyFromCents(averageOrderValueCents)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Orders</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/reseller/orders">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No reseller orders yet"
                description="Orders will appear here as your assigned schools start purchasing."
              />
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{order.schoolName}</p>
                      <p className="text-muted-foreground">
                        {order.orderNumber} · {order.itemCount} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMoneyFromCents(order.totalCents)}</p>
                      <Badge variant={statusVariant(order.status)}>
                        {order.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customerStageSummary.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No assigned schools yet"
                description="Lead and customer stage distribution will appear once schools are assigned."
              />
            ) : (
              customerStageSummary.map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    {stage === "converted" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock3 className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="font-medium capitalize">{stage.replaceAll("_", " ")}</span>
                  </div>
                  <Badge variant={statusVariant(stage)}>{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Top Customers</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/reseller/customers">
                Open customers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <EmptyState
                icon={Store}
                title="No customer records yet"
                description="Assigned schools will appear here once linked to your reseller account."
              />
            ) : (
              <div className="space-y-3">
                {topCustomers.map((customer) => (
                  <div
                    key={customer.schoolId}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{customer.schoolName}</p>
                      <p className="text-muted-foreground">
                        {customer.county ?? "Unknown county"}
                        {customer.country ? `, ${customer.country}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customer.orderCount} orders · {formatMoney(customer.commissionEarned)} earned
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMoneyFromCents(customer.totalOrderCents)}</p>
                      <Badge variant={statusVariant(customer.status)}>
                        {customer.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Pending commission</p>
              <p className="mt-1 text-xl font-semibold">{formatMoney(balance.pendingAmount)}</p>
              <p className="text-xs text-muted-foreground">
                {balance.pendingCount} records still in hold period
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Paid out</p>
              <p className="mt-1 text-xl font-semibold">{formatMoney(stats.payouts.totalAmount)}</p>
              <p className="text-xs text-muted-foreground">
                {stats.payouts.completed} completed payouts
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Payout threshold</p>
              <p className="mt-1 text-xl font-semibold">{formatMoney(balance.minPayout)}</p>
              <p className="text-xs text-muted-foreground">
                {balance.canPayout ? "You can request a payout now." : "Keep earning to unlock payout."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
