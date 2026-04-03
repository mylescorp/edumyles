"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, PackageCheck, Clock3, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatusSchema } from "@shared/validators";

type Order = {
  _id: Id<"orders">;
  orderNumber: string;
  customerId: string;
  customerType: string;
  totalCents: number;
  status: string;
  paymentMethod?: string;
  createdAt: number;
  updatedAt: number;
};

type OrderDetail = Order & {
  items: Array<{
    _id: Id<"orderItems">;
    productId: string;
    productName?: string;
    productCategory?: string | null;
    quantity: number;
    unitPriceCents: number;
  }>;
};

const ORDER_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  paid: "default",
  processing: "secondary",
  shipped: "secondary",
  delivered: "default",
  cancelled: "destructive",
  refunded: "outline",
};

function formatMoney(amountCents: number) {
  return `KES ${(amountCents / 100).toFixed(2)}`;
}

export default function OrdersPage() {
  const { isLoading, sessionToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<Id<"orders"> | null>(null);
  const [nextStatus, setNextStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const orders = useQuery(
    api.modules.ecommerce.queries.listOrders,
    sessionToken ? { sessionToken, status: statusFilter === "all" ? undefined : statusFilter } : "skip"
  );

  const selectedOrder = useQuery(
    api.modules.ecommerce.queries.getOrder,
    sessionToken && selectedOrderId ? { sessionToken, orderId: selectedOrderId } : "skip"
  ) as OrderDetail | null | undefined;

  const updateOrderStatus = useMutation(api.modules.ecommerce.mutations.updateOrderStatus);

  const allOrders = (orders as Order[]) ?? [];

  const stats = useMemo(() => ({
    total: allOrders.length,
    pending: allOrders.filter((order) => order.status === "pending").length,
    processing: allOrders.filter((order) => order.status === "processing" || order.status === "shipped").length,
    completed: allOrders.filter((order) => order.status === "delivered").length,
    revenueCents: allOrders
      .filter((order) => ["paid", "processing", "shipped", "delivered"].includes(order.status))
      .reduce((sum, order) => sum + order.totalCents, 0),
  }), [allOrders]);

  const openOrder = (order: Order) => {
    setSelectedOrderId(order._id);
    setNextStatus(order.status);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrderId) return;

    const parsed = updateOrderStatusSchema.safeParse({
      orderId: selectedOrderId,
      status: nextStatus,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid order status update.");
      return;
    }

    setIsUpdating(true);
    try {
      await updateOrderStatus({
        orderId: selectedOrderId,
        status: parsed.data.status,
      });
      toast.success("Order status updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update order status.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      header: "Order #",
      cell: (row) => <button type="button" className="font-medium text-primary hover:underline" onClick={() => openOrder(row)}>{row.orderNumber}</button>,
      sortable: true,
    },
    {
      key: "customerId",
      header: "Customer",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.customerId}</p>
          <p className="text-sm text-muted-foreground capitalize">{row.customerType}</p>
        </div>
      ),
    },
    {
      key: "totalCents",
      header: "Total",
      cell: (row) => formatMoney(row.totalCents),
      sortable: true,
    },
    {
      key: "paymentMethod",
      header: "Payment",
      cell: (row) => row.paymentMethod ? row.paymentMethod.replaceAll("_", " ") : "Awaiting payment",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={statusColors[row.status] ?? "outline"}>{row.status.replaceAll("_", " ")}</Badge>,
    },
    {
      key: "createdAt",
      header: "Placed",
      cell: (row) => new Date(row.createdAt).toLocaleString(),
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <Button size="sm" variant="outline" onClick={() => openOrder(row)}>
          Manage
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Review ecommerce orders and keep fulfillment status in sync with the backend."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatsCard title="Total Orders" value={stats.total} description="All recorded ecommerce orders" icon={ShoppingCart} />
        <AdminStatsCard title="Pending" value={stats.pending} description="Awaiting payment or review" icon={Clock3} variant={stats.pending > 0 ? "warning" : "default"} />
        <AdminStatsCard title="In Fulfillment" value={stats.processing} description="Processing or shipped" icon={PackageCheck} />
        <AdminStatsCard title="Delivered" value={stats.completed} description="Completed orders" icon={PackageCheck} variant="success" />
        <AdminStatsCard title="Recognized Revenue" value={formatMoney(stats.revenueCents)} description="Paid and fulfilled order value" icon={ShoppingCart} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <DataTable
        data={allOrders}
        columns={columns}
        searchable
        searchPlaceholder="Search by order number or customer ID..."
        searchKey={(row) => `${row.orderNumber} ${row.customerId} ${row.customerType}`}
        emptyTitle="No orders found"
        emptyDescription="Orders will appear here when families or students place purchases."
      />

      <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOrder?.orderNumber ?? "Order Details"}</DialogTitle>
            <DialogDescription>
              Review order items and update fulfillment status from the live ecommerce backend.
            </DialogDescription>
          </DialogHeader>

          {!selectedOrder ? (
            <LoadingSkeleton variant="table" />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customerId}</p>
                  <p className="text-sm capitalize text-muted-foreground">{selectedOrder.customerType}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Order Total</p>
                  <p className="font-medium">{formatMoney(selectedOrder.totalCents)}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.paymentMethod ? selectedOrder.paymentMethod.replaceAll("_", " ") : "No payment method recorded yet"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium">Order Items</p>
                  <Badge variant={statusColors[selectedOrder.status] ?? "outline"}>
                    {selectedOrder.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                {selectedOrder.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No order items were returned for this order.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item._id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{item.productName ?? item.productId}</p>
                          <p className="text-muted-foreground">
                            Quantity: {item.quantity}
                            {item.productCategory ? ` • ${item.productCategory}` : ""}
                          </p>
                        </div>
                        <span>{formatMoney(item.unitPriceCents * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label htmlFor="order-status">Update Fulfillment Status</Label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Select value={nextStatus} onValueChange={setNextStatus}>
                    <SelectTrigger id="order-status" className="sm:max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleStatusUpdate} disabled={isUpdating || nextStatus === selectedOrder.status}>
                    {isUpdating ? "Saving..." : "Save Status"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Stock reduction happens when the order is created. This screen is for lifecycle and fulfillment tracking.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
