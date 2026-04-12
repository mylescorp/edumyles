"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Globe2, LineChart, ShoppingCart, Target, Users } from "lucide-react";

type CommissionSummary = {
  summary: {
    totalAmount: number;
    totalCount: number;
    byType: Record<string, { count: number; amount: number }>;
  };
  dailyData: Array<{
    date: string;
    earned: number;
    count: number;
  }>;
};

type ResellerStats = {
  conversionRate?: number;
};

type ResellerOrder = {
  totalCents: number;
};

type ResellerCustomer = {
  schoolId: string;
  schoolName: string;
  status: string;
  orderCount: number;
  totalOrderCents: number;
  county: string | null;
  country: string | null;
  tenantPlan: string | null;
};

function formatMoney(amount: number) {
  return `KES ${amount.toLocaleString()}`;
}

function formatMoneyFromCents(amountCents: number) {
  return `KES ${(amountCents / 100).toLocaleString()}`;
}

function changeIndicator(current: number, previous: number) {
  if (previous === 0) {
    return { direction: "up" as const, value: current > 0 ? 100 : 0 };
  }
  const delta = ((current - previous) / previous) * 100;
  return { direction: delta >= 0 ? ("up" as const) : ("down" as const), value: Math.abs(delta) };
}

export default function ResellerAnalyticsPage() {
  const [period, setPeriod] = useState<"30d" | "90d" | "1y">("30d");

  const summary = useQuery(api.modules.reseller.mutations.commissions.getCommissionSummary, {
    period,
  }) as CommissionSummary | undefined;
  const stats = useQuery(api.modules.reseller.mutations.profile.getStats, {}) as
    | ResellerStats
    | undefined;
  const orders = useQuery(api.modules.reseller.queries.orders.getOrders, {}) as
    | ResellerOrder[]
    | undefined;
  const customers = useQuery((api as any)["modules/reseller/queries/customers"].getCustomers, {}) as
    | ResellerCustomer[]
    | undefined;

  const orderMetrics = useMemo(() => {
    const entries = orders ?? [];
    const totalValueCents = entries.reduce((sum, order) => sum + order.totalCents, 0);
    return {
      totalOrders: entries.length,
      totalValueCents,
      averageOrderCents: entries.length > 0 ? Math.round(totalValueCents / entries.length) : 0,
    };
  }, [orders]);

  const customerStatusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const customer of customers ?? []) {
      map.set(customer.status, (map.get(customer.status) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [customers]);

  const regionBreakdown = useMemo(() => {
    const map = new Map<string, { customers: number; orderCents: number }>();
    for (const customer of customers ?? []) {
      const region = [customer.county, customer.country].filter(Boolean).join(", ") || "Unknown region";
      const entry = map.get(region) ?? { customers: 0, orderCents: 0 };
      entry.customers += 1;
      entry.orderCents += customer.totalOrderCents;
      map.set(region, entry);
    }
    return Array.from(map.entries())
      .map(([region, value]) => ({ region, ...value }))
      .sort((a, b) => b.orderCents - a.orderCents)
      .slice(0, 6);
  }, [customers]);

  const topCustomers = useMemo(() => (customers ?? []).slice(0, 5), [customers]);
  const topCommissionTypes = useMemo(() => {
    const entries = Object.entries(summary?.summary.byType ?? {});
    return entries.sort((a, b) => b[1].amount - a[1].amount);
  }, [summary]);

  const periodComparison = useMemo(() => {
    const data = summary?.dailyData ?? [];
    if (data.length === 0) {
      return { direction: "up" as const, value: 0 };
    }
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);
    const firstAmount = firstHalf.reduce((sum, item) => sum + item.earned, 0);
    const secondAmount = secondHalf.reduce((sum, item) => sum + item.earned, 0);
    return changeIndicator(secondAmount, firstAmount);
  }, [summary]);

  if (!summary || !stats || !orders || !customers) {
    return <LoadingSkeleton variant="page" />;
  }

  const totalCustomers = customers.length;
  const convertedCustomers = customers.filter((customer) => customer.status === "converted").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Live reseller analytics built from commissions, orders, and assigned school records."
        actions={
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as "30d" | "90d" | "1y")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <LineChart className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Commission Earned</p>
              <p className="text-2xl font-semibold">{formatMoney(summary.summary.totalAmount)}</p>
              <p className="flex items-center text-xs text-muted-foreground">
                {periodComparison.direction === "up" ? (
                  <ArrowUp className="mr-1 h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                {periodComparison.value.toFixed(1)}% versus previous period slice
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShoppingCart className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-semibold">{orderMetrics.totalOrders}</p>
              <p className="text-xs text-muted-foreground">
                Avg {formatMoneyFromCents(orderMetrics.averageOrderCents)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Customers</p>
              <p className="text-2xl font-semibold">{totalCustomers}</p>
              <p className="text-xs text-muted-foreground">
                {convertedCustomers} converted schools
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Target className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-semibold">{stats.conversionRate ?? 0}%</p>
              <p className="text-xs text-muted-foreground">
                {formatMoneyFromCents(orderMetrics.totalValueCents)} total order value
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commission By Type</CardTitle>
          </CardHeader>
          <CardContent>
            {topCommissionTypes.length === 0 ? (
              <EmptyState
                icon={LineChart}
                title="No commission activity"
                description="Commission type analytics will populate as new reseller commissions are earned."
              />
            ) : (
              <div className="space-y-3">
                {topCommissionTypes.map(([type, entry]) => (
                  <div key={type} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p className="font-medium capitalize">{type.replaceAll("_", " ")}</p>
                      <p className="text-muted-foreground">{entry.count} records</p>
                    </div>
                    <p className="font-medium">{formatMoney(entry.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Lifecycle</CardTitle>
          </CardHeader>
          <CardContent>
            {customerStatusBreakdown.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No customer lifecycle data"
                description="Assigned schools will populate the lifecycle view."
              />
            ) : (
              <div className="space-y-3">
                {customerStatusBreakdown.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span className="font-medium capitalize">{status.replaceAll("_", " ")}</span>
                    <Badge variant={status === "converted" ? "default" : "outline"}>{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Customers By Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No customer revenue yet"
                description="Top customer rankings will appear once reseller-linked schools start ordering."
              />
            ) : (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div
                    key={customer.schoolId}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {index + 1}. {customer.schoolName}
                      </p>
                      <p className="text-muted-foreground">
                        {customer.orderCount} orders
                        {customer.tenantPlan ? ` · ${customer.tenantPlan} plan` : ""}
                      </p>
                    </div>
                    <p className="font-medium">{formatMoneyFromCents(customer.totalOrderCents)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {regionBreakdown.length === 0 ? (
              <EmptyState
                icon={Globe2}
                title="No location data yet"
                description="Regions will appear as soon as reseller-linked schools have tenant details."
              />
            ) : (
              <div className="space-y-3">
                {regionBreakdown.map((region) => (
                  <div
                    key={region.region}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{region.region}</p>
                      <p className="text-muted-foreground">{region.customers} schools</p>
                    </div>
                    <p className="font-medium">{formatMoneyFromCents(region.orderCents)}</p>
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
