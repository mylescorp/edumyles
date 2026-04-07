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
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  MoreVertical,
  Award,
  Store,
  BarChart3,
} from "lucide-react";

export default function PlatformResellers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState(null);

  // Mock data - in real app this would come from Convex
  const resellers = [
    {
      id: 1,
      companyName: "TechReseller Kenya",
      businessType: "business",
      status: "active",
      tier: "premium",
      email: "info@techreseller.co.ke",
      phone: "+254 743 993 715",
      address: "123 Westlands, Nairobi, Kenya",
      website: "https://techreseller.co.ke",
      joinedDate: "2023-04-01",
      lastActive: "2024-01-20",
      totalOrders: 567,
      totalRevenue: 456000,
      totalCustomers: 234,
      averageOrderValue: 800,
      commissionRate: 15,
      referralCode: "TECH123",
      verificationStatus: {
        businessRegistration: "verified",
        taxCompliance: "verified",
        bankAccount: "pending",
      },
      performance: {
        monthlyGrowth: 22.5,
        customerRetention: 85.3,
        orderCompletionRate: 94.2,
        averageResponseTime: "2.3 hours",
      },
      contactPerson: "John Smith",
      contactEmail: "john.smith@techreseller.co.ke",
    },
    {
      id: 2,
      companyName: "EduTech Solutions",
      businessType: "business",
      status: "active",
      tier: "gold",
      email: "contact@edutech.co.ke",
      phone: "+254 712 345 678",
      address: "456 Mombasa Road, Nairobi, Kenya",
      website: "https://edutech.co.ke",
      joinedDate: "2023-06-15",
      lastActive: "2024-01-19",
      totalOrders: 423,
      totalRevenue: 312000,
      totalCustomers: 189,
      averageOrderValue: 738,
      commissionRate: 15,
      referralCode: "EDU456",
      verificationStatus: {
        businessRegistration: "verified",
        taxCompliance: "verified",
        bankAccount: "verified",
      },
      performance: {
        monthlyGrowth: 18.2,
        customerRetention: 82.7,
        orderCompletionRate: 91.5,
        averageResponseTime: "3.1 hours",
      },
      contactPerson: "Mary Johnson",
      contactEmail: "mary.johnson@edutech.co.ke",
    },
    {
      id: 3,
      companyName: "Digital Learning Hub",
      businessType: "individual",
      status: "inactive",
      tier: "silver",
      email: "info@digitallearning.co.ke",
      phone: "+254 723 456 789",
      address: "789 Thika Road, Nairobi, Kenya",
      website: "https://digitallearning.co.ke",
      joinedDate: "2023-08-20",
      lastActive: "2023-12-10",
      totalOrders: 156,
      totalRevenue: 78000,
      totalCustomers: 89,
      averageOrderValue: 500,
      commissionRate: 12,
      referralCode: "DLH789",
      verificationStatus: {
        businessRegistration: "not_applicable",
        taxCompliance: "pending",
        bankAccount: "verified",
      },
      performance: {
        monthlyGrowth: -5.3,
        customerRetention: 75.2,
        orderCompletionRate: 87.3,
        averageResponseTime: "4.5 hours",
      },
      contactPerson: "David Wilson",
      contactEmail: "david.wilson@digitallearning.co.ke",
    },
    {
      id: 4,
      companyName: "School Supplies Plus",
      businessType: "business",
      status: "suspended",
      tier: "bronze",
      email: "admin@schoolsupplies.co.ke",
      phone: "+254 734 567 890",
      address: "321 Kisumu Road, Kisumu, Kenya",
      website: "https://schoolsupplies.co.ke",
      joinedDate: "2023-09-10",
      lastActive: "2024-01-15",
      totalOrders: 89,
      totalRevenue: 44500,
      totalCustomers: 45,
      averageOrderValue: 500,
      commissionRate: 10,
      referralCode: "SSP012",
      verificationStatus: {
        businessRegistration: "verified",
        taxCompliance: "failed",
        bankAccount: "verified",
      },
      performance: {
        monthlyGrowth: 8.7,
        customerRetention: 68.9,
        orderCompletionRate: 78.5,
        averageResponseTime: "6.2 hours",
      },
      contactPerson: "Sarah Brown",
      contactEmail: "sarah.brown@schoolsupplies.co.ke",
    },
  ];

  const filteredResellers = resellers.filter(reseller => {
    const matchesSearch = reseller.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reseller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reseller.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || reseller.status === filterStatus;
    const matchesTier = filterTier === "all" || reseller.tier === filterTier;
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
    totalResellers: resellers.length,
    activeResellers: resellers.filter(r => r.status === "active").length,
    totalRevenue: resellers.reduce((sum, r) => sum + r.totalRevenue, 0),
    totalOrders: resellers.reduce((sum, r) => sum + r.totalOrders, 0),
    totalCustomers: resellers.reduce((sum, r) => sum + r.totalCustomers, 0),
    averageRevenuePerReseller: resellers.reduce((sum, r) => sum + r.totalRevenue, 0) / resellers.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reseller Management</h1>
          <p className="text-gray-600">Manage reseller partners and monitor their performance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12] transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reseller
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Resellers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalResellers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeResellers}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
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
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">KES {Math.round(stats.averageRevenuePerReseller).toLocaleString()}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-indigo-600" />
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
                placeholder="Search resellers..."
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

      {/* Resellers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reseller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResellers.map((reseller) => (
                <tr key={reseller.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{reseller.companyName}</div>
                      <div className="text-sm text-gray-500">{reseller.contactPerson}</div>
                      <div className="text-xs text-gray-500">{reseller.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reseller.status)}`}>
                      {reseller.status.charAt(0).toUpperCase() + reseller.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(reseller.tier)}`}>
                      <Award className="h-3 w-3 mr-1" />
                      {reseller.tier.charAt(0).toUpperCase() + reseller.tier.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        {reseller.performance.monthlyGrowth >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                        )}
                        <span className={reseller.performance.monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                          {Math.abs(reseller.performance.monthlyGrowth)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {reseller.performance.customerRetention}% retention
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reseller.totalOrders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KES {reseller.totalRevenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {getVerificationIcon(reseller.verificationStatus.businessRegistration)}
                      {getVerificationIcon(reseller.verificationStatus.taxCompliance)}
                      {getVerificationIcon(reseller.verificationStatus.bankAccount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedReseller(reseller)}
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Resellers</h2>
        <div className="space-y-4">
          {resellers
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5)
            .map((reseller, index) => (
              <div key={reseller.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-[#0F4C2A] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{reseller.companyName}</p>
                    <p className="text-sm text-gray-500">{reseller.totalOrders} orders</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(reseller.tier)}`}>
                      {reseller.tier.charAt(0).toUpperCase() + reseller.tier.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">KES {reseller.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    {reseller.performance.monthlyGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span>{reseller.performance.monthlyGrowth}%</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Reseller Details Modal */}
      {selectedReseller && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedReseller(null)} />
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{selectedReseller.companyName}</h2>
                <button
                  onClick={() => setSelectedReseller(null)}
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
                      <span className="text-sm font-medium text-gray-900 capitalize">{selectedReseller.businessType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Contact Person:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReseller.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReseller.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReseller.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Address:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReseller.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Website:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReseller.website}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Joined Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedReseller.joinedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Active:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedReseller.lastActive).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Orders:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReseller.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Revenue:</span>
                      <span className="text-sm font-medium text-gray-900">KES {selectedReseller.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Customers:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReseller.totalCustomers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Order Value:</span>
                      <span className="text-sm font-medium text-gray-900">KES {selectedReseller.averageOrderValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Commission Rate:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReseller.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Growth:</span>
                      <span className={`text-sm font-medium ${selectedReseller.performance.monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {selectedReseller.performance.monthlyGrowth}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Customer Retention:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReseller.performance.customerRetention}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order Completion:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedReseller.performance.orderCompletionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getVerificationIcon(selectedReseller.verificationStatus.businessRegistration)}
                      <span className="text-sm font-medium text-gray-900">Business Registration</span>
                    </div>
                    <span className={`text-xs font-medium capitalize ${getStatusColor(selectedReseller.verificationStatus.businessRegistration)}`}>
                      {selectedReseller.verificationStatus.businessRegistration.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getVerificationIcon(selectedReseller.verificationStatus.taxCompliance)}
                      <span className="text-sm font-medium text-gray-900">Tax Compliance</span>
                    </div>
                    <span className={`text-xs font-medium capitalize ${getStatusColor(selectedReseller.verificationStatus.taxCompliance)}`}>
                      {selectedReseller.verificationStatus.taxCompliance.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getVerificationIcon(selectedReseller.verificationStatus.bankAccount)}
                      <span className="text-sm font-medium text-gray-900">Bank Account</span>
                    </div>
                    <span className={`text-xs font-medium capitalize ${getStatusColor(selectedReseller.verificationStatus.bankAccount)}`}>
                      {selectedReseller.verificationStatus.bankAccount.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedReseller(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]">
                  <Edit className="h-4 w-4 mr-2 inline" />
                  Edit Reseller
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Reseller Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Reseller</h2>
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
                  Add Reseller
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
