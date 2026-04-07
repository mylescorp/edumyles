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
  Package,
  Star,
  Eye,
} from "lucide-react";

export default function DeveloperAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedModule, setSelectedModule] = useState("all");

  // Mock data - in real app this would come from Convex
  const revenueData = [
    { date: "2024-01-01", revenue: 1200 },
    { date: "2024-01-02", revenue: 1500 },
    { date: "2024-01-03", revenue: 1800 },
    { date: "2024-01-04", revenue: 1400 },
    { date: "2024-01-05", revenue: 2100 },
    { date: "2024-01-06", revenue: 1900 },
    { date: "2024-01-07", revenue: 2300 },
  ];

  const geographicData = [
    { country: "Kenya", installs: 567, revenue: 28400 },
    { country: "Uganda", installs: 234, revenue: 11200 },
    { country: "Tanzania", installs: 189, revenue: 9800 },
    { country: "Rwanda", installs: 98, revenue: 5600 },
    { country: "Others", installs: 45, revenue: 2200 },
  ];

  const modulePerformance = [
    {
      name: "Attendance Management",
      installs: 342,
      revenue: 18400,
      rating: 4.8,
      views: 1250,
      conversion: 27.4,
      growth: 12,
    },
    {
      name: "Fee Collection",
      installs: 289,
      revenue: 15600,
      rating: 4.6,
      views: 980,
      conversion: 29.5,
      growth: 8,
    },
    {
      name: "Exam Management",
      installs: 198,
      revenue: 11200,
      rating: 4.5,
      views: 756,
      conversion: 26.2,
      growth: -3,
    },
    {
      name: "Library Management",
      installs: 156,
      revenue: 8900,
      rating: 4.7,
      views: 623,
      conversion: 25.0,
      growth: 15,
    },
  ];

  const keyMetrics = {
    totalRevenue: 45200,
    monthlyGrowth: 12.5,
    totalInstalls: 1247,
    conversionRate: 27.1,
    averageRating: 4.65,
    activeModules: 6,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your module performance and revenue</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-900">KES {keyMetrics.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                {keyMetrics.monthlyGrowth}%
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Installs</p>
              <p className="text-lg font-semibold text-gray-900">{keyMetrics.totalInstalls.toLocaleString()}</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                8.2%
              </div>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Conversion Rate</p>
              <p className="text-lg font-semibold text-gray-900">{keyMetrics.conversionRate}%</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                2.1%
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Avg Rating</p>
              <p className="text-lg font-semibold text-gray-900">{keyMetrics.averageRating}</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                0.3
              </div>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Active Modules</p>
              <p className="text-lg font-semibold text-gray-900">{keyMetrics.activeModules}</p>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                No change
              </div>
            </div>
            <Package className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Page Views</p>
              <p className="text-lg font-semibold text-gray-900">3.6k</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                18.5%
              </div>
            </div>
            <Eye className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="all">All Modules</option>
              <option value="attendance">Attendance Management</option>
              <option value="fees">Fee Collection</option>
              <option value="exams">Exam Management</option>
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

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h2>
          <div className="space-y-3">
            {geographicData.map((country) => (
              <div key={country.country} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{country.country}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{country.installs} installs</span>
                  <span className="text-sm font-medium text-gray-900">KES {country.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Total</span>
              <span className="text-sm font-bold text-gray-900">
                KES {geographicData.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Performance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Module</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Installs</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Conversion</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {modulePerformance.map((module) => (
                  <tr key={module.name} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">{module.name}</div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      {module.installs.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      KES {module.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-900">{module.rating}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      {module.views.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      {module.conversion}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className={`flex items-center justify-end text-sm ${
                        module.growth >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {module.growth >= 0 ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(module.growth)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
        <div className="space-y-4">
          {[
            { stage: "Page Views", count: 3612, conversion: 100 },
            { stage: "Module Details", count: 1890, conversion: 52.3 },
            { stage: "Add to Cart", count: 567, conversion: 30.0 },
            { stage: "Checkout", count: 342, conversion: 60.3 },
            { stage: "Completed", count: 289, conversion: 84.5 },
          ].map((stage, index) => (
            <div key={stage.stage} className="flex items-center">
              <div className="w-32 text-sm font-medium text-gray-900">{stage.stage}</div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-full h-8 relative">
                  <div
                    className="bg-[#0F4C2A] h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${stage.conversion}%` }}
                  >
                    {stage.count.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="w-16 text-right text-sm text-gray-600">{stage.conversion}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
