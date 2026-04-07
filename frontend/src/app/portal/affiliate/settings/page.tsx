"use client";

import React, { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Key,
  Globe,
  CreditCard,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  Mail,
  Phone,
  MapPin,
  Link2,
} from "lucide-react";

export default function AffiliateSettings() {
  const [activeSection, setActiveSection] = useState("general");
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Mock data - in real app this would come from Convex
  const settings = {
    notifications: {
      emailUpdates: true,
      marketingEmails: false,
      referralNotifications: true,
      paymentAlerts: true,
      securityAlerts: true,
    },
    api: {
      webhookUrl: "https://your-app.com/webhook",
      apiKey: "sk_affiliate_4242424242424242",
      apiSecret: "sk_secret_4242424242424242",
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: "24h",
      loginNotifications: true,
      apiAccess: true,
    },
    data: {
      exportFormat: "csv",
      dataRetention: "2y",
      analyticsSharing: true,
    },
    payout: {
      method: "bank_transfer",
      bankName: "Equity Bank Kenya",
      accountName: "John Affiliate",
      accountNumber: "1234567890",
      branchCode: "001",
      minimumPayout: 5000,
      payoutFrequency: "monthly",
    },
  };

  const [formData, setFormData] = useState(settings);

  const handleToggle = (section: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: !prev[section as keyof typeof prev][field as keyof typeof prev[keyof typeof prev]],
      },
    }));
  };

  const handleChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    // In real app, save to Convex
    console.log("Saving settings...", formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your affiliate account settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12] transition-colors"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <nav className="space-y-1">
              {[
                { id: "general", label: "General", icon: Settings },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "payout", label: "Payout Settings", icon: CreditCard },
                { id: "api", label: "API & Webhooks", icon: Key },
                { id: "security", label: "Security", icon: Shield },
                { id: "data", label: "Data & Privacy", icon: Download },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${activeSection === item.id
                      ? 'bg-[#0F4C2A] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* General Settings */}
          {activeSection === "general" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Language</label>
                  <select
                    value="english"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  >
                    <option value="english">English</option>
                    <option value="swahili">Swahili</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value="eastafrica"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  >
                    <option value="eastafrica">East Africa Time (EAT)</option>
                    <option value="utc">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                  <select
                    value="ddmmyyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  >
                    <option value="ddmmyyyy">DD/MM/YYYY</option>
                    <option value="mmddyyyy">MM/DD/YYYY</option>
                    <option value="yyyymmdd">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Email Updates</p>
                    <p className="text-sm text-gray-500">Receive important updates about your account</p>
                  </div>
                  <button
                    onClick={() => handleToggle("notifications", "emailUpdates")}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                      formData.notifications.emailUpdates ? "bg-[#0F4C2A]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                      formData.notifications.emailUpdates ? "translate-x-5" : ""
                    }`}></span>
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Marketing Emails</p>
                    <p className="text-sm text-gray-500">Receive promotional emails and newsletters</p>
                  </div>
                  <button
                    onClick={() => handleToggle("notifications", "marketingEmails")}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                      formData.notifications.marketingEmails ? "bg-[#0F4C2A]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                      formData.notifications.marketingEmails ? "translate-x-5" : ""
                    }`}></span>
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Referral Notifications</p>
                    <p className="text-sm text-gray-500">Get notified about new referrals and conversions</p>
                  </div>
                  <button
                    onClick={() => handleToggle("notifications", "referralNotifications")}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                      formData.notifications.referralNotifications ? "bg-[#0F4C2A]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                      formData.notifications.referralNotifications ? "translate-x-5" : ""
                    }`}></span>
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Payment Alerts</p>
                    <p className="text-sm text-gray-500">Receive alerts about payments and earnings</p>
                  </div>
                  <button
                    onClick={() => handleToggle("notifications", "paymentAlerts")}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                      formData.notifications.paymentAlerts ? "bg-[#0F4C2A]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                      formData.notifications.paymentAlerts ? "translate-x-5" : ""
                    }`}></span>
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">Security Alerts</p>
                    <p className="text-sm text-gray-500">Get notified about security-related activities</p>
                  </div>
                  <button
                    onClick={() => handleToggle("notifications", "securityAlerts")}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                      formData.notifications.securityAlerts ? "bg-[#0F4C2A]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                      formData.notifications.securityAlerts ? "translate-x-5" : ""
                    }`}></span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payout Settings */}
          {activeSection === "payout" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payout Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Method</label>
                    <select
                      value={formData.payout.method}
                      onChange={(e) => handleChange("payout", "method", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="paypal">PayPal</option>
                      <option value="check">Check</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.payout.bankName}
                      onChange={(e) => handleChange("payout", "bankName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={formData.payout.accountName}
                      onChange={(e) => handleChange("payout", "accountName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.payout.accountNumber}
                      onChange={(e) => handleChange("payout", "accountNumber", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                    <input
                      type="text"
                      value={formData.payout.branchCode}
                      onChange={(e) => handleChange("payout", "branchCode", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payout Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout Amount (KES)</label>
                    <input
                      type="number"
                      value={formData.payout.minimumPayout}
                      onChange={(e) => handleChange("payout", "minimumPayout", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Frequency</label>
                    <select
                      value={formData.payout.payoutFrequency}
                      onChange={(e) => handleChange("payout", "payoutFrequency", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API & Webhooks */}
          {activeSection === "api" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type={showApiKeys ? "text" : "password"}
                        value={formData.api.apiKey}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => setShowApiKeys(!showApiKeys)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Upload className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="password"
                        value={formData.api.apiSecret}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Upload className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                      <Key className="h-4 w-4 mr-2" />
                      Generate New Keys
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhooks</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                    <input
                      type="url"
                      value={formData.api.webhookUrl}
                      onChange={(e) => handleChange("api", "webhookUrl", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                      placeholder="https://your-app.com/webhook"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Webhook Events</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        New referral signup
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Referral conversion
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Payment processed
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Session Timeout</p>
                    <p className="text-sm text-gray-500">Automatically log out after period of inactivity</p>
                  </div>
                  <select
                    value={formData.security.sessionTimeout}
                    onChange={(e) => handleChange("security", "sessionTimeout", e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="1h">1 hour</option>
                    <option value="8h">8 hours</option>
                    <option value="24h">24 hours</option>
                    <option value="1w">1 week</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Login Notifications</p>
                    <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
                  </div>
                  <button
                    onClick={() => handleToggle("security", "loginNotifications")}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                      formData.security.loginNotifications ? "bg-[#0F4C2A]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                      formData.security.loginNotifications ? "translate-x-5" : ""
                    }`}></span>
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">API Access</p>
                    <p className="text-sm text-gray-500">Allow API access to your account</p>
                  </div>
                  <button
                    onClick={() => handleToggle("security", "apiAccess")}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                      formData.security.apiAccess ? "bg-[#0F4C2A]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                      formData.security.apiAccess ? "translate-x-5" : ""
                    }`}></span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data & Privacy */}
          {activeSection === "data" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
                  <select
                    value={formData.data.exportFormat}
                    onChange={(e) => handleChange("data", "exportFormat", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="xlsx">Excel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Retention</label>
                  <select
                    value={formData.data.dataRetention}
                    onChange={(e) => handleChange("data", "dataRetention", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  >
                    <option value="6m">6 months</option>
                    <option value="1y">1 year</option>
                    <option value="2y">2 years</option>
                    <option value="5y">5 years</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Analytics Sharing</p>
                    <p className="text-sm text-gray-500">Share anonymous usage data to improve our services</p>
                  </div>
                  <button
                    onClick={() => handleToggle("data", "analyticsSharing")}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                      formData.data.analyticsSharing ? "bg-[#0F4C2A]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                      formData.data.analyticsSharing ? "translate-x-5" : ""
                    }`}></span>
                  </button>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Data Management</h3>
                  <div className="space-y-2">
                    <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </button>
                    <button className="flex items-center px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
