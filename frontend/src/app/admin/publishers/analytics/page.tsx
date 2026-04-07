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
  Code,
  Star,
  MapPin,
  Activity,
} from "lucide-react";

export default function PlatformPublisherAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Mock data - in real app this would come from Convex
  const revenueData = [
    { date: "2024-01-01", revenue: 125000, modules: 234, publishers: 12 },
    { date: "2024-01-02", revenue: 142000, modules: 267, publishers: 14 },
    { date: "2024-01-03", revenue: 138000, modules: 245, publishers: 13 },
    { date: "2024-01-04", revenue: 156000, modules: 289, publishers: 15 },
    { date: "2024-01-05", revenue: 167000, modules: 298, publishers: 16 },
    { date: "2024-01-06", revenue: 189000, modules: 345, publishers: 18 },
    { date: "2024-01-07", revenue: 198000, modules: 367, publishers: 19 },
  ];

  const tierPerformance = [
    { tier: "Bronze", publishers: 15, revenue: 345000, modules: 567, avgRevenue: 23000, growth: 12.5 },
    { tier: "Silver", publishers: 12, revenue: 567000, modules: 890, avgRevenue: 47250, growth: 18.3 },
    { tier: "Gold", publishers: 8, revenue: 789000, modules: 1234, avgRevenue: 98625, growth: 24.7 },
    { tier: "Platinum", publishers: 5, revenue: 678000, modules: 987, avgRevenue: 135600, growth: 28.9 },
    { tier: "Premium", publishers: 3, revenue: 567000, modules: 678, avgRevenue: 189000, growth: 32.1 },
  ];

  const topPublishers = [
    {
      rank: 1,
      name: "EduTech Solutions Kenya",
      tier: "Premium",
      revenue: 289000,
      modules: 12,
      installs: 3456,
      growth: 35.2,
      rating: 4.8,
      region: "Nairobi",
      activeUsers: 1234,
    },
    {
      rank: 2,
      name: "Digital Learning Innovations",
      tier: "Gold",
      revenue: 234000,
      modules: 8,
      installs: 2345,
      growth: 28.7,
      rating: 4.7,
      region: "Mombasa",
      activeUsers: 987,
    },
    {
      rank: 3,
      name: "CodeCraft Education",
      tier: "Platinum",
      revenue: 198000,
      modules: 6,
      installs: 1876,
      growth: 22.4,
      rating: 4.6,
      region: "Kisumu",
      activeUsers: 765,
    },
    {
      rank: 4,
      name: "Smart Classroom Systems",
      tier: "Gold",
      revenue: 167000,
      modules: 7,
      installs: 1543,
      growth: 19.8,
      rating: 4.5,
      region: "Nairobi",
      activeUsers: 543,
    },
    {
      rank: 5,
      name: "Kenya Learning Partners",
      tier: "Silver",
      revenue: 134000,
      modules: 5,
      installs: 1234,
      growth: 16.3,
      rating: 4.4,
      region: "Nakuru",
      activeUsers: 432,
    },
  ];

  const geographicData = [
    { region: "Nairobi", publishers: 18, revenue: 1234000, modules: 2345, installs: 8765, activeUsers: 4567, growth: 25.8 },
    { region: "Mombasa", publishers: 8, revenue: 567000, modules: 987, installs: 3456, activeUsers: 2345, growth: 18.4 },
    { region: "Kisumu", publishers: 6, revenue: 345000, modules: 567, installs: 2345, activeUsers: 1234, growth: 15.2 },
    { region: "Nakuru", publishers: 5, revenue: 289000, modules: 456, installs: 1876, activeUsers: 987, growth: 12.7 },
    { region: "Eldoret", publishers: 4, revenue: 234000, modules: 345, installs: 1543, activeUsers: 765, growth: 10.3 },
    { region: "Others", publishers: 12, revenue: 456000, modules: 789, installs: 3456, activeUsers: 2345, growth: 8.9 },
  ];

  const modulePerformance = [
    { name: "MathMaster Pro", sales: 2345, revenue: 12345000, publishers: 12, rating: 4.8, category: "Mathematics", growth: 32.5 },
    { name: "ScienceLab VR", sales: 1876, revenue: 9876000, publishers: 8, rating: 4.7, category: "Science", growth: 28.3 },
    { name: "LanguageLearn AI", sales: 3456, revenue: 12345000, publishers: 15, rating: 4.6, category: "Languages", growth: 24.7 },
    { name: "HistoryExplorer", sales: 1234, revenue: 3456000, publishers: 6, rating: 4.5, category: "History", growth: 18.9 },
    { name: "Programming Basics", sales: 987, revenue: 2345000, publishers: 4, rating: 4.4, category: "Computer Science", growth: 15.4 },
  ];

  const categoryPerformance = [
    { category: "Mathematics", modules: 45, revenue: 23450000, publishers: 18, growth: 28.5 },
    { category: "Science", modules: 34, revenue: 18760000, publishers: 12, growth: 24.3 },
    { category: "Languages", modules: 56, revenue: 23450000, publishers: 20, growth: 22.7 },
    { category: "Computer Science", modules: 23, revenue: 12345000, publishers: 8, growth: 19.8 },
    { category: "History", modules: 18, revenue: 6789000, publishers: 6, growth: 16.4 },
    { category: "Geography", modules: 12, revenue: 4567000, publishers: 4, growth: 12.3 },
  ];

  const keyMetrics = {
    totalRevenue: 2945000,
    monthlyGrowth: 24.8,
    totalModules: 156,
    totalPublishers: 43,
    totalInstalls: 12345,
    activeUsers: 8765,
    averageRating: 4.6,
    marketPenetration: 34.2,
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
          <h1 className="text-2xl font-bold text-gray-900">Publisher Analytics</h1>
          <p className="text-gray-600">Monitor publisher performance and platform growth metrics</p>
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
          change={24.8}
          icon={DollarSign}
          color="green"
          prefix="KES "
        />
        <MetricCard
          title="Total Modules"
          value={keyMetrics.totalModules}
          change={18.5}
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Active Publishers"
          value={keyMetrics.totalPublishers}
          change={15.2}
          icon={Users}
          color="purple"
        />
        <MetricCard
          title="Active Users"
          value={keyMetrics.activeUsers}
          change={32.7}
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
              <option value="modules">Modules</option>
              <option value="publishers">Publishers</option>
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
                    <p className="text-sm text-gray-500">{tier.publishers} publishers</p>
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
        {/* Top Publishers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Publishers</h2>
          <div className="space-y-3">
            {topPublishers.map((publisher) => (
              <div key={publisher.rank} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#0F4C2A] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {publisher.rank}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{publisher.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                        {publisher.tier}
                      </span>
                      <span>{publisher.region}</span>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="ml-1">{publisher.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">KES {publisher.revenue.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    {publisher.growth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span>{publisher.growth}%</span>
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
                    <p className="text-sm text-gray-500">{region.publishers} publishers</p>
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
        {/* Module Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Modules</h2>
          <div className="space-y-3">
            {modulePerformance.map((module) => (
              <div key={module.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{module.name}</p>
                    <p className="text-sm text-gray-500">{module.sales} sold</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{module.publishers} publishers</span>
                  <span className="text-sm font-medium text-gray-900">KES {module.revenue.toLocaleString()}</span>
                  <span className={`text-sm ${
                    module.growth >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {module.growth >= 0 ? "+" : ""}{module.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h2>
          <div className="space-y-3">
            {categoryPerformance.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Code className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{category.category}</p>
                    <p className="text-sm text-gray-500">{category.modules} modules</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{category.publishers} publishers</span>
                  <span className="text-sm font-medium text-gray-900">KES {category.revenue.toLocaleString()}</span>
                  <span className={`text-sm ${
                    category.growth >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {category.growth >= 0 ? "+" : ""}{category.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Highest Growth Region</p>
                <p className="text-sm text-green-700">Nairobi - 25.8% growth</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Award className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Best Performing Tier</p>
                <p className="text-sm text-blue-700">Premium - 32.1% growth</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Top Category</p>
                <p className="text-sm text-purple-700">Mathematics - 28.5% growth</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">User Satisfaction</p>
                <p className="text-sm text-yellow-700">4.6/5.0 average rating</p>
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
            <h3 className="font-medium text-green-900 mb-2">Average Revenue per Publisher</h3>
            <p className="text-3xl font-bold text-green-900">KES {Math.round(keyMetrics.totalRevenue / keyMetrics.totalPublishers).toLocaleString()}</p>
            <p className="text-sm text-green-700">Monthly average</p>
          </div>
          <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">Module Success Rate</h3>
            <p className="text-3xl font-bold text-purple-900">87.3%</p>
            <p className="text-sm text-purple-700">Active modules</p>
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
                <span className="text-sm text-gray-600">Revenue per Publisher</span>
                <span className="text-sm font-medium text-gray-900">KES {Math.round(keyMetrics.totalRevenue / keyMetrics.totalPublishers).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Modules per Publisher</span>
                <span className="text-sm font-medium text-gray-900">{Math.round(keyMetrics.totalModules / keyMetrics.totalPublishers)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Users per Module</span>
                <span className="text-sm font-medium text-gray-900">{Math.round(keyMetrics.activeUsers / keyMetrics.totalModules)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue per Module</span>
                <span className="text-sm font-medium text-gray-900">KES {Math.round(keyMetrics.totalRevenue / keyMetrics.totalModules).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Daily Active Users</h3>
            <p className="text-2xl font-bold text-gray-900">{Math.round(keyMetrics.activeUsers * 0.7).toLocaleString()}</p>
            <p className="text-sm text-gray-500">Average per day</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Module Downloads</h3>
            <p className="text-2xl font-bold text-gray-900">{keyMetrics.totalInstalls.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total downloads</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Code className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Code Quality Score</h3>
            <p className="text-2xl font-bold text-gray-900">92.5%</p>
            <p className="text-sm text-gray-500">Average across modules</p>
          </div>
        </div>
      </div>
    </div>
  );
}
