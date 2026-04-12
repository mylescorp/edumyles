"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Search, ShoppingCart, Store, Wallet } from "lucide-react";

type ResellerCustomer = {
  schoolId: string;
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  status: string;
  source: string;
  subscriptionPlan: string | null;
  subscriptionValue: number | null;
  commissionRate: number;
  commissionEarned: number;
  orderCount: number;
  totalOrderCents: number;
  lastOrderAt: number | null;
  county: string | null;
  country: string | null;
  tenantStatus: string | null;
  tenantPlan: string | null;
};

function formatMoney(amount: number) {
  return `KES ${amount.toLocaleString()}`;
}

function formatMoneyFromCents(amountCents: number) {
  return `KES ${(amountCents / 100).toLocaleString()}`;
}

function statusVariant(status: string) {
  if (status === "converted") return "default";
  if (["trial", "demo_scheduled", "contacted"].includes(status)) return "secondary";
  if (status === "lead") return "outline";
  return "destructive";
}

export default function ResellerCustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const customers = useQuery((api as any)["modules/reseller/queries/customers"].getCustomers, {}) as
    | ResellerCustomer[]
    | undefined;

  const allCustomers = customers ?? [];
  const filteredCustomers = useMemo(
    () =>
      allCustomers.filter((customer) => {
        const haystack = [
          customer.schoolName,
          customer.schoolEmail,
          customer.schoolPhone,
          customer.county ?? "",
          customer.country ?? "",
          customer.source,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [allCustomers, search, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: allCustomers.length,
      converted: allCustomers.filter((customer) => customer.status === "converted").length,
      orderValueCents: allCustomers.reduce((sum, customer) => sum + customer.totalOrderCents, 0),
      commissionKes: allCustomers.reduce((sum, customer) => sum + customer.commissionEarned, 0),
    }),
    [allCustomers]
  );

  if (!customers) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Live school accounts linked to your reseller profile through reseller school assignments."
        actions={
          <Button asChild variant="outline">
            <Link href="/portal/reseller/orders">Open orders</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Assigned Schools</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Converted</p>
              <p className="text-2xl font-semibold">{stats.converted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShoppingCart className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-sm text-muted-foreground">Order Value</p>
              <p className="text-2xl font-semibold">{formatMoneyFromCents(stats.orderValueCents)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wallet className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Commission Earned</p>
              <p className="text-2xl font-semibold">{formatMoney(stats.commissionKes)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Customers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by school, email, phone, or region..."
            className="max-w-xl"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="lead">Lead</option>
            <option value="contacted">Contacted</option>
            <option value="demo_scheduled">Demo scheduled</option>
            <option value="trial">Trial</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No customers found"
              description="There are no live reseller customer records matching the current filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">School</th>
                    <th className="py-3 pr-4 font-medium">Stage</th>
                    <th className="py-3 pr-4 font-medium">Orders</th>
                    <th className="py-3 pr-4 font-medium">Revenue</th>
                    <th className="py-3 pr-4 font-medium">Commission</th>
                    <th className="py-3 pr-4 font-medium">Region</th>
                    <th className="py-3 pr-4 font-medium">Last Order</th>
                    <th className="py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.schoolId} className="border-b last:border-0">
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-medium">{customer.schoolName}</p>
                          <p className="text-muted-foreground">{customer.schoolEmail}</p>
                          <p className="text-xs text-muted-foreground">{customer.schoolPhone}</p>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <Badge variant={statusVariant(customer.status)}>
                          {customer.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4">
                        <div>
                          <p>{customer.orderCount} orders</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.subscriptionPlan ?? customer.tenantPlan ?? "No plan set"}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 pr-4">{formatMoneyFromCents(customer.totalOrderCents)}</td>
                      <td className="py-4 pr-4">
                        <div>
                          <p>{formatMoney(customer.commissionEarned)}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.commissionRate}% rate
                          </p>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        {[customer.county, customer.country].filter(Boolean).join(", ") || "Unknown"}
                      </td>
                      <td className="py-4 pr-4">
                        {customer.lastOrderAt
                          ? new Date(customer.lastOrderAt).toLocaleDateString()
                          : "No orders yet"}
                      </td>
                      <td className="py-4 text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href="/portal/reseller/orders">View orders</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
