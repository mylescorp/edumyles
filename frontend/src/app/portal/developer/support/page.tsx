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
} from "lucide-react";

export default function DeveloperSupport() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Mock data - in real app this would come from Convex
  const tickets = [
    {
      id: 1,
      subject: "Module deployment issue",
      description: "My latest module update is not deploying correctly",
      status: "open",
      priority: "high",
      category: "technical",
      createdAt: "2024-01-20T10:30:00Z",
      updatedAt: "2024-01-20T14:15:00Z",
      replies: 3,
      lastReply: "EduMyles Support Team",
    },
    {
      id: 2,
      subject: "Revenue reporting discrepancy",
      description: "Revenue numbers don't match my calculations",
      status: "in_progress",
      priority: "medium",
      category: "billing",
      createdAt: "2024-01-18T09:00:00Z",
      updatedAt: "2024-01-19T16:45:00Z",
      replies: 5,
      lastReply: "John Developer",
    },
    {
      id: 3,
      subject: "API rate limiting question",
      description: "Need clarification on API rate limits for my module",
      status: "resolved",
      priority: "low",
      category: "technical",
      createdAt: "2024-01-15T14:20:00Z",
      updatedAt: "2024-01-16T11:30:00Z",
      replies: 2,
      lastReply: "EduMyles Support Team",
    },
  ];

  const faqs = [
    {
      question: "How do I update my published module?",
      answer: "You can update your module through the developer portal. Go to My Modules, select your module, and click 'Edit'. After making changes, submit for review."
    },
    {
      question: "When will I receive my revenue payments?",
      answer: "Revenue payments are processed monthly. You'll receive payment within 15 days after the end of each month for your earnings."
    },
    {
      question: "What are the commission rates?",
      answer: "Commission rates vary by tier: Indie (15%), Verified (20%), and Enterprise (25%). Higher tiers also get additional benefits."
    },
    {
      question: "How can I get my module featured?",
      answer: "Modules with high ratings, regular updates, and good user engagement are more likely to be featured. Focus on quality and user experience."
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600">Get help with your modules and account</p>
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
                      </div>
                      <p className="text-gray-600 mb-2">{ticket.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>#{ticket.id}</span>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <BookOpen className="h-6 w-6 text-[#0F4C2A] mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Developer Documentation</p>
                  <p className="text-sm text-gray-600">Complete API reference and guides</p>
                </div>
              </a>
              <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <HelpCircle className="h-6 w-6 text-[#0F4C2A] mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Module Guidelines</p>
                  <p className="text-sm text-gray-600">Best practices for module development</p>
                </div>
              </a>
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
                    <p className="text-gray-600">developers@edumyles.com</p>
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
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="account">Account Issue</option>
                    <option value="feature">Feature Request</option>
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
