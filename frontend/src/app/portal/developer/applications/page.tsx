"use client";

import React, { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Download,
  Upload,
  Calendar,
  User,
  Building2,
} from "lucide-react";

export default function DeveloperApplications() {
  const [activeTab, setActiveTab] = useState("current");
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Mock data - in real app this would come from Convex
  const currentApplication = {
    id: 1,
    businessName: "TechEdu Solutions",
    businessType: "company",
    status: "approved",
    tier: "verified",
    submittedAt: "2023-06-15T10:30:00Z",
    reviewedAt: "2023-06-18T14:45:00Z",
    modules: ["Attendance Management", "Fee Collection", "Exam Management"],
    experience: "5+ years in educational software development",
    website: "https://techedu.example.com",
    country: "Kenya",
  };

  const pastApplications = [
    {
      id: 2,
      businessName: "EduTech Kenya",
      businessType: "individual",
      status: "rejected",
      tier: null,
      submittedAt: "2023-03-10T09:15:00Z",
      reviewedAt: "2023-03-12T16:30:00Z",
      reason: "Insufficient development experience",
      modules: ["Library Management"],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "withdrawn":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "indie":
        return "bg-gray-100 text-gray-800";
      case "verified":
        return "bg-blue-100 text-blue-800";
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600">Track your publisher application status</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "current", label: "Current Application", icon: FileText },
            { id: "past", label: "Past Applications", icon: Calendar },
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

      {/* Current Application */}
      {activeTab === "current" && (
        <div className="space-y-6">
          {currentApplication ? (
            <>
              {/* Application Status Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Publisher Application</h2>
                    <p className="text-gray-600">Application #{currentApplication.id}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentApplication.status)}`}>
                      {getStatusIcon(currentApplication.status)}
                      <span className="ml-1">
                        {currentApplication.status.charAt(0).toUpperCase() + currentApplication.status.slice(1)}
                      </span>
                    </span>
                    {currentApplication.tier && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierColor(currentApplication.tier)}`}>
                        {currentApplication.tier.charAt(0).toUpperCase() + currentApplication.tier.slice(1)} Tier
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#0F4C2A] rounded-full flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Application Submitted</h3>
                      <p className="text-sm text-gray-600">Your application was received and is under review</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(currentApplication.submittedAt).toLocaleDateString()} at {new Date(currentApplication.submittedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Application Approved</h3>
                      <p className="text-sm text-gray-600">Congratulations! Your application has been approved</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(currentApplication.reviewedAt).toLocaleDateString()} at {new Date(currentApplication.reviewedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Business Name:</dt>
                        <dd className="text-sm font-medium text-gray-900">{currentApplication.businessName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Business Type:</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {currentApplication.businessType.charAt(0).toUpperCase() + currentApplication.businessType.slice(1)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Country:</dt>
                        <dd className="text-sm font-medium text-gray-900">{currentApplication.country}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Website:</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          <a href={currentApplication.website} target="_blank" rel="noopener noreferrer" className="text-[#0F4C2A] hover:underline">
                            {currentApplication.website}
                          </a>
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Application Content</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-600">Experience:</dt>
                        <dd className="text-sm font-medium text-gray-900 mt-1">{currentApplication.experience}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Modules to Develop:</dt>
                        <dd className="text-sm font-medium text-gray-900 mt-1">
                          <div className="flex flex-wrap gap-1">
                            {currentApplication.modules.map((module) => (
                              <span key={module} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                {module}
                              </span>
                            ))}
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Application
                  </button>
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </button>
                  <button className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]">
                    <Upload className="h-4 w-4 mr-2" />
                    Request Tier Upgrade
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Application</h3>
              <p className="text-gray-600 mb-6">You haven't submitted a publisher application yet.</p>
              <button className="flex items-center px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]">
                <Plus className="h-4 w-4 mr-2" />
                Submit Application
              </button>
            </div>
          )}
        </div>
      )}

      {/* Past Applications */}
      {activeTab === "past" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Applications</h2>
            {pastApplications.length > 0 ? (
              <div className="space-y-4">
                {pastApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{application.businessName}</h3>
                        <p className="text-sm text-gray-600">Application #{application.id}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span className="ml-1">
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {application.businessType.charAt(0).toUpperCase() + application.businessType.slice(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Submitted:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(application.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reviewed:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(application.reviewedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {application.reason && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Reason:</span> {application.reason}
                        </p>
                      </div>
                    )}
                    <div className="mt-3 flex justify-end space-x-2">
                      <button className="flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <button className="flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No past applications found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
