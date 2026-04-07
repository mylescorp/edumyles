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
  Share2,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function AffiliateAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("earnings");

  // Mock data - in real app this would come from Convex
  const earningsData = [
    { date: "2024-01-01", earnings: 1200, clicks: 45, conversions: 3 },
    { date: "2024-01-02", earnings: 1500, clicks: 52, conversions: 4 },
    { date: "2024-01-03", earnings: 1800, clicks: 61, conversions: 5 },
    { date: "2024-01-04", earnings: 1400, clicks: 38, conversions: 3 },
    { date: "2024-01-05", earnings: 2100, clicks: 74, conversions: 6 },
    { date: "2024-01-06", earnings: 1900, clicks: 68, conversions: 5 },
    { date: "2024-01-07", earnings: 2300, clicks: 82, conversions: 7 },
  ];

  const sourceData = [
    { source: "Facebook", clicks: 234, conversions: 15, earnings: 4500, conversionRate: 6.4 },
    { source: "Twitter", clicks: 189, conversions: 12, earnings: 3600, conversionRate: 6.3 },
    { source: "Email", clicks: 156, conversions: 11, earnings: 3300, conversionRate: 7.1 },
    { source: "WhatsApp", clicks: 98, conversions: 8, earnings: 2400, conversionRate: 8.2 },
    { source: "LinkedIn", clicks: 67, conversions: 4, earnings: 1200, conversionRate: 6.0 },
    { source: "Website", clicks: 45, conversions: 3, earnings: 900, conversionRate: 6.7 },
  ];

  const geographicData = [
    { country: "Kenya", clicks: 567, conversions: 42, earnings: 12600, conversionRate: 7.4 },
    { country: "Uganda", clicks: 234, conversions: 15, earnings: 4500, conversionRate: 6.4 },
    { country: "Tanzania", clicks: 189, conversions: 11, earnings: 3300, conversionRate: 5.8 },
    { country: "Rwanda", clicks: 98, conversions: 6, earnings: 1800, conversionRate: 6.1 },
    { country: "Others", clicks: 45, conversions: 2, earnings: 600, conversionRate: 4.4 },
  ];

  const keyMetrics = {
    totalEarnings: 28450,
    monthlyGrowth: 22.5,
    totalClicks: 4872,
    conversionRate: 12.5,
    averageOrderValue: 15000,
    activeReferrals: 89,
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
          <p className="text-gray-600">Track your affiliate performance and earnings</p>
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
        <MetricCard
          title="Total Earnings"
          value={keyMetrics.totalEarnings}
          change={22.5}
          icon={DollarSign}
          color="green"
          prefix="KES "
        />
        <MetricCard
          title="Total Clicks"
          value={keyMetrics.totalClicks}
          change={15.2}
          icon={Eye}
          color="blue"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${keyMetrics.conversionRate}%`}
          change={3.1}
          icon={Target}
          color="purple"
        />
        <MetricCard
          title="Active Referrals"
          value={keyMetrics.activeReferrals}
          change={8.7}
          icon={Users}
          color="indigo"
        />
        <MetricCard
          title="Avg Order Value"
          value={keyMetrics.averageOrderValue}
          change={5.3}
          icon={TrendingUp}
          color="yellow"
          prefix="KES "
        />
        <MetricCard
          title="Monthly Growth"
          value={`${keyMetrics.monthlyGrowth}%`}
          change={2.8}
          icon={BarChart3}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Earnings Overview</h2>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="earnings">Earnings</option>
              <option value="clicks">Clicks</option>
              <option value="conversions">Conversions</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Earnings chart</p>
              <p className="text-sm">KES {keyMetrics.totalEarnings.toLocaleString()} total</p>
            </div>
          </div>
        </div>

        {/* Source Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h2>
          <div className="space-y-3">
            {sourceData.map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Share2 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{source.source}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{source.clicks} clicks</span>
                  <span className="text-sm font-medium text-gray-900">{source.conversions} conv.</span>
                  <span className="text-sm font-medium text-gray-900">KES {source.earnings.toLocaleString()}</span>
                  <span className="text-sm text-gray-600">{source.conversionRate}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Total</span>
              <span className="text-sm font-bold text-gray-900">
                KES {sourceData.reduce((sum, s) => sum + s.earnings, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <span className="text-sm text-gray-600">{country.clicks} clicks</span>
                  <span className="text-sm font-medium text-gray-900">{country.conversions} conv.</span>
                  <span className="text-sm font-medium text-gray-900">KES {country.earnings.toLocaleString()}</span>
                  <span className="text-sm text-gray-600">{country.conversionRate}%</span>
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
                  <p className="font-medium text-green-900">Best Conversion Day</p>
                  <p className="text-sm text-green-700">Saturday - 8.2% conversion rate</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
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
                  <p className="font-medium text-purple-900">Top Performing Source</p>
                  <p className="text-sm text-purple-700">WhatsApp - 8.2% conversion rate</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">Highest Value Country</p>
                  <p className="text-sm text-yellow-700">Kenya - KES 12,600 earnings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Funnel Performance</h3>
            <div className="space-y-3">
              {[
                { stage: "Link Impressions", count: 12450, rate: 100 },
                { stage: "Link Clicks", count: 4872, rate: 39.1 },
                { stage: "Signups", count: 609, rate: 12.5 },
                { stage: "Conversions", count: 76, rate: 12.5 },
                { stage: "Active Schools", count: 89, rate: 117.1 },
              ].map((stage, index) => (
                <div key={stage.stage} className="flex items-center">
                  <div className="w-40 text-sm font-medium text-gray-900">{stage.stage}</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-[#0F4C2A] h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${Math.min(stage.rate, 100)}%` }}
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
                <p className="text-sm font-medium text-blue-900">Click-Through Rate</p>
                <p className="text-sm text-blue-700">39.1% of impressions result in clicks</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">Conversion Rate</p>
                <p className="text-sm text-green-700">12.5% of clicks convert to signups</p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm font-medium text-purple-900">Activation Rate</p>
                <p className="text-sm text-purple-700">117.1% of conversions become active (upsells)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
