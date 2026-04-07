"use client";

import React, { useState } from "react";
import {
  Share2,
  Download,
  Eye,
  Copy,
  Calendar,
  Filter,
  Search,
  FileText,
  Image,
  Video,
  Link2,
  ExternalLink,
  BarChart3,
  Users,
  TrendingUp,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
} from "lucide-react";

export default function AffiliateMarketing() {
  const [activeTab, setActiveTab] = useState("materials");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Mock data - in real app this would come from Convex
  const marketingMaterials = [
    {
      id: 1,
      title: "EduMyles Overview Brochure",
      type: "pdf",
      category: "brochure",
      description: "Comprehensive overview of EduMyles features and benefits",
      downloads: 234,
      size: "2.4 MB",
      createdAt: "2024-01-15",
      thumbnail: "/api/placeholder/200/150",
    },
    {
      id: 2,
      title: "Social Media Kit",
      type: "zip",
      category: "social",
      description: "Ready-to-use social media graphics and captions",
      downloads: 189,
      size: "15.7 MB",
      createdAt: "2024-01-10",
      thumbnail: "/api/placeholder/200/150",
    },
    {
      id: 3,
      title: "Email Templates",
      type: "docx",
      category: "email",
      description: "Professional email templates for school outreach",
      downloads: 156,
      size: "1.2 MB",
      createdAt: "2024-01-08",
      thumbnail: "/api/placeholder/200/150",
    },
    {
      id: 4,
      title: "Product Demo Video",
      type: "mp4",
      category: "video",
      description: "5-minute demo showcasing key features",
      downloads: 98,
      size: "45.3 MB",
      createdAt: "2024-01-05",
      thumbnail: "/api/placeholder/200/150",
    },
    {
      id: 5,
      title: "Pricing Guide",
      type: "pdf",
      category: "pricing",
      description: "Detailed pricing information and ROI calculator",
      downloads: 267,
      size: "890 KB",
      createdAt: "2024-01-03",
      thumbnail: "/api/placeholder/200/150",
    },
  ];

  const socialTemplates = [
    {
      id: 1,
      platform: "facebook",
      title: "Transform Your School Management",
      content: "Discover how EduMyles is helping schools across East Africa streamline operations. From attendance to fees - everything in one platform! #EdTech #SchoolManagement",
      image: "/api/placeholder/400/200",
      engagement: 45,
    },
    {
      id: 2,
      platform: "twitter",
      title: "School Admin Made Simple",
      content: "Tired of paperwork? EduMyles digitizes school management. Save time, reduce errors, focus on education. 15% commission for affiliates! #EdTech #Africa",
      image: "/api/placeholder/400/200",
      engagement: 32,
    },
    {
      id: 3,
      platform: "linkedin",
      title: "Education Technology Innovation",
      content: "Proud to partner with EduMyles - a game-changer for school management in Africa. Join our affiliate program and earn while making an impact. #EdTech #Partnership",
      image: "/api/placeholder/400/200",
      engagement: 28,
    },
  ];

  const emailTemplates = [
    {
      id: 1,
      title: "Introduction to EduMyles",
      subject: "Revolutionize Your School Management with EduMyles",
      preview: "I hope this email finds you well. I wanted to introduce you to EduMyles...",
      opens: 45,
      clicks: 12,
      conversions: 3,
    },
    {
      id: 2,
      title: "Free Trial Offer",
      subject: "Try EduMyles Free for 30 Days - No Credit Card Required",
      preview: "Great news! I can offer you a free 30-day trial of EduMyles...",
      opens: 38,
      clicks: 15,
      conversions: 4,
    },
    {
      id: 3,
      title: "Success Story",
      subject: "How [School Name] Saved 20 Hours/Week with EduMyles",
      preview: "I wanted to share a success story from one of our partner schools...",
      opens: 52,
      clicks: 18,
      conversions: 5,
    },
  ];

  const referralLink = "https://edumyles.com/signup?ref=JOHN123";

  const filteredMaterials = marketingMaterials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || material.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In real app, show toast notification
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-600" />;
      case "zip":
        return <FileText className="h-4 w-4 text-yellow-600" />;
      case "docx":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "mp4":
        return <Video className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-4 w-4 text-blue-600" />;
      case "twitter":
        return <Twitter className="h-4 w-4 text-sky-600" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4 text-blue-700" />;
      case "whatsapp":
        return <MessageCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Share2 className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing Center</h1>
        <p className="text-gray-600">Access marketing materials and promotional tools</p>
      </div>

      {/* Referral Link Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h2>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 pr-12"
              />
              <button
                onClick={() => copyToClipboard(referralLink)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button className="flex items-center px-4 py-3 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]">
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Link
          </button>
        </div>
        <div className="mt-3 flex items-center text-sm text-gray-600">
          <Link2 className="h-4 w-4 mr-2" />
          <span>30-day cookie tracking for all referrals</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "materials", label: "Marketing Materials", icon: FileText },
            { id: "social", label: "Social Media", icon: Share2 },
            { id: "email", label: "Email Templates", icon: Mail },
            { id: "analytics", label: "Performance", icon: BarChart3 },
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

      {/* Marketing Materials Tab */}
      {activeTab === "materials" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search materials..."
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
                <option value="brochure">Brochures</option>
                <option value="social">Social Media</option>
                <option value="email">Email Templates</option>
                <option value="video">Videos</option>
                <option value="pricing">Pricing</option>
              </select>
            </div>
          </div>

          {/* Materials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <Image className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{material.title}</h3>
                    {getTypeIcon(material.type)}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{material.size}</span>
                    <span>{material.downloads} downloads</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </button>
                    <button className="flex-1 flex items-center justify-center px-3 py-2 bg-[#0F4C2A] text-white rounded text-sm hover:bg-[#061A12]">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Media Tab */}
      {activeTab === "social" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {socialTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(template.platform)}
                    <h3 className="font-medium text-gray-900 capitalize">{template.platform}</h3>
                  </div>
                  <span className="text-sm text-gray-500">{template.engagement} engagements</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{template.content}</p>
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <Image className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Text
                  </button>
                  <button className="flex-1 flex items-center justify-center px-3 py-2 bg-[#0F4C2A] text-white rounded text-sm hover:bg-[#061A12]">
                    <Download className="h-4 w-4 mr-2" />
                    Download Image
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Social Media Tips */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Best Practices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Facebook Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Post during peak hours (2-4 PM)</li>
                  <li>Use eye-catching images and videos</li>
                  <li>Include your referral link in comments</li>
                  <li>Engage with comments quickly</li>
                </ul>
              </div>
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg">
                <h3 className="font-medium text-sky-900 mb-2">Twitter Tips</h3>
                <ul className="text-sm text-sky-800 space-y-1">
                  <li>Keep tweets under 280 characters</li>
                  <li>Use relevant hashtags (#EdTech #Africa)</li>
                  <li>Tag @EduMyles in your posts</li>
                  <li>Share success stories and testimonials</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">LinkedIn Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Focus on professional benefits</li>
                  <li>Share case studies and ROI data</li>
                  <li>Connect with school administrators</li>
                  <li>Write detailed, value-driven posts</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">WhatsApp Tips</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>Personalize messages for each recipient</li>
                  <li>Use broadcast lists for multiple contacts</li>
                  <li>Share short videos and screenshots</li>
                  <li>Follow up with interested prospects</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Templates Tab */}
      {activeTab === "email" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {emailTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-900 mb-2">{template.title}</h3>
                <p className="text-sm text-gray-600 mb-1">Subject: {template.subject}</p>
                <p className="text-sm text-gray-500 mb-4">{template.preview}</p>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{template.opens} opens</span>
                  <span>{template.clicks} clicks</span>
                  <span>{template.conversions} conversions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </button>
                  <button className="flex-1 flex items-center justify-center px-3 py-2 bg-[#0F4C2A] text-white rounded text-sm hover:bg-[#061A12]">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Material Downloads</h3>
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
              <p className="text-sm text-green-600">+15% from last month</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Link Shares</h3>
                <Share2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">567</p>
              <p className="text-sm text-green-600">+22% from last month</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Conversion Rate</h3>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">12.5%</p>
              <p className="text-sm text-green-600">+3% from last month</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Materials</h2>
            <div className="space-y-4">
              {marketingMaterials.slice(0, 5).map((material, index) => (
                <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#0F4C2A] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{material.title}</p>
                      <p className="text-sm text-gray-500">{material.downloads} downloads</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{material.downloads}</p>
                    <p className="text-sm text-gray-500">downloads</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
