"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingBag, 
  Package, 
  Plus, 
  ClipboardList,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  BarChart3,
  Settings
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import Link from "next/link";

type Product = {
    _id: string;
    name: string;
    priceCents: number;
    stock: number;
    category?: string;
    status: string;
    sku: string;
    image?: string;
    description?: string;
    lowStock?: boolean;
};

type Order = {
    _id: string;
    orderNumber: string;
    totalCents: number;
    status: string;
    createdAt: number;
    customer?: string;
    paymentStatus?: string;
};

export default function ECommercePage() {
    const { isLoading, sessionToken } = useAuth();

    const products = usePlatformQuery(
        api.modules.ecommerce.queries.listProducts,
        sessionToken ? { sessionToken } : "skip",
        !!sessionToken
    );

    const orders = usePlatformQuery(
        api.modules.ecommerce.queries.listOrders,
        sessionToken ? { sessionToken } : "skip",
        !!sessionToken
    );

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const currentProducts = (products as Product[]) || [];
    const currentOrders = (orders as Order[]) || [];

    const stats = {
        totalProducts: currentProducts.length,
        activeProducts: currentProducts.filter(p => p.status === "active").length,
        lowStockProducts: currentProducts.filter(p => (p.stock <= 5) || (p.lowStock)).length,
        totalOrders: currentOrders.length,
        pendingOrders: currentOrders.filter(o => o.status === "pending").length,
        processingOrders: currentOrders.filter(o => o.status === "processing").length,
        totalRevenue: currentOrders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + o.totalCents, 0),
        todayOrders: currentOrders.filter(o => 
            new Date(o.createdAt).toDateString() === new Date().toDateString()
        ).length,
    };

    const productColumns: Column<Product>[] = [
        {
            key: "name",
            header: "Product",
            sortable: true,
            cell: (row: Product) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-sm text-muted-foreground">{row.sku}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "category",
            header: "Category",
            cell: (row: Product) => (
                <Badge variant="outline" className="text-xs">
                    {row.category || "—"}
                </Badge>
            ),
            sortable: true,
        },
        {
            key: "price",
            header: "Price",
            cell: (row: Product) => (
                <span className="font-medium">{formatCurrency(row.priceCents)}</span>
            ),
            sortable: true,
        },
        {
            key: "stock",
            header: "Stock",
            cell: (row: Product) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{row.stock}</span>
                    {row.lowStock && (
                        <Badge variant="destructive" className="text-xs">Low</Badge>
                    )}
                    {row.stock === 0 && (
                        <Badge variant="secondary" className="text-xs">Out</Badge>
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
        {
            key: "actions",
            header: "Actions",
            cell: (row: Product) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">View</Button>
                </div>
            ),
        },
    ];

    const orderColumns: Column<Order>[] = [
        {
            key: "orderNumber",
            header: "Order #",
            sortable: true,
            cell: (row: Order) => (
                <div>
                    <p className="font-medium">{row.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{row.customer || "—"}</p>
                </div>
            ),
        },
        {
            key: "total",
            header: "Total",
            cell: (row: Order) => (
                <div>
                    <p className="font-medium">{formatCurrency(row.totalCents)}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.paymentStatus || "—"}
                    </p>
                </div>
            ),
            sortable: true,
        },
        {
            key: "status",
            header: "Status",
            cell: (row: Order) => {
                const statusConfig = {
                    pending: { color: "secondary", label: "Pending" },
                    processing: { color: "default", label: "Processing" },
                    shipped: { color: "default", label: "Shipped" },
                    delivered: { color: "default", label: "Delivered" },
                    cancelled: { color: "destructive", label: "Cancelled" },
                    refunded: { color: "outline", label: "Refunded" },
                };
                const config = statusConfig[row.status as keyof typeof statusConfig];
                return (
                    <Badge variant={config?.color as any}>
                        {config?.label || row.status}
                    </Badge>
                );
            },
        },
        {
            key: "createdAt",
            header: "Date",
            cell: (row: Order) => formatDate(row.createdAt),
            sortable: true,
        },
        {
            key: "actions",
            header: "Actions",
            cell: (row: Order) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">View</Button>
                    {row.status === "pending" && (
                        <Button size="sm" variant="outline">Process</Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="eCommerce Management"
                description="Complete school store management with products, orders, and payments"
                actions={
                    <div className="flex gap-2">
                        <Link href="/admin/ecommerce/products/create">
                            <Button variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Product
                            </Button>
                        </Link>
                        <Link href="/admin/ecommerce/orders">
                            <Button className="gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                View Orders
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="Total Products"
                    value={stats.totalProducts}
                    description="In catalog"
                    icon={Package}
                    trend={{ value: 5, isPositive: true }}
                />
                <AdminStatsCard
                    title="Active Products"
                    value={stats.activeProducts}
                    description="Available for sale"
                    icon={CheckCircle}
                    variant="success"
                />
                <AdminStatsCard
                    title="Low Stock Alert"
                    value={stats.lowStockProducts}
                    description="Require restocking"
                    icon={AlertTriangle}
                    variant={stats.lowStockProducts > 0 ? "warning" : "default"}
                />
                <AdminStatsCard
                    title="Total Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    description="From paid orders"
                    icon={TrendingUp}
                    trend={{ value: 12, isPositive: true }}
                />
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Link href="/admin/ecommerce/products">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                                    <Package className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Manage Products</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Product catalog
                                </p>
                            </div>
                        </Link>
                        <Link href="/admin/ecommerce/orders">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                                    <ShoppingCart className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Process Orders</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Order management
                                </p>
                            </div>
                        </Link>
                        <Link href="/admin/ecommerce/analytics">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                                    <BarChart3 className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Analytics</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Sales insights
                                </p>
                            </div>
                        </Link>
                        <Link href="/admin/ecommerce/settings">
                            <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                                    <Settings className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-medium text-center">Settings</h3>
                                <p className="text-sm text-muted-foreground text-center mt-1">
                                    Store configuration
                                </p>
                            </div>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="products">
                <TabsList className="mb-4">
                    <TabsTrigger value="products" className="gap-2">
                        <Package className="h-4 w-4" />
                        Products ({mockProducts.length})
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Orders ({mockOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="products">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Product Catalog</CardTitle>
                            <Link href="/admin/ecommerce/products/create">
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Product
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={mockProducts}
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Orders</CardTitle>
                            <Link href="/admin/ecommerce/orders">
                                <Button size="sm" variant="outline">
                                    View All Orders
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={mockOrders}
                                columns={orderColumns}
                                searchable
                                searchPlaceholder="Search by order number..."
                                emptyTitle="No orders found"
                                emptyDescription="Customer orders will appear here."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="overview">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Store Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
                                        <p className="text-sm text-muted-foreground">Total Products</p>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">{stats.activeProducts}</p>
                                        <p className="text-sm text-muted-foreground">Active Products</p>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-2xl font-bold text-purple-600">{stats.totalOrders}</p>
                                        <p className="text-sm text-muted-foreground">Total Orders</p>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalRevenue)}</p>
                                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Store Alerts</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {stats.lowStockProducts > 0 && (
                                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-amber-800">
                                                {stats.lowStockProducts} products low in stock
                                            </p>
                                            <p className="text-xs text-amber-600">
                                                Restocking recommended
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {stats.pendingOrders > 0 && (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-blue-800">
                                                {stats.pendingOrders} orders pending
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                Require processing
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {stats.lowStockProducts === 0 && stats.pendingOrders === 0 && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-green-800">
                                                Store operating normally
                                            </p>
                                            <p className="text-xs text-green-600">
                                                No immediate issues
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
