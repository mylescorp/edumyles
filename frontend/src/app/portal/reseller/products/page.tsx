"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Package,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  MoreVertical,
  Star,
  AlertCircle,
} from "lucide-react";

export default function ResellerProducts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data - in real app this would come from Convex
  const products = [
    {
      id: 1,
      name: "EduMyles Premium Package",
      description: "Complete school management system with all features",
      category: "software",
      status: "active",
      price: 15000,
      cost: 8000,
      stock: 100,
      sold: 89,
      rating: 4.8,
      reviews: 127,
      sku: "EMP-PREM-001",
      createdAt: "2024-01-15",
      lastUpdated: "2024-01-20",
    },
    {
      id: 2,
      name: "EduMyles Standard Package",
      description: "Essential school management features",
      category: "software",
      status: "active",
      price: 8000,
      cost: 4500,
      stock: 200,
      sold: 156,
      rating: 4.6,
      reviews: 89,
      sku: "EMP-STD-002",
      createdAt: "2024-01-10",
      lastUpdated: "2024-01-18",
    },
    {
      id: 3,
      name: "EduMyles Basic Package",
      description: "Basic school management for small schools",
      category: "software",
      status: "active",
      price: 5000,
      cost: 2500,
      stock: 300,
      sold: 234,
      rating: 4.5,
      reviews: 56,
      sku: "EMP-BSC-003",
      createdAt: "2024-01-05",
      lastUpdated: "2024-01-15",
    },
    {
      id: 4,
      name: "Teacher Training Package",
      description: "Professional development for teachers",
      category: "training",
      status: "draft",
      price: 3000,
      cost: 1500,
      stock: 50,
      sold: 0,
      rating: 0,
      reviews: 0,
      sku: "ETT-TRN-001",
      createdAt: "2024-01-20",
      lastUpdated: "2024-01-20",
    },
    {
      id: 5,
      name: "Hardware Bundle",
      description: "Complete hardware setup for schools",
      category: "hardware",
      status: "out_of_stock",
      price: 25000,
      cost: 18000,
      stock: 0,
      sold: 45,
      rating: 4.7,
      reviews: 23,
      sku: "EHB-BND-001",
      createdAt: "2024-01-01",
      lastUpdated: "2024-01-10",
    },
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      case "discontinued":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "software":
        return "bg-blue-100 text-blue-800";
      case "hardware":
        return "bg-purple-100 text-purple-800";
      case "training":
        return "bg-yellow-100 text-yellow-800";
      case "service":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === "active").length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
    totalRevenue: products.reduce((sum, p) => sum + (p.price * p.sold), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog and inventory</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12] transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeProducts}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">KES {stats.totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">KES {stats.totalRevenue.toLocaleString()}</p>
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
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
              />
            </div>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
          >
            <option value="all">All Categories</option>
            <option value="software">Software</option>
            <option value="hardware">Hardware</option>
            <option value="training">Training</option>
            <option value="service">Service</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sold
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
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                      <div className="text-xs text-gray-400 mt-1">{product.description.substring(0, 50)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                      {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {product.status.replace("_", " ").charAt(0).toUpperCase() + product.status.slice(1).replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KES {product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.rating > 0 ? (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-900">{product.rating}</span>
                        <span className="ml-1 text-xs text-gray-500">({product.reviews})</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No reviews</span>
                    )}
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

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Product</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="Describe your product"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]">
                      <option>Software</option>
                      <option>Hardware</option>
                      <option>Training</option>
                      <option>Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                      placeholder="Product SKU"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost (KES)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Drop files here or click to upload</p>
                  </div>
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
                  Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
