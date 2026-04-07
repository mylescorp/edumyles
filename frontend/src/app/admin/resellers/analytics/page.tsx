"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  Calendar,
  Download,
  Filter,
  Globe,
  Award,
  Target,
  Eye,
  Store,
  ShoppingCart,
  Star,
  MapPin,
} from "lucide-react";

export default function PlatformResellerAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Mock data - in real app this would come from Convex
  const revenueData = [
    { date: "2024-01-01", revenue: 45000, orders: 89, resellers: 12 },
    { date: "2024-01-02", revenue: 52000, orders: 102, resellers: 14 },
    { date: "2024-01-03", revenue: 48000, orders: 95, resellers: 13 },
    { date: "2024-01-04", revenue: 61000, orders: 118, resellers: 15 },
    { date: "2024-01-05", revenue: 58000, orders: 112, resellers: 14 },
    { date: "2024-01-06", revenue: 67000, orders: 125, resellers: 16 },
    { date: "2024-01-07", revenue: 72000, orders: 134, resellers: 17 },
  ];

  const tierPerformance = [
    { tier: "Bronze", resellers: 45, revenue: 225000, orders: 890, avgRevenue: 5000, growth: 8.5 },
    { tier: "Silver", resellers: 32, revenue: 352000, orders: 1234, avgRevenue: 11000, growth: 12.3 },
    { tier: "Gold", resellers: 28, revenue: 532000, orders: 1567, avgRevenue: 19000, growth: 18.7 },
    { tier: "Platinum", resellers: 15, revenue: 435000, orders: 1089, avgRevenue: 29000, growth: 22.1 },
    { tier: "Premium", resellers: 8, revenue: 312000, orders: 678, avgRevenue: 39000, growth: 25.4 },
  ];

  const topResellers = [
    {
      rank: 1,
      name: "TechReseller Kenya",
      tier: "Premium",
      revenue: 156000,
      orders: 234,
      growth: 28.5,
      customers: 89,
      rating: 4.8,
      region: "Nairobi",
    },
    {
      rank: 2,
      name: "EduTech Solutions",
      tier: "Gold",
      revenue: 134000,
      orders: 198,
      growth: 22.3,
      customers: 76,
      rating: 4.7,
      region: "Mombasa",
    },
    {
      rank: 3,
      name: "Digital Learning Hub",
      tier: "Platinum",
      revenue: 118000,
      orders: 167,
      growth: 19.8,
      customers: 65,
      rating: 4.6,
      region: "Kisumu",
    },
    {
      rank: 4,
      name: "Smart Learning Africa",
      tier: "Gold",
      revenue: 98000,
      orders: 145,
      growth: 16.2,
      customers: 54,
      rating: 4.5,
      region: "Nairobi",
    },
    {
      rank: 5,
      name: "Kenya Learning Partners",
      tier: "Silver",
      revenue: 76000,
      orders: 123,
      growth: 13.7,
      customers: 43,
      rating: 4.4,
      region: "Nakuru",
    },
  ];

  const geographicData = [
    { region: "Nairobi", resellers: 45, revenue: 456000, orders: 1234, customers: 567, growth: 18.5 },
    { region: "Mombasa", resellers: 23, revenue: 234000, orders: 678, customers: 289, growth: 15.2 },
    { region: "Kisumu", resellers: 18, revenue: 178000, orders: 456, customers: 198, growth: 12.8 },
    { region: "Nakuru", resellers: 15, revenue: 145000, orders: 389, customers: 167, growth: 11.3 },
    { region: "Eldoret", resellers: 12, revenue: 123000, orders: 345, customers: 145, growth: 9.7 },
    { region: "Others", resellers: 25, revenue: 189000, orders: 567, customers: 234, growth: 8.4 },
  ];

  const productPerformance = [
    { name: "EduMyles Premium Package", sales: 567, revenue: 8505000, resellers: 89, growth: 22.5 },
    { name: "EduMyles Standard Package", sales: 1234, revenue: 9872000, resellers: 156, growth: 18.3 },
    { name: "EduMyles Basic Package", sales: 2345, revenue: 11725000, resellers: 234, growth: 15.7 },
    { name: "Teacher Training Package", sales: 345, revenue: 1035000, resellers: 45, growth: 28.9 },
    { name: "Hardware Bundle", sales: 189, revenue: 4725000, resellers: 28, growth: 12.4 },
  ];

  const keyMetrics = {
    totalRevenue: 1425000,
    monthlyGrowth: 18.7,
    totalOrders: 4567,
    totalResellers: 128,
    totalCustomers: 1234,
    averageOrderValue: 312,
    resellerSatisfaction: 4.6,
    marketPenetration: 23.5,
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
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
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
          <h1 className="text-2xl font-bold text-gray-900">Reseller Analytics</h1>
          <p className="text-gray-600">Monitor reseller performance and platform growth metrics</p>
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
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={keyMetrics.totalRevenue}
          change={18.7}
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
          title="Active Resellers"
          value={keyMetrics.totalResellers}
          change={12.5}
          icon={Users}
          color="purple"
        />
        <MetricCard
          title="Total Customers"
          value={keyMetrics.totalCustomers}
          change={22.3}
          icon={Target}
          color="orange"
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
              <option value="resellers">Resellers</option>
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

        {/* Tier Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tier Performance</h2>
          <div className="space-y-3">
            {tierPerformance.map((tier) => (
              <div key={tier.tier} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Award className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tier.tier}</p>
                    <p className="text-sm text-gray-500">{tier.resellers} resellers</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">KES {tier.revenue.toLocaleString()}</span>
                  <span className={`text-sm ${
                    tier.growth >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {tier.growth >= 0 ? "+" : ""}{tier.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Resellers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Resellers</h2>
          <div className="space-y-3">
            {topResellers.map((reseller) => (
              <div key={reseller.rank} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#0F4C2A] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {reseller.rank}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reseller.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                        {reseller.tier}
                      </span>
                      <span>{reseller.region}</span>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="ml-1">{reseller.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">KES {reseller.revenue.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    {reseller.growth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span>{reseller.growth}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
                    <p className="text-sm text-gray-500">{region.resellers} resellers</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">KES {region.revenue.toLocaleString()}</span>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Performance</h2>
          <div className="space-y-3">
            {productPerformance.map((product) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} sold</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{product.resellers} resellers</span>
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

        {/* Performance Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Highest Growth Region</p>
                  <p className="text-sm text-green-700">Nairobi - 18.5% growth</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Best Performing Tier</p>
                  <p className="text-sm text-blue-700">Premium - 25.4% growth</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Top Product</p>
                  <p className="text-sm text-purple-700">Teacher Training Package - 28.9% growth</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">Customer Satisfaction</p>
                  <p className="text-sm text-yellow-700">4.6/5.0 average rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Market Penetration</h3>
            <p className="text-3xl font-bold text-blue-900">{keyMetrics.marketPenetration}%</p>
            <p className="text-sm text-blue-700">Of target market reached</p>
          </div>
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Average Order Value</h3>
            <p className="text-3xl font-bold text-green-900">KES {keyMetrics.averageOrderValue}</p>
            <p className="text-sm text-green-700">Per transaction</p>
          </div>
          <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">Reseller Satisfaction</h3>
            <p className="text-3xl font-bold text-purple-900">{keyMetrics.resellerSatisfaction}/5.0</p>
            <p className="text-sm text-purple-700">Average rating</p>
          </div>
        </div>
      </div>

      {/* Growth Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Monthly Revenue Trend</h3>
            <div className="space-y-2">
              {revenueData.slice(-6).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-sm font-medium text-gray-900">KES {data.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Key Performance Indicators</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue per Reseller</span>
                <span className="text-sm font-medium text-gray-900">KES {Math.round(keyMetrics.totalRevenue / keyMetrics.totalResellers).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Orders per Reseller</span>
                <span className="text-sm font-medium text-gray-900">{Math.round(keyMetrics.totalOrders / keyMetrics.totalResellers)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Customers per Reseller</span>
                <span className="text-sm font-medium text-gray-900">{Math.round(keyMetrics.totalCustomers / keyMetrics.totalResellers)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue per Customer</span>
                <span className="text-sm font-medium text-gray-900">KES {Math.round(keyMetrics.totalRevenue / keyMetrics.totalCustomers)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
