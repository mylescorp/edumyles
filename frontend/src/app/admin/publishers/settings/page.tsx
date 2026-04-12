"use client";

import React, { useState } from "react";
import {
  Settings,
  Save,
  DollarSign,
  Award,
  Users,
  FileText,
  Shield,
  Bell,
  Mail,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Target,
  Code,
  Globe,
} from "lucide-react";

export default function PlatformPublisherSettings() {
  const [activeTab, setActiveTab] = useState("commission");
  const [hasChanges, setHasChanges] = useState(false);

  // Mock data - in real app this would come from Convex
  const commissionSettings = {
    tiers: {
      bronze: {
        rate: 15,
        minRevenue: 0,
        benefits: ["Basic support", "Standard commission", "Email support", "Module marketplace access"],
        requirements: ["Valid business registration", "Basic technical capability", "Code quality review"],
      },
      silver: {
        rate: 20,
        minRevenue: 50000,
        benefits: ["Priority support", "Enhanced commission", "Marketing materials", "Monthly reports", "Analytics dashboard"],
        requirements: ["Valid business registration", "Proven technical capability", "Code quality review", "3 months operation"],
      },
      gold: {
        rate: 25,
        minRevenue: 150000,
        benefits: ["Dedicated support", "Premium commission", "Advanced marketing", "Advanced analytics", "Co-branding opportunities", "Featured placement"],
        requirements: ["Valid business registration", "Advanced technical capability", "Code quality review", "1 year operation", "Minimum 10 modules"],
      },
      platinum: {
        rate: 30,
        minRevenue: 500000,
        benefits: ["24/7 support", "Maximum commission", "Full marketing suite", "Enterprise analytics", "Exclusive leads", "Partnership programs", "Custom integrations"],
        requirements: ["Valid business registration", "Enterprise technical capability", "Code quality review", "2 years operation", "Minimum 25 modules", "Proven track record"],
      },
      premium: {
        rate: 35,
        minRevenue: 1000000,
        benefits: ["White-glove support", "Maximum commission", "Custom marketing", "Enterprise analytics", "Exclusive territory", "Revenue sharing", "Strategic partnership", "API access"],
        requirements: ["Valid business registration", "Enterprise technical capability", "Code quality review", "3 years operation", "Minimum 50 modules", "Industry leadership", "Strategic alignment"],
      },
    },
    paymentSchedule: "monthly",
    minimumPayout: 25000,
    paymentMethod: "bank_transfer",
    taxWithholding: 5,
    revenueSplit: {
      publisher: 70,
      platform: 30,
    },
  };

  const applicationSettings = {
    autoApproveThreshold: "silver",
    requiredDocuments: ["business_registration", "technical_portfolio", "code_samples", "business_plan"],
    reviewProcess: "manual",
    codeReviewRequired: true,
    technicalAssessment: true,
    welcomeEmail: true,
    onboardingMaterials: true,
    probationPeriod: 90,
  };

  const moduleSettings = {
    approvalProcess: "manual",
    codeQualityCheck: true,
    securityReview: true,
    performanceTesting: true,
    categoryValidation: true,
    marketplaceListing: true,
    versionControl: true,
    updateFrequency: "biweekly",
  };

  const supportSettings = {
    responseTime: {
      bronze: "48 hours",
      silver: "24 hours",
      gold: "12 hours",
      platinum: "4 hours",
      premium: "1 hour",
    },
    supportChannels: ["email", "phone", "chat", "video"],
    escalationPolicy: true,
    knowledgeBase: true,
    trainingMaterials: true,
    technicalConsulting: true,
  };

  const notificationSettings = {
    newApplications: true,
    commissionPayouts: true,
    tierUpgrades: true,
    moduleApprovals: true,
    performanceReports: true,
    systemMaintenance: true,
    complianceAlerts: true,
    codeQualityIssues: true,
  };

  const handleSave = () => {
    // In real app, save to Convex
    setHasChanges(false);
    console.log("Saving publisher settings...");
  };

  const handleSettingChange = () => {
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publisher Settings</h1>
          <p className="text-gray-600">Configure publisher program settings and policies</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12] transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "commission", label: "Commission", icon: DollarSign },
            { id: "tiers", label: "Tier Management", icon: Award },
            { id: "applications", label: "Applications", icon: FileText },
            { id: "modules", label: "Module Management", icon: Code },
            { id: "support", label: "Support", icon: Users },
            { id: "notifications", label: "Notifications", icon: Bell },
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

      {/* Commission Settings */}
      {activeTab === "commission" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Structure</h2>
            <div className="space-y-6">
              {Object.entries(commissionSettings.tiers).map(([tier, settings]) => (
                <div key={tier} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Award className="h-5 w-5 text-gray-400" />
                      <h3 className="font-medium text-gray-900 capitalize">{tier} Tier</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <label className="block text-sm font-medium text-gray-700">Commission Rate</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={settings.rate}
                            onChange={handleSettingChange}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                            max="100"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <label className="block text-sm font-medium text-gray-700">Min Revenue</label>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">KES</span>
                          <input
                            type="number"
                            value={settings.minRevenue}
                            onChange={handleSettingChange}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                      <div className="space-y-1">
                        {settings.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm text-gray-600">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                      <div className="space-y-1">
                        {settings.requirements.map((requirement, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Target className="h-3 w-3 text-blue-500" />
                            <span className="text-sm text-gray-600">{requirement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Split Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publisher Share (%)</label>
                <input
                  type="number"
                  value={commissionSettings.revenueSplit.publisher}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Share (%)</label>
                <input
                  type="number"
                  value={commissionSettings.revenueSplit.platform}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Withholding (%)</label>
                <input
                  type="number"
                  value={commissionSettings.taxWithholding}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Schedule</label>
                <select
                  value={commissionSettings.paymentSchedule}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout (KES)</label>
                <input
                  type="number"
                  value={commissionSettings.minimumPayout}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={commissionSettings.paymentMethod}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="paypal">PayPal</option>
                  <option value="check">Check</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier Management */}
      {activeTab === "tiers" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tier Upgrade Rules</h2>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Automatic Upgrade Criteria</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      defaultChecked
                      onChange={handleSettingChange}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">Upgrade based on revenue achievement</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      defaultChecked
                      onChange={handleSettingChange}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">Upgrade based on module count</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      onChange={handleSettingChange}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">Upgrade based on user ratings</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      defaultChecked
                      onChange={handleSettingChange}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">Manual review for all upgrades</label>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Downgrade Policy</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      defaultChecked
                      onChange={handleSettingChange}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">Grace period of 3 months before downgrade</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      onChange={handleSettingChange}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">Automatic downgrade for non-performance</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      defaultChecked
                      onChange={handleSettingChange}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">Warning notifications before downgrade</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tier Benefits Management</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Marketing Support</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <label className="text-sm text-blue-800">Co-branded materials</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <label className="text-sm text-blue-800">Featured marketplace placement</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <label className="text-sm text-blue-800">Advertising budget</label>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Technical Support</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <label className="text-sm text-green-800">24/7 support for premium tiers</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <label className="text-sm text-green-800">Dedicated technical consultant</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <label className="text-sm text-green-800">Priority bug fixes</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Processing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Approve Threshold</label>
                <select
                  value={applicationSettings.autoApproveThreshold}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                >
                  <option value="none">No auto-approval</option>
                  <option value="bronze">Bronze and above</option>
                  <option value="silver">Silver and above</option>
                  <option value="gold">Gold and above</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Process</label>
                <select
                  value={applicationSettings.reviewProcess}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                >
                  <option value="manual">Manual review</option>
                  <option value="automated">Automated review</option>
                  <option value="hybrid">Hybrid approach</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Probation Period (days)</label>
                <input
                  type="number"
                  value={applicationSettings.probationPeriod}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                  min="0"
                  max="365"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h2>
            <div className="space-y-3">
              {[
                { id: "business_registration", label: "Business Registration Certificate", required: true },
                { id: "technical_portfolio", label: "Technical Portfolio", required: true },
                { id: "code_samples", label: "Code Samples", required: true },
                { id: "business_plan", label: "Business Plan", required: false },
                { id: "financial_statements", label: "Financial Statements", required: false },
                { id: "references", label: "Technical References", required: false },
              ].map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{doc.label}</span>
                    {doc.required && <span className="text-xs text-red-600">Required</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      defaultChecked={applicationSettings.requiredDocuments.includes(doc.id)}
                      onChange={handleSettingChange}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">Required</label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Assessment</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Code Review Required</p>
                  <p className="text-sm text-gray-500">All applicants must pass code quality review</p>
                </div>
                <button
                  onClick={handleSettingChange}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                    applicationSettings.codeReviewRequired ? "bg-[#0F4C2A]" : "bg-gray-200"
                  }`}
                >
                  <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                    applicationSettings.codeReviewRequired ? "translate-x-5" : ""
                  }`}></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Technical Assessment</p>
                  <p className="text-sm text-gray-500">Evaluate technical capabilities and expertise</p>
                </div>
                <button
                  onClick={handleSettingChange}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                    applicationSettings.technicalAssessment ? "bg-[#0F4C2A]" : "bg-gray-200"
                  }`}
                >
                  <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                    applicationSettings.technicalAssessment ? "translate-x-5" : ""
                  }`}></span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Welcome Email</p>
                  <p className="text-sm text-gray-500">Send automatic welcome email to approved publishers</p>
                </div>
                <button
                  onClick={handleSettingChange}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                    applicationSettings.welcomeEmail ? "bg-[#0F4C2A]" : "bg-gray-200"
                  }`}
                >
                  <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                    applicationSettings.welcomeEmail ? "translate-x-5" : ""
                  }`}></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Onboarding Materials</p>
                  <p className="text-sm text-gray-500">Provide access to developer resources and documentation</p>
                </div>
                <button
                  onClick={handleSettingChange}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                    applicationSettings.onboardingMaterials ? "bg-[#0F4C2A]" : "bg-gray-200"
                  }`}
                >
                  <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                    applicationSettings.onboardingMaterials ? "translate-x-5" : ""
                  }`}></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Management */}
      {activeTab === "modules" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Approval Process</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Process</label>
                <select
                  value={moduleSettings.approvalProcess}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                >
                  <option value="manual">Manual review</option>
                  <option value="automated">Automated approval</option>
                  <option value="hybrid">Hybrid approach</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Frequency</label>
                <select
                  value={moduleSettings.updateFrequency}
                  onChange={handleSettingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0F4C2A] focus:border-[#0F4C2A]"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quality Assurance</h2>
            <div className="space-y-4">
              {[
                { id: "codeQualityCheck", label: "Code Quality Check", description: "Automated code quality analysis" },
                { id: "securityReview", label: "Security Review", description: "Security vulnerability assessment" },
                { id: "performanceTesting", label: "Performance Testing", description: "Load and performance testing" },
                { id: "categoryValidation", label: "Category Validation", description: "Ensure proper categorization" },
                { id: "marketplaceListing", label: "Marketplace Listing", description: "Automatic marketplace placement" },
                { id: "versionControl", label: "Version Control", description: "Version management and rollback" },
              ].map((check) => (
                <div key={check.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{check.label}</p>
                    <p className="text-sm text-gray-500">{check.description}</p>
                  </div>
                  <button
                    onClick={handleSettingChange}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                      moduleSettings[check.id as keyof typeof moduleSettings] ? "bg-[#0F4C2A]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                      moduleSettings[check.id as keyof typeof moduleSettings] ? "translate-x-5" : ""
                    }`}></span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Support */}
      {activeTab === "support" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Support Level Agreements</h2>
            <div className="space-y-4">
              {Object.entries(supportSettings.responseTime).map(([tier, responseTime]) => (
                <div key={tier} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 capitalize">{tier} Tier</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Response Time:</span>
                    <input
                      type="text"
                      value={responseTime}
                      onChange={handleSettingChange}
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Support Channels</h2>
            <div className="space-y-3">
              {[
                { id: "email", label: "Email Support", icon: Mail },
                { id: "phone", label: "Phone Support", icon: Users },
                { id: "chat", label: "Live Chat", icon: Users },
                { id: "video", label: "Video Support", icon: Users },
                { id: "technical_consulting", label: "Technical Consulting", icon: Code },
              ].map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <channel.icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{channel.label}</span>
                  </div>
                  <button
                    onClick={handleSettingChange}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                      supportSettings.supportChannels.includes(channel.id) ? "bg-[#0F4C2A]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                      supportSettings.supportChannels.includes(channel.id) ? "translate-x-5" : ""
                    }`}></span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Support Policies</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Escalation Policy</p>
                  <p className="text-sm text-gray-500">Enable automatic escalation for unresolved issues</p>
                </div>
                <button
                  onClick={handleSettingChange}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                    supportSettings.escalationPolicy ? "bg-[#0F4C2A]" : "bg-gray-200"
                  }`}
                >
                  <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                    supportSettings.escalationPolicy ? "translate-x-5" : ""
                  }`}></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
          <div className="space-y-4">
            {[
              { id: "newApplications", label: "New Publisher Applications", description: "Notify when new applications are submitted" },
              { id: "commissionPayouts", label: "Commission Payouts", description: "Notify about upcoming and completed payouts" },
              { id: "tierUpgrades", label: "Tier Upgrades", description: "Notify when publishers upgrade or downgrade tiers" },
              { id: "moduleApprovals", label: "Module Approvals", description: "Notify about module submissions and approvals" },
              { id: "performanceReports", label: "Performance Reports", description: "Send monthly performance summaries" },
              { id: "systemMaintenance", label: "System Maintenance", description: "Notify about scheduled maintenance" },
              { id: "complianceAlerts", label: "Compliance Alerts", description: "Alert about compliance issues or expirations" },
              { id: "codeQualityIssues", label: "Code Quality Issues", description: "Alert about code quality problems" },
            ].map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{notification.label}</p>
                  <p className="text-sm text-gray-500">{notification.description}</p>
                </div>
                <button
                  onClick={handleSettingChange}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-gray-300 rounded-full cursor-pointer transition-colors ${
                    notificationSettings[notification.id as keyof typeof notificationSettings] ? "bg-[#0F4C2A]" : "bg-gray-200"
                  }`}
                >
                  <span className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform ${
                    notificationSettings[notification.id as keyof typeof notificationSettings] ? "translate-x-5" : ""
                  }`}></span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Settings Impact</h3>
            <p className="text-sm text-blue-800 mt-1">
              Changes to publisher settings will affect all current and future publishers. Commission changes will be applied prospectively.
              Tier changes may impact existing publishers based on current performance metrics and module quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
