"use client";

import React from "react";
import {
  Share2,
  TrendingUp,
  Users,
  DollarSign,
  Link2,
  Eye,
  Calendar,
  Copy,
  ExternalLink,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";

export default function AffiliateDashboard() {
  // Mock data - in real app this would come from Convex
  const stats = {
    totalReferrals: 156,
    activeReferrals: 89,
    totalEarnings: 28450,
    pendingEarnings: 4500,
    conversionRate: 12.5,
    clickThroughRate: 3.2,
    monthlyEarnings: 4500,
    totalClicks: 4872,
  };

  const recentReferrals = [
    {
      id: 1,
      schoolName: "Green Valley Academy",
      status: "converted",
      signupDate: "2024-01-18",
      conversionDate: "2024-01-20",
      earnings: 15000,
      plan: "Premium",
    },
    {
      id: 2,
      schoolName: "St. Mary's Primary",
      status: "pending",
      signupDate: "2024-01-15",
      conversionDate: null,
      earnings: 0,
      plan: "Trial",
    },
    {
      id: 3,
      schoolName: "Nairobi High School",
      status: "converted",
      signupDate: "2024-01-12",
      conversionDate: "2024-01-14",
      earnings: 12000,
      plan: "Standard",
    },
    {
      id: 4,
      schoolName: "Kisumu Girls Academy",
      status: "active",
      signupDate: "2024-01-10",
      conversionDate: "2024-01-11",
      earnings: 18000,
      plan: "Premium",
    },
  ];

  const referralLink = "https://edumyles.com/signup?ref=JOHN123";

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
      case "converted":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "converted":
        return <CheckCircle className="h-4 w-4" />;
      case "active":
        return <Users className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "expired":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Dashboard</h1>
        <p className="text-gray-600">Track your referrals and earnings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Referrals"
          value={stats.totalReferrals}
          change={15}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Earnings"
          value={stats.totalEarnings}
          change={22}
          icon={DollarSign}
          color="green"
          prefix="KES "
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          change={3}
          icon={Target}
          color="purple"
        />
        <StatCard
          title="Monthly Earnings"
          value={stats.monthlyEarnings}
          change={18}
          icon={TrendingUp}
          color="yellow"
          prefix="KES "
        />
      </div>

      {/* Referral Link Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h2>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 pr-12"
              />
              <button
                onClick={() => copyToClipboard(referralLink)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button className="flex items-center px-4 py-3 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]">
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Link
          </button>
        </div>
        <div className="mt-3 flex items-center text-sm text-gray-600">
          <Link2 className="h-4 w-4 mr-2" />
          <span>30-day cookie tracking for all referrals</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Referrals */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Referrals</h2>
            <button className="text-sm text-[#0F4C2A] hover:text-[#061A12]">View All</button>
          </div>
          <div className="space-y-4">
            {recentReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{referral.schoolName}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                      {getStatusIcon(referral.status)}
                      <span className="ml-1">
                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>Signup: {new Date(referral.signupDate).toLocaleDateString()}</span>
                    {referral.conversionDate && (
                      <span>Converted: {new Date(referral.conversionDate).toLocaleDateString()}</span>
                    )}
                    <span>{referral.plan}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {referral.earnings > 0 ? `KES ${referral.earnings.toLocaleString()}` : "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
              <Share2 className="h-6 w-6 text-[#0F4C2A] mr-3" />
              <span className="text-sm font-medium text-gray-700">Share Referral Link</span>
            </button>
            <button className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
              <BarChart3 className="h-6 w-6 text-[#0F4C2A] mr-3" />
              <span className="text-sm font-medium text-gray-700">View Analytics</span>
            </button>
            <button className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
              <Download className="h-6 w-6 text-[#0F4C2A] mr-3" />
              <span className="text-sm font-medium text-gray-700">Download Marketing Materials</span>
            </button>
            <button className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0F4C2A] hover:bg-[#0F4C2A]/5 transition-colors">
              <Calendar className="h-6 w-6 text-[#0F4C2A] mr-3" />
              <span className="text-sm font-medium text-gray-700">Request Payout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalClicks.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Clicks</p>
            <p className="text-xs text-gray-500 mt-1">Link impressions</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeReferrals}</p>
            <p className="text-sm text-gray-600">Active Referrals</p>
            <p className="text-xs text-gray-500 mt-1">Currently active schools</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.clickThroughRate}%</p>
            <p className="text-sm text-gray-600">Click-Through Rate</p>
            <p className="text-xs text-gray-500 mt-1">Link engagement</p>
          </div>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Earnings Overview</h2>
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
            <p>Earnings chart will be displayed here</p>
            <p className="text-sm">KES {stats.totalEarnings.toLocaleString()} total earnings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
