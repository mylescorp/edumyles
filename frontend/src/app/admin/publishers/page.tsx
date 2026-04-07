"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  Code,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  MoreVertical,
  Award,
  BarChart3,
  Globe,
  Star,
} from "lucide-react";

export default function PlatformPublishers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState(null);

  // Mock data - in real app this would come from Convex
  const publishers = [
    {
      id: 1,
      companyName: "EduTech Solutions Kenya",
      businessType: "business",
      status: "active",
      tier: "premium",
      email: "contact@edutech.co.ke",
      phone: "+254 743 993 715",
      address: "123 Westlands, Nairobi, Kenya",
      website: "https://edutech.co.ke",
      joinedDate: "2023-04-01",
      lastActive: "2024-01-20",
      totalModules: 12,
      activeModules: 10,
      totalInstalls: 1567,
      totalRevenue: 892000,
      averageRating: 4.7,
      verificationStatus: {
        businessRegistration: "verified",
        technicalCapability: "verified",
        codeQuality: "verified",
      },
      performance: {
        monthlyGrowth: 28.5,
        userRetention: 92.3,
        moduleCompletionRate: 87.6,
        averageResponseTime: "1.2 hours",
      },
      contactPerson: "John Smith",
      contactEmail: "john.smith@edutech.co.ke",
      topModules: [
        { name: "MathMaster Pro", installs: 456, revenue: 234000, rating: 4.8 },
        { name: "ScienceLab VR", installs: 345, revenue: 189000, rating: 4.6 },
        { name: "LanguageLearn AI", installs: 234, revenue: 123000, rating: 4.5 },
      ],
    },
    {
      id: 2,
      companyName: "Digital Learning Innovations",
      businessType: "partnership",
      status: "active",
      tier: "gold",
      email: "info@digitallearning.co.ke",
      phone: "+254 712 345 678",
      address: "456 Mombasa Road, Nairobi, Kenya",
      website: "https://digitallearning.co.ke",
      joinedDate: "2023-06-15",
      lastActive: "2024-01-19",
      totalModules: 8,
      activeModules: 7,
      totalInstalls: 987,
      totalRevenue: 456000,
      averageRating: 4.5,
      verificationStatus: {
        businessRegistration: "verified",
        technicalCapability: "verified",
        codeQuality: "pending",
      },
      performance: {
        monthlyGrowth: 22.1,
        userRetention: 88.7,
        moduleCompletionRate: 82.3,
        averageResponseTime: "2.1 hours",
      },
      contactPerson: "Mary Johnson",
      contactEmail: "mary.johnson@digitallearning.co.ke",
      topModules: [
        { name: "HistoryExplorer", installs: 234, revenue: 123000, rating: 4.4 },
        { name: "GeoWorld Plus", installs: 189, revenue: 98700, rating: 4.6 },
      ],
    },
    {
      id: 3,
      companyName: "CodeCraft Education",
      businessType: "individual",
      status: "inactive",
      tier: "silver",
      email: "developer@codecraft.co.ke",
      phone: "+254 723 456 789",
      address: "789 Thika Road, Nairobi, Kenya",
      website: "https://codecraft.co.ke",
      joinedDate: "2023-08-20",
      lastActive: "2023-12-10",
      totalModules: 5,
      activeModules: 3,
      totalInstalls: 234,
      totalRevenue: 123000,
      averageRating: 4.2,
      verificationStatus: {
        businessRegistration: "not_applicable",
        technicalCapability: "verified",
        codeQuality: "verified",
      },
      performance: {
        monthlyGrowth: -3.2,
        userRetention: 75.6,
        moduleCompletionRate: 78.9,
        averageResponseTime: "4.5 hours",
      },
      contactPerson: "David Wilson",
      contactEmail: "david.wilson@codecraft.co.ke",
      topModules: [
        { name: "Programming Basics", installs: 123, revenue: 45600, rating: 4.1 },
      ],
    },
    {
      id: 4,
      companyName: "Smart Classroom Systems",
      businessType: "corporation",
      status: "suspended",
      tier: "bronze",
      email: "admin@smartclassroom.co.ke",
      phone: "+254 734 567 890",
      address: "321 Kisumu Road, Kisumu, Kenya",
      website: "https://smartclassroom.co.ke",
      joinedDate: "2023-09-10",
      lastActive: "2024-01-15",
      totalModules: 3,
      activeModules: 2,
      totalInstalls: 89,
      totalRevenue: 44500,
      averageRating: 3.8,
      verificationStatus: {
        businessRegistration: "verified",
        technicalCapability: "failed",
        codeQuality: "pending",
      },
      performance: {
        monthlyGrowth: 5.7,
        userRetention: 68.9,
        moduleCompletionRate: 71.2,
        averageResponseTime: "6.2 hours",
      },
      contactPerson: "Sarah Brown",
      contactEmail: "sarah.brown@smartclassroom.co.ke",
      topModules: [
        { name: "Attendance Tracker", installs: 45, revenue: 23400, rating: 3.7 },
      ],
    },
  ];

  const filteredPublishers = publishers.filter(publisher => {
    const matchesSearch = publisher.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         publisher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         publisher.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || publisher.status === filterStatus;
    const matchesTier = filterTier === "all" || publisher.tier === filterTier;
    return matchesSearch && matchesStatus && matchesTier;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "bronze":
        return "bg-orange-100 text-orange-800";
      case "silver":
        return "bg-gray-100 text-gray-800";
      case "gold":
        return "bg-yellow-100 text-yellow-800";
      case "platinum":
        return "bg-purple-100 text-purple-800";
      case "premium":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "not_applicable":
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const stats = {
    totalPublishers: publishers.length,
    activePublishers: publishers.filter(p => p.status === "active").length,
    totalModules: publishers.reduce((sum, p) => sum + p.totalModules, 0),
    totalInstalls: publishers.reduce((sum, p) => sum + p.totalInstalls, 0),
    totalRevenue: publishers.reduce((sum, p) => sum + p.totalRevenue, 0),
    averageRating: publishers.reduce((sum, p) => sum + p.averageRating, 0) / publishers.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publisher Management</h1>
          <p className="text-gray-600">Manage module publishers and monitor their performance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12] transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Publisher
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Publishers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPublishers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activePublishers}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Modules</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalModules}</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Installs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalInstalls}</p>
            </div>
            <Code className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">KES {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.averageRating.toFixed(1)}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
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
                placeholder="Search publishers..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
          >
            <option value="all">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      {/* Publishers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publisher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modules
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPublishers.map((publisher) => (
                <tr key={publisher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{publisher.companyName}</div>
                      <div className="text-sm text-gray-500">{publisher.contactPerson}</div>
                      <div className="text-xs text-gray-500">{publisher.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(publisher.status)}`}>
                      {publisher.status.charAt(0).toUpperCase() + publisher.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(publisher.tier)}`}>
                      <Award className="h-3 w-3 mr-1" />
                      {publisher.tier.charAt(0).toUpperCase() + publisher.tier.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{publisher.activeModules}/{publisher.totalModules}</div>
                      <div className="text-xs text-gray-500">{publisher.totalInstalls} installs</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        {publisher.performance.monthlyGrowth >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                        )}
                        <span className={publisher.performance.monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                          {Math.abs(publisher.performance.monthlyGrowth)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {publisher.performance.userRetention}% retention
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KES {publisher.totalRevenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-900">{publisher.averageRating}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedPublisher(publisher)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Publishers</h2>
        <div className="space-y-4">
          {publishers
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5)
            .map((publisher, index) => (
              <div key={publisher.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-[#0F4C2A] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{publisher.companyName}</p>
                    <p className="text-sm text-gray-500">{publisher.totalModules} modules</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(publisher.tier)}`}>
                      {publisher.tier.charAt(0).toUpperCase() + publisher.tier.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">KES {publisher.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    {publisher.performance.monthlyGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span>{publisher.performance.monthlyGrowth}%</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Publisher Details Modal */}
      {selectedPublisher && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedPublisher(null)} />
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{selectedPublisher.companyName}</h2>
                <button
                  onClick={() => setSelectedPublisher(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Business Type:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{selectedPublisher.businessType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Contact Person:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Address:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Website:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.website}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Joined Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedPublisher.joinedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Active:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedPublisher.lastActive).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Modules:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.totalModules}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Modules:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.activeModules}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Installs:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.totalInstalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Revenue:</span>
                      <span className="text-sm font-medium text-gray-900">KES {selectedPublisher.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Rating:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.averageRating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Growth:</span>
                      <span className={`text-sm font-medium ${selectedPublisher.performance.monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {selectedPublisher.performance.monthlyGrowth}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">User Retention:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.performance.userRetention}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Module Completion:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedPublisher.performance.moduleCompletionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Modules */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Modules</h3>
                <div className="space-y-3">
                  {selectedPublisher.topModules.map((module, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-[#0F4C2A] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{module.name}</p>
                          <p className="text-sm text-gray-500">{module.installs} installs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">KES {module.revenue.toLocaleString()}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                          <span>{module.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Status */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getVerificationIcon(selectedPublisher.verificationStatus.businessRegistration)}
                      <span className="text-sm font-medium text-gray-900">Business Registration</span>
                    </div>
                    <span className={`text-xs font-medium capitalize ${getStatusColor(selectedPublisher.verificationStatus.businessRegistration)}`}>
                      {selectedPublisher.verificationStatus.businessRegistration.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getVerificationIcon(selectedPublisher.verificationStatus.technicalCapability)}
                      <span className="text-sm font-medium text-gray-900">Technical Capability</span>
                    </div>
                    <span className={`text-xs font-medium capitalize ${getStatusColor(selectedPublisher.verificationStatus.technicalCapability)}`}>
                      {selectedPublisher.verificationStatus.technicalCapability.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getVerificationIcon(selectedPublisher.verificationStatus.codeQuality)}
                      <span className="text-sm font-medium text-gray-900">Code Quality</span>
                    </div>
                    <span className={`text-xs font-medium capitalize ${getStatusColor(selectedPublisher.verificationStatus.codeQuality)}`}>
                      {selectedPublisher.verificationStatus.codeQuality.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedPublisher(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]">
                  <Edit className="h-4 w-4 mr-2 inline" />
                  Edit Publisher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Publisher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Publisher</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]">
                      <option value="business">Business</option>
                      <option value="individual">Individual</option>
                      <option value="partnership">Partnership</option>
                      <option value="corporation">Corporation</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                      placeholder="Contact person name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Tier</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]">
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="Business address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]"
                >
                  Add Publisher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
