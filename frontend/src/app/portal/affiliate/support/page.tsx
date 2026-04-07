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
} from "lucide-react";

export default function AffiliateSupport() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Mock data - in real app this would come from Convex
  const tickets = [
    {
      id: 1,
      subject: "Referral payment not received",
      description: "I haven't received my payment for the January referrals",
      status: "open",
      priority: "high",
      category: "payment",
      createdAt: "2024-01-20T10:30:00Z",
      updatedAt: "2024-01-20T14:15:00Z",
      replies: 3,
      lastReply: "EduMyles Support Team",
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
      lastReply: "John Affiliate",
    },
    {
      id: 3,
      subject: "Marketing materials request",
      description: "Need additional marketing materials for social media",
      status: "resolved",
      priority: "low",
      category: "marketing",
      createdAt: "2024-01-15T14:20:00Z",
      updatedAt: "2024-01-16T11:30:00Z",
      replies: 2,
      lastReply: "EduMyles Support Team",
    },
  ];

  const faqs = [
    {
      question: "How do I track my referrals?",
      answer: "You can track your referrals in the Referrals section of your affiliate dashboard. Each referral shows their status, signup date, and conversion status.",
    },
    {
      question: "When will I receive my payments?",
      answer: "Payments are processed monthly within the first 15 days of the following month. You need a minimum of KES 5,000 in earnings to receive payment.",
    },
    {
      question: "What is the commission structure?",
      answer: "Commission rates vary by tier: Standard (15%), Gold (20%), and Platinum (25%). Higher tiers also get additional benefits like longer cookie duration.",
    },
    {
      question: "How long do cookies last?",
      answer: "Standard tier affiliates get 30-day cookies, Gold tier gets 45 days, and Platinum tier gets 60 days of cookie tracking.",
    },
    {
      question: "Can I promote EduMyles internationally?",
      answer: "Yes, you can promote EduMyles worldwide. However, we focus primarily on East African markets (Kenya, Uganda, Tanzania, Rwanda).",
    },
  ];

  const resources = [
    {
      title: "Affiliate Marketing Guide",
      description: "Complete guide to successful affiliate marketing",
      type: "PDF",
      size: "2.4 MB",
      downloads: 156,
    },
    {
      title: "Social Media Templates",
      description: "Ready-to-use templates for Facebook, Twitter, LinkedIn",
      type: "ZIP",
      size: "15.7 MB",
      downloads: 89,
    },
    {
      title: "Email Marketing Templates",
      description: "Professional email templates for outreach",
      type: "DOCX",
      size: "1.2 MB",
      downloads: 67,
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
          <p className="text-gray-600">Get help with your affiliate program and earnings</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">12.5%</p>
                <p className="text-sm text-green-700">Average Conversion Rate</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">156</p>
                <p className="text-sm text-blue-700">Total Referrals</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">KES 28.5k</p>
                <p className="text-sm text-purple-700">Total Earnings</p>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Marketing Resources</h2>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Social Media Strategy</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Post consistently during peak hours</li>
                  <li>Use engaging visuals and videos</li>
                  <li>Include your referral link in posts</li>
                  <li>Engage with your audience regularly</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Email Marketing</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>Personalize your outreach messages</li>
                  <li>Focus on benefits for schools</li>
                  <li>Include success stories and testimonials</li>
                  <li>Follow up with interested prospects</li>
                </ul>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">Content Marketing</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>Create educational content about EdTech</li>
                  <li>Share case studies and success stories</li>
                  <li>Write blog posts about school management</li>
                  <li>Use SEO to attract organic traffic</li>
                </ul>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">Networking</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>Attend education conferences and events</li>
                  <li>Join education-focused online communities</li>
                  <li>Connect with school administrators</li>
                  <li>Build relationships with decision makers</li>
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
                    <p className="text-gray-600">affiliates@edumyles.com</p>
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
                    <option value="payment">Payment Issue</option>
                    <option value="technical">Technical Problem</option>
                    <option value="general">General Question</option>
                    <option value="marketing">Marketing Support</option>
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
