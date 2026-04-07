"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Users,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
} from "lucide-react";

export default function ResellerCustomers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data - in real app this would come from Convex
  const customers = [
    {
      id: 1,
      name: "Green Valley Academy",
      type: "school",
      status: "active",
      email: "admin@greenvalley.edu",
      phone: "+254 743 993 715",
      address: "123 Nairobi Street, Nairobi, Kenya",
      totalOrders: 5,
      totalSpent: 75000,
      lastOrder: "2024-01-20",
      joinDate: "2023-06-15",
      contactPerson: "John Smith",
      rating: 4.8,
      notes: "Premium customer, always pays on time",
    },
    {
      id: 2,
      name: "St. Mary's Primary School",
      type: "school",
      status: "active",
      email: "info@stmarys.edu",
      phone: "+254 712 345 678",
      address: "456 Mombasa Road, Nairobi, Kenya",
      totalOrders: 3,
      totalSpent: 24000,
      lastOrder: "2024-01-18",
      joinDate: "2023-08-20",
      contactPerson: "Mary Johnson",
      rating: 4.5,
      notes: "Good customer, needs follow-up for upsell",
    },
    {
      id: 3,
      name: "Nairobi High School",
      type: "school",
      status: "inactive",
      email: "contact@nairobihigh.edu",
      phone: "+254 723 456 789",
      address: "789 Thika Road, Nairobi, Kenya",
      totalOrders: 2,
      totalSpent: 16000,
      lastOrder: "2023-12-10",
      joinDate: "2023-05-10",
      contactPerson: "David Wilson",
      rating: 4.2,
      notes: "Inactive for 2 months, needs re-engagement",
    },
    {
      id: 4,
      name: "Kisumu Girls Academy",
      type: "school",
      status: "active",
      email: "admin@kisumugirls.edu",
      phone: "+254 734 567 890",
      address: "321 Kisumu Road, Kisumu, Kenya",
      totalOrders: 4,
      totalSpent: 20000,
      lastOrder: "2024-01-15",
      joinDate: "2023-07-25",
      contactPerson: "Sarah Brown",
      rating: 4.7,
      notes: "Regular customer, interested in training packages",
    },
    {
      id: 5,
      name: "TechEdu Solutions",
      type: "business",
      status: "active",
      email: "info@techedu.com",
      phone: "+254 745 678 901",
      address: "654 Westlands, Nairobi, Kenya",
      totalOrders: 8,
      totalSpent: 120000,
      lastOrder: "2024-01-19",
      joinDate: "2023-04-01",
      contactPerson: "Michael Davis",
      rating: 4.9,
      notes: "Enterprise client, high potential for growth",
    },
  ];

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || customer.status === filterStatus;
    const matchesType = filterType === "all" || customer.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "school":
        return "bg-blue-100 text-blue-800";
      case "business":
        return "bg-purple-100 text-purple-800";
      case "individual":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === "active").length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    averageOrderValue: customers.reduce((sum, c) => sum + (c.totalSpent / c.totalOrders), 0) / customers.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships and sales</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12] transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeCustomers}</p>
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
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">KES {Math.round(stats.averageOrderValue).toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
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
                placeholder="Search customers..."
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
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
          >
            <option value="all">All Types</option>
            <option value="school">School</option>
            <option value="business">Business</option>
            <option value="individual">Individual</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Order
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
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.contactPerson}</div>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(customer.type)}`}>
                      {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                      {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.totalOrders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KES {customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.lastOrder).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-900">{customer.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
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

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Revenue</h2>
        <div className="space-y-4">
          {customers
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5)
            .map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#0F4C2A] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.totalOrders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">KES {customer.totalSpent.toLocaleString()}</p>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-500">{customer.rating}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Customer</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]">
                      <option>School</option>
                      <option>Business</option>
                      <option>Individual</option>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                      placeholder="Customer address"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="Add any notes about this customer..."
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
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
