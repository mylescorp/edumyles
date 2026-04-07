"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Download,
  Calendar,
  Filter,
  ArrowUp,
  ArrowDown,
  Globe,
  Target,
  Eye,
  Package,
  ShoppingCart,
  Store,
} from "lucide-react";

export default function ResellerAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Mock data - in real app this would come from Convex
  const revenueData = [
    { date: "2024-01-01", revenue: 12000, orders: 15, customers: 8 },
    { date: "2024-01-02", revenue: 15000, orders: 18, customers: 10 },
    { date: "2024-01-03", revenue: 18000, orders: 22, customers: 12 },
    { date: "2024-01-04", revenue: 14000, orders: 17, customers: 9 },
    { date: "2024-01-05", revenue: 21000, orders: 25, customers: 14 },
    { date: "2024-01-06", revenue: 19000, orders: 23, customers: 13 },
    { date: "2024-01-07", revenue: 23000, orders: 28, customers: 16 },
  ];

  const productData = [
    { name: "EduMyles Premium Package", sales: 89, revenue: 1335000, orders: 89, growth: 12 },
    { name: "EduMyles Standard Package", sales: 156, revenue: 1248000, orders: 156, growth: 8 },
    { name: "EduMyles Basic Package", sales: 234, revenue: 1170000, orders: 234, growth: -3 },
    { name: "Teacher Training Package", sales: 45, revenue: 135000, orders: 45, growth: 15 },
    { name: "Hardware Bundle", sales: 23, revenue: 575000, orders: 23, growth: 5 },
  ];

  const customerData = [
    { type: "School", count: 156, revenue: 2890000, growth: 18 },
    { type: "Business", count: 45, revenue: 1230000, growth: 22 },
    { type: "Individual", count: 89, revenue: 445000, growth: 5 },
  ];

  const geographicData = [
    { region: "Nairobi", customers: 89, revenue: 1560000, orders: 167, growth: 15 },
    { region: "Mombasa", customers: 34, revenue: 680000, orders: 78, growth: 12 },
    { region: "Kisumu", customers: 23, revenue: 460000, orders: 45, growth: 8 },
    { region: "Nakuru", customers: 18, revenue: 360000, orders: 34, growth: 10 },
    { region: "Others", customers: 26, revenue: 520000, orders: 67, growth: 6 },
  ];

  const keyMetrics = {
    totalRevenue: 456000,
    monthlyGrowth: 22.5,
    totalOrders: 567,
    averageOrderValue: 800,
    totalCustomers: 234,
    customerGrowth: 18.2,
    conversionRate: 12.5,
    customerRetention: 85.3,
  };

  const MetricCard = ({ title, value, change, icon: Icon, color = "blue", prefix = "" }: any) => (
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
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your reseller performance and sales metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={keyMetrics.totalRevenue}
          change={22.5}
          icon={DollarSign}
          color="green"
          prefix="KES "
        />
        <MetricCard
          title="Total Orders"
          value={keyMetrics.totalOrders}
          change={15.2}
          icon={ShoppingCart}
          color="blue"
        />
        <MetricCard
          title="Total Customers"
          value={keyMetrics.totalCustomers}
          change={18.2}
          icon={Users}
          color="purple"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${keyMetrics.conversionRate}%`}
          change={3.1}
          icon={Target}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="revenue">Revenue</option>
              <option value="orders">Orders</option>
              <option value="customers">Customers</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Revenue chart</p>
              <p className="text-sm">KES {keyMetrics.totalRevenue.toLocaleString()} total</p>
            </div>
          </div>
        </div>

        {/* Customer Growth */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Growth</h2>
          <div className="space-y-3">
            {[
              { metric: "New Customers", value: 45, change: 22 },
              { metric: "Returning Customers", value: 189, change: 15 },
              { metric: "Customer Retention", value: "85.3%", change: 3.2 },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.metric}</p>
                  <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                </div>
                <div className={`flex items-center text-sm ${
                  item.change >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {item.change >= 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(item.change)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Performance</h2>
          <div className="space-y-3">
            {productData.map((product) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.orders} orders</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{product.sales} sold</span>
                  <span className="text-sm font-medium text-gray-900">KES {product.revenue.toLocaleString()}</span>
                  <span className={`text-sm ${
                    product.growth >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {product.growth >= 0 ? "+" : ""}{product.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Types */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h2>
          <div className="space-y-3">
            {customerData.map((segment) => (
              <div key={segment.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Store className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{segment.type}s</p>
                    <p className="text-sm text-gray-500">{segment.count} customers</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-900">KES {segment.revenue.toLocaleString()}</span>
                  <span className={`text-sm ${
                    segment.growth >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {segment.growth >= 0 ? "+" : ""}{segment.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h2>
          <div className="space-y-3">
            {geographicData.map((region) => (
              <div key={region.region} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{region.region}</p>
                    <p className="text-sm text-gray-500">{region.customers} customers</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{region.orders} orders</span>
                  <span className="text-sm font-medium text-gray-900">KES {region.revenue.toLocaleString()}</span>
                  <span className={`text-sm ${
                    region.growth >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {region.growth >= 0 ? "+" : ""}{region.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Best Sales Day</p>
                  <p className="text-sm text-green-700">Saturday - 28 orders, KES 23,000</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Peak Activity Time</p>
                  <p className="text-sm text-blue-700">2:00 PM - 4:00 PM EAT</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Top Product</p>
                  <p className="text-sm text-purple-700">EduMyles Premium Package</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">Best Customer Type</p>
                  <p className="text-sm text-yellow-700">Schools - 156 customers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Funnel Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Conversion Funnel</h3>
            <div className="space-y-3">
              {[
                { stage: "Website Visitors", count: 12450, rate: 100 },
                { stage: "Product Views", count: 5672, rate: 45.6 },
                { stage: "Add to Cart", count: 1234, rate: 21.8 },
                { stage: "Checkout Started", count: 789, rate: 63.9 },
                { stage: "Orders Completed", count: 567, rate: 71.9 },
              ].map((stage, index) => (
                <div key={stage.stage} className="flex items-center">
                  <div className="w-40 text-sm font-medium text-gray-900">{stage.stage}</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-[#0F4C2A] h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${stage.rate}%` }}
                      >
                        {stage.count.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-gray-600">{stage.rate}%</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Key Insights</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">View-to-Cart Rate</p>
                <p className="text-sm text-blue-700">21.8% of product views add to cart</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">Cart Completion Rate</p>
                <p className="text-sm text-green-700">71.9% of carts result in completed orders</p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm font-medium text-purple-900">Overall Conversion</p>
                <p className="text-sm text-purple-700">4.6% of visitors complete a purchase</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
