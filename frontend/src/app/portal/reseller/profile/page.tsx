"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  CreditCard,
  Settings,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Store,
  Award,
  TrendingUp,
} from "lucide-react";

export default function ResellerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Mock data - in real app this would come from Convex
  const profileData = {
    companyName: "TechReseller Kenya",
    businessType: "business",
    email: "info@techreseller.co.ke",
    phone: "+254 743 993 715",
    address: "123 Westlands, Nairobi, Kenya",
    country: "Kenya",
    website: "https://techreseller.co.ke",
    socialMedia: {
      facebook: "https://facebook.com/techresellerkenya",
      twitter: "@techresellerke",
      linkedin: "https://linkedin.com/company/techreseller-kenya",
    },
    joinedDate: "2023-04-01",
    status: "active",
    tier: "premium",
    totalRevenue: 456000,
    totalOrders: 567,
    averageOrderValue: 800,
    customerCount: 234,
    referralCode: "TECH123",
    commissionRate: 15,
  };

  const [formData, setFormData] = useState(profileData);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }));
  };

  const handleSave = () => {
    // In real app, save to Convex
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "suspended":
        return "bg-red-100 text-red-800";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your reseller business profile and account settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "verification", label: "Verification", icon: Shield },
            { id: "billing", label: "Billing", icon: CreditCard },
            { id: "settings", label: "Settings", icon: Settings },
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

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-[#0F4C2A] rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                    <Store className="h-8 w-8" />
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-1 bg-[#0F4C2A] text-white rounded-full hover:bg-[#061A12]">
                      <Camera className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{profileData.companyName}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(profileData.tier)}`}>
                      {profileData.tier.charAt(0).toUpperCase() + profileData.tier.slice(1)} Tier
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(profileData.status)}`}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {profileData.status.charAt(0).toUpperCase() + profileData.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Member since {new Date(profileData.joinedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{profileData.totalOrders}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">KES {profileData.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{profileData.customerCount}</p>
                <p className="text-sm text-gray-600">Customers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{profileData.commissionRate}%</p>
                <p className="text-sm text-gray-600">Commission Rate</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleInputChange("businessType", e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A] disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="business">Business</option>
                  <option value="individual">Individual</option>
                  <option value="partnership">Partnership</option>
                  <option value="corporation">Corporation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A] disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Social Media Profiles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => handleSocialMediaChange("facebook", e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                  <input
                    type="text"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => handleSocialMediaChange("twitter", e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.socialMedia.linkedin}
                    onChange={(e) => handleSocialMediaChange("linkedin", e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A] disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Tab */}
      {activeTab === "verification" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Business Registration</p>
                    <p className="text-sm text-gray-500">Verified on April 1, 2023</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Verified</span>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Tax Compliance</p>
                    <p className="text-sm text-gray-500">Verified on April 5, 2023</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Verified</span>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">Bank Account Verification</p>
                    <p className="text-sm text-gray-500">Upload bank statement</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-[#0F4C2A] text-white text-xs font-medium rounded hover:bg-[#061A12]">
                  Upload
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Information</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-blue-900">Current Tier: Premium</h4>
                  <p className="text-sm text-blue-700">15% commission rate with premium benefits</p>
                </div>
                <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">
                  Upgrade to Platinum
                </button>
              </div>
              <div className="space-y-2 text-sm text-blue-800">
                <p>Benefits:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>15% commission on all sales</li>
                  <li>Priority customer support</li>
                  <li>Advanced analytics dashboard</li>
                  <li>Co-marketing opportunities</li>
                  <li>Exclusive product access</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Badges</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="font-medium text-yellow-900">Top Performer</p>
                <p className="text-sm text-yellow-700">Q4 2023</p>
              </div>
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-green-900">Fast Growing</p>
                <p className="text-sm text-green-700">+45% growth</p>
              </div>
              <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <Store className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium text-purple-900">Trusted Partner</p>
                <p className="text-sm text-purple-700">2+ years</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h3>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Billing and payment features coming soon</p>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive updates about orders and customers</p>
              </div>
              <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer bg-[#0F4C2A] transition-colors">
                <span className="translate-x-5 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform"></span>
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Marketing Emails</p>
                <p className="text-sm text-gray-500">Receive promotional emails from EduMyles</p>
              </div>
              <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer bg-gray-200 transition-colors">
                <span className="translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform"></span>
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
