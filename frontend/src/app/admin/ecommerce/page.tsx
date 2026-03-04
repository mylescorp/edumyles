"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Package, Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Product = {
    _id: string;
    name: string;
    priceCents: number;
    stock: number;
    category?: string;
    status: string;
};

type Order = {
    _id: string;
    orderNumber: string;
    totalCents: number;
    status: string;
    createdAt: number;
};

export default function ECommercePage() {
    const { isLoading, sessionToken } = useAuth();

    const products = useQuery(
        api.modules.ecommerce.queries.listProducts,
        sessionToken ? {} : "skip"
    );

    const orders = useQuery(
        api.modules.ecommerce.queries.listOrders,
        sessionToken ? {} : "skip"
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const productColumns: Column<Product>[] = [
        {
            key: "name",
            header: "Product Name",
            sortable: true,
        },
        {
            key: "category",
            header: "Category",
            cell: (row: Product) => row.category ?? "—",
            sortable: true,
        },
        {
            key: "price",
            header: "Price",
            cell: (row: Product) => formatCurrency(row.priceCents),
            sortable: true,
        },
        {
            key: "stock",
            header: "Stock",
            cell: (row: Product) => (
                <div className="flex items-center gap-2">
                    <span>{row.stock}</span>
                    {row.stock <= 5 && (
                        <Badge variant="destructive">Low</Badge>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Product) => (
                <Badge variant={row.status === "active" ? "default" : "secondary"}>
                    {row.status}
                </Badge>
            ),
        },
    ];

    const orderColumns: Column<Order>[] = [
        {
            key: "orderNumber",
            header: "Order #",
            sortable: true,
        },
        {
            key: "total",
            header: "Total",
            cell: (row: Order) => formatCurrency(row.totalCents),
            sortable: true,
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Order) => (
                <Badge variant={row.status === "completed" ? "default" : "secondary"}>
                    {row.status}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Date",
            cell: (row: Order) => formatDate(row.createdAt),
            sortable: true,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="eCommerce Management"
                description="Manage school products and orders"
            />

            <Tabs defaultValue="products">
                <TabsList className="mb-4">
                    <TabsTrigger value="products" className="gap-2">
                        <Package className="h-4 w-4" />
                        Products
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Orders
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="products">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Product Catalog</CardTitle>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Product
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={products ?? []}
                                columns={productColumns}
                                searchable
                                searchPlaceholder="Search products..."
                                emptyTitle="No products found"
                                emptyDescription="Add products to your school store."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={orders ?? []}
                                columns={orderColumns}
                                searchable
                                searchPlaceholder="Search by order number..."
                                emptyTitle="No orders found"
                                emptyDescription="Customer orders will appear here."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
