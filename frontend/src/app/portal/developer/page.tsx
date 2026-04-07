"use client";

import React from "react";
import {
  Package,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Download,
  Eye,
  Star,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function DeveloperDashboard() {
  // Mock data - in real app this would come from Convex
  const stats = {
    totalModules: 8,
    activeModules: 6,
    totalInstalls: 1247,
    activeInstalls: 892,
    monthlyRevenue: 45200,
    totalRevenue: 284500,
    conversionRate: 3.2,
    averageRating: 4.6,
  };

  const recentActivity = [
    {
      id: 1,
      type: "install",
      module: "Attendance Management",
      school: "Green Valley Academy",
      time: "2 hours ago",
      status: "success",
    },
    {
      id: 2,
      type: "review",
      module: "Fee Collection",
      rating: 5,
      comment: "Excellent module, very reliable!",
      school: "St. Mary's School",
      time: "5 hours ago",
      status: "success",
    },
    {
      id: 3,
      type: "update",
      module: "Exam Management",
      version: "2.1.0",
      time: "1 day ago",
      status: "pending",
    },
    {
      id: 4,
      type: "install",
      module: "Library Management",
      school: "Kisumu High School",
      time: "2 days ago",
      status: "success",
    },
  ];

  const topModules = [
    {
      name: "Attendance Management",
      installs: 342,
      revenue: 18400,
      rating: 4.8,
      growth: 12,
    },
    {
      name: "Fee Collection",
      installs: 289,
      revenue: 15600,
      rating: 4.6,
      growth: 8,
    },
    {
      name: "Exam Management",
      installs: 198,
      revenue: 11200,
      rating: 4.5,
      growth: -3,
    },
  ];

  const StatCard = ({ title, value, change, icon: Icon, color = "blue" }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {typeof value === "number" && value >= 1000 
              ? `${(value / 1000).toFixed(1)}k` 
              : value}
          </p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {change >= 0 ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-1" />
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your module performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Modules"
          value={stats.totalModules}
          change={15}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Active Installs"
          value={stats.activeInstalls}
          change={8}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Monthly Revenue"
          value={`KES ${stats.monthlyRevenue.toLocaleString()}`}
          change={12}
          icon={DollarSign}
          color="yellow"
        />
        <StatCard
          title="Average Rating"
          value={stats.averageRating}
          change={5}
          icon={Star}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
            <Package className="h-6 w-6 text-[#0F4C2A] mr-2" />
            <span className="text-sm font-medium text-gray-700">Create New Module</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
            <FileText className="h-6 w-6 text-[#0F4C2A] mr-2" />
            <span className="text-sm font-medium text-gray-700">View Analytics</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
            <TrendingUp className="h-6 w-6 text-[#0F4C2A] mr-2" />
            <span className="text-sm font-medium text-gray-700">Request Tier Upgrade</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Modules */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Performing Modules</h2>
            <button className="text-sm text-[#0F4C2A] hover:text-[#061A12]">View All</button>
          </div>
          <div className="space-y-4">
            {topModules.map((module, index) => (
              <div key={module.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#0F4C2A] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{module.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {module.installs}
                      </span>
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        {module.rating}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">KES {module.revenue.toLocaleString()}</p>
                  <div className={`flex items-center text-sm ${
                    module.growth >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {module.growth >= 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(module.growth)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <button className="text-sm text-[#0F4C2A] hover:text-[#061A12]">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.status === "success" 
                    ? "bg-green-100" 
                    : activity.status === "pending"
                    ? "bg-yellow-100"
                    : "bg-red-100"
                }`}>
                  {activity.type === "install" && <Users className="h-4 w-4 text-green-600" />}
                  {activity.type === "review" && <Star className="h-4 w-4 text-yellow-600" />}
                  {activity.type === "update" && <Clock className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.type === "install" && (
                      <>New installation of <span className="font-medium">{activity.module}</span> by <span className="font-medium">{activity.school}</span></>
                    )}
                    {activity.type === "review" && (
                      <>New {activity.rating}-star review for <span className="font-medium">{activity.module}</span> from <span className="font-medium">{activity.school}</span></>
                    )}
                    {activity.type === "update" && (
                      <>Update <span className="font-medium">{activity.module}</span> to version <span className="font-medium">{activity.version}</span></>
                    )}
                  </p>
                  {activity.comment && (
                    <p className="text-sm text-gray-600 mt-1 italic">"{activity.comment}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
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
            <p className="text-sm">Integration with charting library needed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
