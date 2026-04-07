"use client";

import React from "react";
import {
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Store,
  ShoppingCart,
  Eye,
  Calendar,
  Copy,
  ExternalLink,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function ResellerDashboard() {
  // Mock data - in real app this would come from Convex
  const stats = {
    totalProducts: 45,
    activeCustomers: 234,
    totalRevenue: 456000,
    pendingOrders: 12,
    monthlyRevenue: 45000,
    totalOrders: 567,
    averageOrderValue: 800,
    customerGrowth: 18.5,
  };

  const recentOrders = [
    {
      id: 1,
      customer: "Green Valley Academy",
      product: "EduMyles Premium Package",
      amount: 15000,
      status: "completed",
      date: "2024-01-20",
      quantity: 50,
    },
    {
      id: 2,
      customer: "St. Mary's Primary School",
      product: "EduMyles Standard Package",
      amount: 8000,
      status: "processing",
      date: "2024-01-19",
      quantity: 20,
    },
    {
      id: 3,
      customer: "Nairobi High School",
      product: "EduMyles Premium Package",
      amount: 12000,
      status: "pending",
      date: "2024-01-18",
      quantity: 40,
    },
    {
      id: 4,
      customer: "Kisumu Girls Academy",
      product: "EduMyles Basic Package",
      amount: 5000,
      status: "completed",
      date: "2024-01-17",
      quantity: 10,
    },
  ];

  const topProducts = [
    {
      name: "EduMyles Premium Package",
      sales: 89,
      revenue: 1335000,
      growth: 12,
    },
    {
      name: "EduMyles Standard Package",
      sales: 156,
      revenue: 1248000,
      growth: 8,
    },
    {
      name: "EduMyles Basic Package",
      sales: 234,
      revenue: 1170000,
      growth: -3,
    },
  ];

  const StatCard = ({ title, value, change, icon: Icon, color = "blue", prefix = "" }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {prefix}{typeof value === "number" && value >= 1000 
              ? `${(value / 1000).toFixed(1)}k` 
              : value}
          </p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-1 rotate-180" />
              )}
              {Math.abs(change)}% from last month
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In real app, show toast notification
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reseller Dashboard</h1>
        <p className="text-gray-600">Manage your products, customers, and sales</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          change={5}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Active Customers"
          value={stats.activeCustomers}
          change={12}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          change={18}
          icon={DollarSign}
          color="green"
          prefix="KES "
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          change={-8}
          icon={ShoppingCart}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <button className="text-sm text-[#0F4C2A] hover:text-[#061A12]">View All</button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{order.customer}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>{order.product}</span>
                    <span>Qty: {order.quantity}</span>
                    <span>{new Date(order.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">KES {order.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            <button className="text-sm text-[#0F4C2A] hover:text-[#061A12]">View All</button>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#0F4C2A] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{product.sales} sales</span>
                      <span>KES {product.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center text-sm ${
                    product.growth >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {product.growth >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                    )}
                    {Math.abs(product.growth)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
            <Package className="h-6 w-6 text-[#0F4C2A] mr-2" />
            <span className="text-sm font-medium text-gray-700">Add New Product</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
            <Users className="h-6 w-6 text-[#0F4C2A] mr-2" />
            <span className="text-sm font-medium text-gray-700">Add Customer</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
            <BarChart3 className="h-6 w-6 text-[#0F4C2A] mr-2" />
            <span className="text-sm font-medium text-gray-700">View Analytics</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
            <FileText className="h-6 w-6 text-[#0F4C2A] mr-2" />
            <span className="text-sm font-medium text-gray-700">Generate Report</span>
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">KES {stats.averageOrderValue.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Average Order Value</p>
            <p className="text-xs text-gray-500 mt-1">Per order</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.customerGrowth}%</p>
            <p className="text-sm text-gray-600">Customer Growth</p>
            <p className="text-xs text-gray-500 mt-1">Monthly increase</p>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
          <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>Last 6 months</option>
            <option>Last year</option>
          </select>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p>Revenue chart will be displayed here</p>
            <p className="text-sm">KES {stats.totalRevenue.toLocaleString()} total revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
}
