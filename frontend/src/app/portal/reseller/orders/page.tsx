"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Clock3, Package, Search, ShoppingCart, Wallet } from "lucide-react";

type ResellerOrder = {
  _id: Id<"orders">;
  orderNumber: string;
  customerId: string;
  customerType: string;
  totalCents: number;
  status: string;
  paymentMethod?: string;
  createdAt: number;
  schoolName: string;
  schoolEmail?: string | null;
  schoolPhone?: string | null;
  itemCount: number;
};

type ResellerOrderDetail = ResellerOrder & {
  items: Array<{
    _id: Id<"orderItems">;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    productName?: string;
    productCategory?: string | null;
  }>;
};

function formatMoney(amountCents: number) {
  return `KES ${(amountCents / 100).toLocaleString()}`;
}

function statusVariant(status: string) {
  if (["paid", "processing", "shipped", "delivered"].includes(status)) return "default";
  if (["cancelled", "refunded"].includes(status)) return "destructive";
  return "outline";
}

export default function ResellerOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<Id<"orders"> | null>(null);

  const orders = useQuery(
    api.modules.reseller.queries.orders.getOrders,
    statusFilter === "all" ? {} : { status: statusFilter }
  ) as ResellerOrder[] | undefined;

  const selectedOrder = useQuery(
    api.modules.reseller.queries.orders.getOrderDetail,
    selectedOrderId ? { orderId: selectedOrderId } : "skip"
  ) as ResellerOrderDetail | undefined;

  const allOrders = orders ?? [];

  const filteredOrders = useMemo(
    () =>
      allOrders.filter((order) =>
        [order.orderNumber, order.schoolName, order.customerId, order.schoolEmail ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [allOrders, search]
  );

  const stats = useMemo(
    () => ({
      total: allOrders.length,
      pending: allOrders.filter((order) => order.status === "pending").length,
      active: allOrders.filter((order) =>
        ["paid", "processing", "shipped"].includes(order.status)
      ).length,
      completed: allOrders.filter((order) => order.status === "delivered").length,
      revenueCents: allOrders
        .filter((order) => !["cancelled", "refunded"].includes(order.status))
        .reduce((sum, order) => sum + order.totalCents, 0),
    }),
    [allOrders]
  );

  if (!orders) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Live order activity across the schools assigned to your reseller account."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock3 className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-sm text-muted-foreground">In Flight</p>
              <p className="text-2xl font-semibold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-semibold">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wallet className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Order Value</p>
              <p className="text-2xl font-semibold">{formatMoney(stats.revenueCents)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by order, school, or customer..."
            className="max-w-xl"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Feed</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No orders found"
              description="There are no live orders matching the current reseller filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Order</th>
                    <th className="py-3 pr-4 font-medium">School</th>
                    <th className="py-3 pr-4 font-medium">Items</th>
                    <th className="py-3 pr-4 font-medium">Payment</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Placed</th>
                    <th className="py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="border-b last:border-0">
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{order.customerId}</p>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-medium">{order.schoolName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.schoolEmail ?? "No school email"}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        {order.itemCount} items · {formatMoney(order.totalCents)}
                      </td>
                      <td className="py-4 pr-4">
                        {order.paymentMethod ? order.paymentMethod.replaceAll("_", " ") : "Awaiting payment"}
                      </td>
                      <td className="py-4 pr-4">
                        <Badge variant={statusVariant(order.status)}>
                          {order.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(order._id)}>
                          View
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

      <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedOrder?.orderNumber ?? "Order details"}</DialogTitle>
            <DialogDescription>
              Live order line items from Convex for the selected reseller-managed school.
            </DialogDescription>
          </DialogHeader>

          {!selectedOrder ? (
            <LoadingSkeleton variant="table" />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">School</p>
                    <p className="font-medium">{selectedOrder.schoolName}</p>
                    <p>{selectedOrder.schoolEmail ?? "No school email"}</p>
                    <p>{selectedOrder.schoolPhone ?? "No school phone"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">Order Summary</p>
                    <p>{formatMoney(selectedOrder.totalCents)}</p>
                    <p>{selectedOrder.paymentMethod ?? "No payment method recorded"}</p>
                    <Badge variant={statusVariant(selectedOrder.status)}>
                      {selectedOrder.status.replaceAll("_", " ")}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Line Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedOrder.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No order items were returned.</p>
                  ) : (
                    selectedOrder.items.map((item) => (
                      <div key={item._id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                        <div>
                          <p className="font-medium">{item.productName ?? "Unknown product"}</p>
                          <p className="text-muted-foreground">
                            Quantity: {item.quantity}
                            {item.productCategory ? ` · ${item.productCategory}` : ""}
                          </p>
                        </div>
                        <span>{formatMoney(item.lineTotalCents)}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
