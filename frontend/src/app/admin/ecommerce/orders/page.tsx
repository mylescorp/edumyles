"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Order = {
    _id: string;
    tenantId: string;
    orderNumber: string;
    customerId: string;
    customerType: string;
    totalCents: number;
    status: string;
    paymentMethod?: string;
    createdAt: number;
    updatedAt: number;
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    paid: "default",
    processing: "secondary",
    shipped: "secondary",
    delivered: "default",
    cancelled: "destructive",
    refunded: "outline",
};

export default function OrdersPage() {
    const { isLoading, sessionToken } = useAuth();
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const orders = useQuery(
        api.modules.ecommerce.queries.listOrders,
        sessionToken
            ? { sessionToken, status: statusFilter === "all" ? undefined : statusFilter }
            : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const columns: Column<Order>[] = [
        {
            key: "orderNumber",
            header: "Order #",
            cell: (row) => <span className="font-medium">{row.orderNumber}</span>,
            sortable: true,
        },
        {
            key: "customerId",
            header: "Customer ID",
            cell: (row) => row.customerId,
        },
        {
            key: "customerType",
            header: "Customer Type",
            cell: (row) => <span className="capitalize">{row.customerType}</span>,
        },
        {
            key: "totalCents",
            header: "Total",
            cell: (row) => {
                const amount = row.totalCents / 100;
                return `KES ${amount.toFixed(2)}`;
            },
            sortable: true,
        },
        {
            key: "paymentMethod",
            header: "Payment",
            cell: (row) => row.paymentMethod ? (
                <span className="capitalize">{row.paymentMethod.replace("_", " ")}</span>
            ) : (
                <span className="text-muted-foreground">—</span>
            ),
        },
        {
            key: "status",
            header: "Status",
            cell: (row) => (
                <Badge variant={statusColors[row.status] ?? "outline"}>
                    {row.status.replace("_", " ")}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Date",
            cell: (row) => new Date(row.createdAt).toLocaleDateString(),
            sortable: true,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Orders"
                description="Review ecommerce orders and fulfillment activity"
            />

            <div className="mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                data={(orders as Order[]) ?? []}
                columns={columns}
                searchable
                searchPlaceholder="Search by order number or customer ID..."
                searchKey={(row) => `${row.orderNumber} ${row.customerId}`}
                emptyTitle="No orders found"
                emptyDescription="Ecommerce orders will appear here once customers place them."
            />
        </div>
    );
}
