"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Reply,
  Paperclip,
  Send,
  HelpCircle,
  BookOpen,
  Mail,
  Phone,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Store,
} from "lucide-react";

export default function ResellerSupport() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Mock data - in real app this would come from Convex
  const tickets = [
    {
      id: 1,
      subject: "Order #ORD-2024-001 shipping delay",
      description: "Customer hasn't received their order that was supposed to be delivered yesterday",
      status: "open",
      priority: "high",
      category: "shipping",
      createdAt: "2024-01-20T10:30:00Z",
      updatedAt: "2024-01-20T14:15:00Z",
      replies: 3,
      lastReply: "EduMyles Support Team",
      orderId: "ORD-2024-001",
    },
    {
      id: 2,
      subject: "Question about commission rates",
      description: "I want to understand the commission structure better",
      status: "in_progress",
      priority: "medium",
      category: "general",
      createdAt: "2024-01-18T09:00:00Z",
      updatedAt: "2024-01-19T16:45:00Z",
      replies: 5,
      lastReply: "TechReseller Kenya",
    },
    {
      id: 3,
      subject: "Product availability inquiry",
      description: "Need to check availability of Premium Package for bulk order",
      status: "resolved",
      priority: "low",
      category: "products",
      createdAt: "2024-01-15T14:20:00Z",
      updatedAt: "2024-01-16T11:30:00Z",
      replies: 2,
      lastReply: "EduMyles Support Team",
    },
    {
      id: 4,
      subject: "Payment processing issue",
      description: "Customer payment not reflected in system",
      status: "open",
      priority: "high",
      category: "payment",
      createdAt: "2024-01-17T11:45:00Z",
      updatedAt: "2024-01-18T09:30:00Z",
      replies: 4,
      lastReply: "EduMyles Support Team",
      orderId: "ORD-2024-003",
    },
  ];

  const faqs = [
    {
      question: "How do I track my orders?",
      answer: "You can track your orders in the Orders section of your reseller dashboard. Each order shows its current status, estimated delivery date, and tracking information.",
    },
    {
      question: "What are the commission rates?",
      answer: "Commission rates vary by tier: Bronze (10%), Silver (12%), Gold (15%), Premium (15%), and Platinum (20%). Higher tiers also get additional benefits.",
    },
    {
      question: "How do I handle customer returns?",
      answer: "Customer returns should be processed through your dashboard. You can initiate return requests and track their status. Refunds are processed according to our return policy.",
    },
    {
      question: "Can I sell internationally?",
      answer: "Yes, you can sell internationally. However, shipping rates and delivery times may vary. International orders require additional customs documentation.",
    },
    {
      question: "How do I get marketing materials?",
      answer: "Marketing materials are available in the Marketing section of your dashboard. You can download brochures, social media templates, and product images.",
    },
  ];

  const resources = [
    {
      title: "Reseller Handbook",
      description: "Complete guide to successful reselling",
      type: "PDF",
      size: "3.2 MB",
      downloads: 234,
    },
    {
      title: "Product Catalog",
      description: "Detailed product information and pricing",
      type: "PDF",
      size: "5.7 MB",
      downloads: 189,
    },
    {
      title: "Marketing Templates",
      description: "Ready-to-use marketing materials",
      type: "ZIP",
      size: "25.4 MB",
      downloads: 156,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <MessageSquare className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "closed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "shipping":
        return "bg-purple-100 text-purple-800";
      case "payment":
        return "bg-green-100 text-green-800";
      case "products":
        return "bg-blue-100 text-blue-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600">Get help with your reseller business and operations</p>
        </div>
        {activeTab === "tickets" && (
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12] transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "tickets", label: "Support Tickets", icon: MessageSquare },
            { id: "faq", label: "FAQ", icon: HelpCircle },
            { id: "resources", label: "Resources", icon: BookOpen },
            { id: "contact", label: "Contact", icon: Mail },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center
                ${activeTab === tab.id
                  ? "border-[#0F4C2A] text-[#0F4C2A]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  />
                </div>
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]">
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]">
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{ticket.subject}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">
                            {ticket.status.replace("_", " ").charAt(0).toUpperCase() + ticket.status.slice(1).replace("_", " ")}
                          </span>
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                          {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{ticket.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>#{ticket.id}</span>
                        {ticket.orderId && <span>Order: {ticket.orderId}</span>}
                        <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <span>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                        <span>{ticket.replies} replies</span>
                        <span>Last reply: {ticket.lastReply}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">KES 456k</p>
                <p className="text-sm text-green-700">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">234</p>
                <p className="text-sm text-blue-700">Total Customers</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">567</p>
                <p className="text-sm text-purple-700">Total Orders</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reseller Resources</h2>
              <div className="space-y-4">
                {resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#0F4C2A] rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{resource.title}</h3>
                        <p className="text-sm text-gray-600">{resource.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>{resource.type}</span>
                          <span>{resource.size}</span>
                          <span>{resource.downloads} downloads</span>
                        </div>
                      </div>
                    </div>
                    <button className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]">
                      <Send className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Customer Engagement</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Follow up with customers regularly</li>
                  <li>Provide personalized recommendations</li>
                  <li>Share success stories and testimonials</li>
                  <li>Offer bundle deals and discounts</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Product Knowledge</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>Study product features thoroughly</li>
                  <li>Understand customer pain points</li>
                  <li>Demonstrate product value clearly</li>
                  <li>Stay updated on new releases</li>
                </ul>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">Marketing Strategy</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>Use multiple marketing channels</li>
                  <li>Create targeted campaigns</li>
                  <li>Leverage social media effectively</li>
                  <li>Build a strong online presence</li>
                </ul>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">Business Growth</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>Focus on customer retention</li>
                  <li>Expand your product offerings</li>
                  <li>Build strategic partnerships</li>
                  <li>Invest in professional development</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Support</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-6 w-6 text-[#0F4C2A] mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Email Support</p>
                    <p className="text-gray-600">resellers@edumyles.com</p>
                    <p className="text-sm text-gray-500">Response time: 24-48 hours</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="h-6 w-6 text-[#0F4C2A] mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Phone Support</p>
                    <p className="text-gray-600">+254 743 993 715</p>
                    <p className="text-sm text-gray-500">Mon-Fri, 9AM-5PM EAT</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Store className="h-6 w-6 text-[#0F4C2A] mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Reseller Hotline</p>
                    <p className="text-gray-600">+254 700 123 456</p>
                    <p className="text-sm text-gray-500">Priority support for Premium+ tiers</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="Describe your issue..."
                  />
                </div>
                <button className="w-full px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12] transition-colors">
                  Send Message
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Support Hours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">General Support</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>9:00 AM - 5:00 PM EAT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span>10:00 AM - 2:00 PM EAT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Emergency Support</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>24/7 Hotline:</span>
                    <span>+254 700 123 456</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span>emergency@edumyles.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span>Within 2 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowNewTicketModal(false)} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Support Ticket</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]">
                    <option value="shipping">Shipping Issue</option>
                    <option value="payment">Payment Problem</option>
                    <option value="products">Product Question</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="Detailed description of your issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order ID (if applicable)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    placeholder="e.g., ORD-2024-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Drop files here or click to upload</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Create Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
