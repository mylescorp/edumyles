"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Download,
  Calendar,
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MoreVertical,
  User,
  DollarSign,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

export default function ResellerOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("30d");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Mock data - in real app this would come from Convex
  const orders = [
    {
      id: 1,
      orderNumber: "ORD-2024-001",
      customer: "Green Valley Academy",
      customerEmail: "admin@greenvalley.edu",
      customerPhone: "+254 743 993 715",
      status: "completed",
      items: [
        {
          name: "EduMyles Premium Package",
          quantity: 2,
          price: 15000,
          total: 30000,
        },
      ],
      subtotal: 30000,
      tax: 3600,
      shipping: 1500,
      total: 35100,
      orderDate: "2024-01-20T10:30:00Z",
      deliveryDate: "2024-01-22T14:00:00Z",
      paymentMethod: "bank_transfer",
      paymentStatus: "paid",
      shippingAddress: "123 Nairobi Street, Nairobi, Kenya",
      notes: "Urgent delivery requested",
    },
    {
      id: 2,
      orderNumber: "ORD-2024-002",
      customer: "St. Mary's Primary School",
      customerEmail: "info@stmarys.edu",
      customerPhone: "+254 712 345 678",
      status: "processing",
      items: [
        {
          name: "EduMyles Standard Package",
          quantity: 1,
          price: 8000,
          total: 8000,
        },
      ],
      subtotal: 8000,
      tax: 960,
      shipping: 1000,
      total: 9960,
      orderDate: "2024-01-19T14:15:00Z",
      deliveryDate: null,
      paymentMethod: "mpesa",
      paymentStatus: "paid",
      shippingAddress: "456 Mombasa Road, Nairobi, Kenya",
      notes: "Standard delivery",
    },
    {
      id: 3,
      orderNumber: "ORD-2024-003",
      customer: "Nairobi High School",
      customerEmail: "contact@nairobihigh.edu",
      customerPhone: "+254 723 456 789",
      status: "pending",
      items: [
        {
          name: "EduMyles Premium Package",
          quantity: 1,
          price: 15000,
          total: 15000,
        },
      ],
      subtotal: 15000,
      tax: 1800,
      shipping: 1200,
      total: 18000,
      orderDate: "2024-01-18T09:45:00Z",
      deliveryDate: null,
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      shippingAddress: "789 Thika Road, Nairobi, Kenya",
      notes: "Awaiting payment confirmation",
    },
    {
      id: 4,
      orderNumber: "ORD-2024-004",
      customer: "Kisumu Girls Academy",
      customerEmail: "admin@kisumugirls.edu",
      customerPhone: "+254 734 567 890",
      status: "shipped",
      items: [
        {
          name: "EduMyles Basic Package",
          quantity: 3,
          price: 5000,
          total: 15000,
        },
      ],
      subtotal: 15000,
      tax: 1800,
      shipping: 2000,
      total: 18800,
      orderDate: "2024-01-17T16:20:00Z",
      deliveryDate: "2024-01-21T10:00:00Z",
      paymentMethod: "mpesa",
      paymentStatus: "paid",
      shippingAddress: "321 Kisumu Road, Kisumu, Kenya",
      notes: "Out for delivery",
    },
    {
      id: 5,
      orderNumber: "ORD-2024-005",
      customer: "TechEdu Solutions",
      customerEmail: "info@techedu.com",
      customerPhone: "+254 745 678 901",
      status: "cancelled",
      items: [
        {
          name: "Hardware Bundle",
          quantity: 1,
          price: 25000,
          total: 25000,
        },
      ],
      subtotal: 25000,
      tax: 3000,
      shipping: 2500,
      total: 30500,
      orderDate: "2024-01-16T11:30:00Z",
      deliveryDate: null,
      paymentMethod: "bank_transfer",
      paymentStatus: "refunded",
      shippingAddress: "654 Westlands, Nairobi, Kenya",
      notes: "Customer requested cancellation",
    },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    processingOrders: orders.filter(o => o.status === "processing").length,
    completedOrders: orders.filter(o => o.status === "completed").length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    averageOrderValue: orders.reduce((sum, o) => sum + o.total, 0) / orders.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12] transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingOrders}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.processingOrders}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedOrders}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">KES {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order</p>
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
                placeholder="Search orders..."
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
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">Order #{order.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {order.customerEmail}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {order.customerPhone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </span>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.items.length} product{order.items.length > 1 ? "s" : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KES {order.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{order.paymentMethod.replace("_", " ")}</div>
                    <div className="text-xs text-gray-500">{order.paymentStatus}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedOrder(null)} />
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order Number:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedOrder.orderDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </span>
                      </span>
                    </div>
                    {selectedOrder.deliveryDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivery Date:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(selectedOrder.deliveryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Customer:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedOrder.customer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedOrder.customerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedOrder.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shipping Address:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedOrder.shippingAddress}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">KES {item.price.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">KES {item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium text-gray-900">KES {selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="text-sm font-medium text-gray-900">KES {selectedOrder.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Shipping:</span>
                    <span className="text-sm font-medium text-gray-900">KES {selectedOrder.shipping.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">KES {selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Method:</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {selectedOrder.paymentMethod.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                      {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]">
                  <Download className="h-4 w-4 mr-2 inline" />
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
