"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Search,
  Filter
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
};

type Order = {
  _id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: "student" | "staff" | "parent" | "guest";
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "wallet" | "card" | "cash" | "mobile";
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export default function OrdersPage() {
  const { isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // Mock data for demonstration
  const orders: Order[] = [
    {
      _id: "order1",
      orderNumber: "ORD-2024-001",
      customer: {
        id: "customer1",
        name: "Alice Johnson",
        email: "alice.j@school.com",
        phone: "+254 712 345 678",
        type: "student",
      },
      items: [
        {
          id: "item1",
          productId: "prod1",
          productName: "School Uniform - Size M",
          quantity: 2,
          price: 2500.00,
          total: 5000.00,
        },
        {
          id: "item2",
          productId: "prod2",
          productName: "Mathematics Textbook",
          quantity: 1,
          price: 1200.00,
          total: 1200.00,
        },
      ],
      subtotal: 6200.00,
      tax: 620.00,
      shipping: 150.00,
      total: 6970.00,
      status: "delivered",
      paymentStatus: "paid",
      paymentMethod: "wallet",
      shippingAddress: {
        street: "123 School Road",
        city: "Nairobi",
        postalCode: "00100",
        country: "Kenya",
      },
      createdAt: "2024-03-08T10:30:00Z",
      updatedAt: "2024-03-08T15:45:00Z",
    },
    {
      _id: "order2",
      orderNumber: "ORD-2024-002",
      customer: {
        id: "customer2",
        name: "Bob Wilson",
        email: "bob.w@school.com",
        phone: "+254 723 456 789",
        type: "student",
      },
      items: [
        {
          id: "item3",
          productId: "prod3",
          productName: "Sports Kit - Football",
          quantity: 1,
          price: 3500.00,
          total: 3500.00,
        },
      ],
      subtotal: 3500.00,
      tax: 350.00,
      shipping: 100.00,
      total: 3950.00,
      status: "processing",
      paymentStatus: "paid",
      paymentMethod: "card",
      shippingAddress: {
        street: "456 Education Ave",
        city: "Nairobi",
        postalCode: "00200",
        country: "Kenya",
      },
      createdAt: "2024-03-08T09:15:00Z",
      updatedAt: "2024-03-08T14:20:00Z",
    },
    {
      _id: "order3",
      orderNumber: "ORD-2024-003",
      customer: {
        id: "customer3",
        name: "Mary Wanjiku",
        email: "mary.w@school.com",
        phone: "+254 734 567 890",
        type: "staff",
      },
      items: [
        {
          id: "item4",
          productId: "prod4",
          productName: "Stationery Set",
          quantity: 3,
          price: 800.00,
          total: 2400.00,
        },
      ],
      subtotal: 2400.00,
      tax: 240.00,
      shipping: 0.00,
      total: 2640.00,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "cash",
      shippingAddress: {
        street: "789 Teacher Lane",
        city: "Nairobi",
        postalCode: "00300",
        country: "Kenya",
      },
      createdAt: "2024-03-08T08:45:00Z",
      updatedAt: "2024-03-08T08:45:00Z",
    },
    {
      _id: "order4",
      orderNumber: "ORD-2024-004",
      customer: {
        id: "customer4",
        name: "James Otieno",
        email: "james.o@school.com",
        phone: "+254 745 678 901",
        type: "parent",
      },
      items: [
        {
          id: "item5",
          productId: "prod5",
          productName: "Lab Equipment Set",
          quantity: 1,
          price: 5000.00,
          total: 5000.00,
        },
      ],
      subtotal: 5000.00,
      tax: 500.00,
      shipping: 200.00,
      total: 5700.00,
      status: "cancelled",
      paymentStatus: "refunded",
      paymentMethod: "mobile",
      shippingAddress: {
        street: "321 Parent Street",
        city: "Nairobi",
        postalCode: "00400",
        country: "Kenya",
      },
      createdAt: "2024-03-07T16:20:00Z",
      updatedAt: "2024-03-07T18:30:00Z",
      notes: "Customer requested cancellation due to wrong size",
    },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    processingOrders: orders.filter(o => o.status === "processing").length,
    deliveredOrders: orders.filter(o => o.status === "delivered").length,
    totalRevenue: orders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
  };

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      header: "Order",
      sortable: true,
      cell: (row: Order) => (
        <div>
          <p className="font-medium">{row.orderNumber}</p>
          <p className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (row: Order) => (
        <div>
          <p className="font-medium">{row.customer.name}</p>
          <p className="text-sm text-muted-foreground">{row.customer.email}</p>
          <Badge variant="outline" className="text-xs mt-1">
            {row.customer.type}
          </Badge>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (row: Order) => (
        <div>
          <p className="font-medium">{row.items.length} items</p>
          <p className="text-sm text-muted-foreground">
            {row.items.slice(0, 2).map(item => item.productName).join(", ")}
            {row.items.length > 2 && "..."}
          </p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      cell: (row: Order) => (
        <div>
          <p className="font-medium">{formatCurrency(row.total)}</p>
          <p className="text-xs text-muted-foreground">
            {row.paymentMethod} • {row.paymentStatus}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Order) => {
        const statusConfig = {
          pending: { color: "secondary", icon: Clock, label: "Pending" },
          confirmed: { color: "default", icon: CheckCircle, label: "Confirmed" },
          processing: { color: "default", icon: Package, label: "Processing" },
          shipped: { color: "default", icon: Truck, label: "Shipped" },
          delivered: { color: "default", icon: CheckCircle, label: "Delivered" },
          cancelled: { color: "destructive", icon: XCircle, label: "Cancelled" },
          refunded: { color: "outline", icon: XCircle, label: "Refunded" },
        };
        const config = statusConfig[row.status];
        const Icon = config.icon;
        return (
          <Badge variant={config.color as any} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Order) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          {row.status === "pending" && (
            <Button size="sm" variant="outline">Confirm</Button>
          )}
          {row.status === "confirmed" && (
            <Button size="sm" variant="outline">Process</Button>
          )}
          {row.status === "processing" && (
            <Button size="sm" variant="outline">Ship</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Management"
        description="Process and track customer orders from placement to delivery"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Package className="h-4 w-4" />
              Export Orders
            </Button>
            <Button className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              New Order
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total Orders"
          value={stats.totalOrders}
          description="All time orders"
          icon={ShoppingCart}
          trend={{ value: 12, isPositive: true }}
        />
        <AdminStatsCard
          title="Pending Orders"
          value={stats.pendingOrders}
          description="Awaiting processing"
          icon={Clock}
          variant="warning"
        />
        <AdminStatsCard
          title="Processing"
          value={stats.processingOrders}
          description="Currently being processed"
          icon={Package}
          variant="default"
        />
        <AdminStatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          description="From paid orders"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Order Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Payment Status</label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order History</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredOrders}
            columns={columns}
            searchable={false} // We have custom search
            emptyTitle="No orders found"
            emptyDescription="No orders match your current filters."
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/ecommerce/orders/create">
              <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-medium text-center">Create Order</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Manual order entry
                </p>
              </div>
            </Link>
            <Link href="/admin/ecommerce/reports">
              <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-medium text-center">Sales Reports</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  View analytics
                </p>
              </div>
            </Link>
            <Link href="/admin/ecommerce/inventory">
              <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-medium text-center">Inventory</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Stock management
                </p>
              </div>
            </Link>
            <Link href="/admin/ecommerce/settings">
              <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-white" />
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
    </div>
  );
}
