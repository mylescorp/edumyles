"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Target,
} from "lucide-react";

export default function AffiliateReferrals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("30d");

  // Mock data - in real app this would come from Convex
  const referrals = [
    {
      id: 1,
      schoolName: "Green Valley Academy",
      email: "admin@greenvalley.edu",
      status: "converted",
      signupDate: "2024-01-18T10:30:00Z",
      conversionDate: "2024-01-20T14:45:00Z",
      earnings: 15000,
      plan: "Premium",
      clicks: 45,
      source: "facebook",
      country: "Kenya",
    },
    {
      id: 2,
      schoolName: "St. Mary's Primary",
      email: "info@stmarys.edu",
      status: "pending",
      signupDate: "2024-01-15T09:15:00Z",
      conversionDate: null,
      earnings: 0,
      plan: "Trial",
      clicks: 23,
      source: "email",
      country: "Kenya",
    },
    {
      id: 3,
      schoolName: "Nairobi High School",
      email: "contact@nairobihigh.edu",
      status: "converted",
      signupDate: "2024-01-12T16:20:00Z",
      conversionDate: "2024-01-14T11:30:00Z",
      earnings: 12000,
      plan: "Standard",
      clicks: 67,
      source: "twitter",
      country: "Kenya",
    },
    {
      id: 4,
      schoolName: "Kisumu Girls Academy",
      email: "admin@kisumugirls.edu",
      status: "active",
      signupDate: "2024-01-10T13:45:00Z",
      conversionDate: "2024-01-11T10:15:00Z",
      earnings: 18000,
      plan: "Premium",
      clicks: 89,
      source: "whatsapp",
      country: "Kenya",
    },
    {
      id: 5,
      schoolName: "Mombasa International",
      email: "info@mombasaintl.edu",
      status: "expired",
      signupDate: "2023-12-20T14:30:00Z",
      conversionDate: null,
      earnings: 0,
      plan: "Trial",
      clicks: 12,
      source: "linkedin",
      country: "Kenya",
    },
    {
      id: 6,
      schoolName: "Uganda Primary School",
      email: "admin@ugandaprimary.edu",
      status: "converted",
      signupDate: "2024-01-08T11:20:00Z",
      conversionDate: "2024-01-10T16:45:00Z",
      earnings: 10000,
      plan: "Standard",
      clicks: 34,
      source: "website",
      country: "Uganda",
    },
  ];

  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = referral.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         referral.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || referral.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

  const getSourceColor = (source: string) => {
    switch (source) {
      case "facebook":
        return "bg-blue-100 text-blue-800";
      case "twitter":
        return "bg-sky-100 text-sky-800";
      case "email":
        return "bg-purple-100 text-purple-800";
      case "whatsapp":
        return "bg-green-100 text-green-800";
      case "linkedin":
        return "bg-indigo-100 text-indigo-800";
      case "website":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    totalReferrals: referrals.length,
    convertedReferrals: referrals.filter(r => r.status === "converted").length,
    activeReferrals: referrals.filter(r => r.status === "active").length,
    pendingReferrals: referrals.filter(r => r.status === "pending").length,
    totalEarnings: referrals.reduce((sum, r) => sum + r.earnings, 0),
    totalClicks: referrals.reduce((sum, r) => sum + r.clicks, 0),
    conversionRate: ((referrals.filter(r => r.status === "converted").length / referrals.length) * 100).toFixed(1),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="text-gray-600">Track your referral conversions and earnings</p>
        </div>
        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Referrals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalReferrals}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Converted</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.convertedReferrals}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">KES {stats.totalEarnings.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.conversionRate}%</p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search referrals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
          >
            <option value="all">All Status</option>
            <option value="converted">Converted</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Signup Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{referral.schoolName}</div>
                      <div className="text-sm text-gray-500">{referral.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                      {getStatusIcon(referral.status)}
                      <span className="ml-1">
                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {referral.plan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(referral.source)}`}>
                      {referral.source.charAt(0).toUpperCase() + referral.source.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {referral.clicks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {referral.earnings > 0 ? `KES ${referral.earnings.toLocaleString()}` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(referral.signupDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
        <div className="space-y-4">
          {[
            { stage: "Link Clicks", count: stats.totalClicks, conversion: 100 },
            { stage: "Signups", count: referrals.length, conversion: (referrals.length / stats.totalClicks * 100).toFixed(1) },
            { stage: "Converted", count: stats.convertedReferrals, conversion: (stats.convertedReferrals / referrals.length * 100).toFixed(1) },
            { stage: "Active", count: stats.activeReferrals, conversion: (stats.activeReferrals / stats.convertedReferrals * 100).toFixed(1) },
          ].map((stage, index) => (
            <div key={stage.stage} className="flex items-center">
              <div className="w-32 text-sm font-medium text-gray-900">{stage.stage}</div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-full h-8 relative">
                  <div
                    className="bg-[#0F4C2A] h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${stage.conversion}%` }}
                  >
                    {stage.count}
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
