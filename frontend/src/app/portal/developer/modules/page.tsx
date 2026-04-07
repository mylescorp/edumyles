"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Package,
  Users,
  DollarSign,
  Star,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Upload,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function DeveloperModules() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data - in real app this would come from Convex
  const modules = [
    {
      id: 1,
      name: "Attendance Management",
      description: "Comprehensive attendance tracking with automated reporting",
      status: "published",
      installs: 342,
      revenue: 18400,
      rating: 4.8,
      reviews: 127,
      lastUpdated: "2024-01-15",
      category: "Core",
    },
    {
      id: 2,
      name: "Fee Collection",
      description: "Digital fee collection with M-Pesa integration",
      status: "published",
      installs: 289,
      revenue: 15600,
      rating: 4.6,
      reviews: 89,
      lastUpdated: "2024-01-10",
      category: "Finance",
    },
    {
      id: 3,
      name: "Exam Management",
      description: "Complete examination scheduling and grading system",
      status: "published",
      installs: 198,
      revenue: 11200,
      rating: 4.5,
      reviews: 56,
      lastUpdated: "2024-01-08",
      category: "Academics",
    },
    {
      id: 4,
      name: "Library Management",
      description: "Digital library catalog and circulation system",
      status: "draft",
      installs: 0,
      revenue: 0,
      rating: 0,
      reviews: 0,
      lastUpdated: "2024-01-20",
      category: "Admin",
    },
    {
      id: 5,
      name: "Transport Management",
      description: "School transport routing and tracking system",
      status: "under_review",
      installs: 0,
      revenue: 0,
      rating: 0,
      reviews: 0,
      lastUpdated: "2024-01-18",
      category: "Admin",
    },
  ];

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || module.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="h-4 w-4" />;
      case "draft":
        return <Clock className="h-4 w-4" />;
      case "under_review":
        return <AlertCircle className="h-4 w-4" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Modules</h1>
          <p className="text-gray-600">Manage your published and draft modules</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12] transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Module
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Modules</p>
              <p className="text-2xl font-semibold text-gray-900">{modules.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-semibold text-gray-900">
                {modules.filter(m => m.status === "published").length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Installs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {modules.reduce((sum, m) => sum + m.installs, 0).toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                KES {modules.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
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
                placeholder="Search modules..."
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
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="under_review">Under Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Modules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Installs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredModules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{module.name}</div>
                      <div className="text-sm text-gray-500">{module.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(module.status)}`}>
                      {getStatusIcon(module.status)}
                      <span className="ml-1">
                        {module.status.replace("_", " ").charAt(0).toUpperCase() + module.status.slice(1).replace("_", " ")}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {module.installs.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {module.revenue > 0 ? `KES ${module.revenue.toLocaleString()}` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {module.rating > 0 ? (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-900">{module.rating}</span>
                        <span className="ml-1 text-xs text-gray-500">({module.reviews})</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No reviews</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(module.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download className="h-4 w-4" />
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

      {/* Create Module Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Module</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Module Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="Enter module name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="Describe your module"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]">
                    <option>Core</option>
                    <option>Finance</option>
                    <option>Academics</option>
                    <option>Admin</option>
                    <option>Communication</option>
                  </select>
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
                  Create Module
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
