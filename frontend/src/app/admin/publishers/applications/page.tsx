"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  Download,
  MoreVertical,
  TrendingUp,
  Award,
  Code,
  Globe,
} from "lucide-react";

export default function PlatformPublisherApplications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Mock data - in real app this would come from Convex
  const applications = [
    {
      id: 1,
      applicationId: "PA-2024-001",
      companyName: "InnovateEd Solutions",
      businessType: "business",
      contactPerson: "Michael Kamau",
      email: "michael.kamau@innovateed.co.ke",
      phone: "+254 712 345 678",
      address: "123 Mombasa Road, Nairobi, Kenya",
      website: "https://innovateed.co.ke",
      status: "pending_review",
      submittedAt: "2024-01-20T10:30:00Z",
      reviewedAt: null,
      reviewedBy: null,
      businessDescription: "We specialize in creating innovative educational technology solutions for Kenyan schools. Our team of experienced developers and educators work together to create engaging and effective learning modules.",
      technicalExpertise: "React, Node.js, Python, Machine Learning, Educational Psychology",
      targetAudience: "Primary and secondary schools, focusing on STEM subjects",
      proposedModules: [
        { name: "MathMaster Pro", category: "Mathematics", description: "Interactive math learning platform" },
        { name: "ScienceLab VR", category: "Science", description: "Virtual reality science laboratory" },
        { name: "LanguageLearn AI", category: "Languages", description: "AI-powered language learning assistant" },
      ],
      developmentCapacity: {
        teamSize: 8,
        experience: "5+ years",
        completedProjects: 25,
        technologies: ["React", "Node.js", "Python", "MongoDB", "AWS"],
      },
      documents: {
        businessRegistration: "uploaded",
        technicalPortfolio: "uploaded",
        codeSamples: "uploaded",
        businessPlan: "uploaded",
      },
      reviewerNotes: "",
    },
    {
      id: 2,
      applicationId: "PA-2024-002",
      companyName: "Digital Learning Kenya",
      businessType: "partnership",
      contactPerson: "Sarah Wanjiru",
      email: "sarah.wanjiru@digitalkenya.co.ke",
      phone: "+254 723 456 789",
      address: "456 Thika Road, Nairobi, Kenya",
      website: "https://digitalkenya.co.ke",
      status: "approved",
      submittedAt: "2024-01-18T14:15:00Z",
      reviewedAt: "2024-01-19T09:30:00Z",
      reviewedBy: "John Smith",
      businessDescription: "A partnership of educators and technologists dedicated to transforming education in Kenya through innovative digital solutions.",
      technicalExpertise: "Full-stack development, Mobile apps, Cloud architecture, Educational design",
      targetAudience: "K-12 schools, with focus on rural and underserved areas",
      proposedModules: [
        { name: "Rural Classroom", category: "General", description: "Offline-first learning platform for rural schools" },
        { name: "Teacher Assistant", category: "Tools", description: "AI-powered teaching assistant" },
      ],
      developmentCapacity: {
        teamSize: 5,
        experience: "3+ years",
        completedProjects: 15,
        technologies: ["React Native", "Firebase", "Node.js", "PostgreSQL"],
      },
      documents: {
        businessRegistration: "uploaded",
        technicalPortfolio: "uploaded",
        codeSamples: "uploaded",
        businessPlan: "uploaded",
      },
      reviewerNotes: "Strong technical team with good understanding of educational needs. Approved for silver tier.",
    },
    {
      id: 3,
      applicationId: "PA-2024-003",
      companyName: "CodeCraft Education",
      businessType: "individual",
      contactPerson: "David Ochieng",
      email: "david.ochieng@codecraft.co.ke",
      phone: "+254 734 567 890",
      address: "789 Kisumu Road, Kisumu, Kenya",
      website: "",
      status: "rejected",
      submittedAt: "2024-01-15T16:20:00Z",
      reviewedAt: "2024-01-16T11:45:00Z",
      reviewedBy: "Mary Johnson",
      businessDescription: "Individual developer passionate about creating educational tools for Kenyan students.",
      technicalExpertise: "JavaScript, React, Python, Django",
      targetAudience: "High school students, focusing on programming and computer science",
      proposedModules: [
        { name: "Programming Basics", category: "Computer Science", description: "Introduction to programming for beginners" },
      ],
      developmentCapacity: {
        teamSize: 1,
        experience: "2 years",
        completedProjects: 5,
        technologies: ["JavaScript", "React", "Python", "Django"],
      },
      documents: {
        businessRegistration: "not_applicable",
        technicalPortfolio: "uploaded",
        codeSamples: "uploaded",
        businessPlan: "uploaded",
      },
      reviewerNotes: "Limited development capacity and insufficient experience for partnership program.",
    },
    {
      id: 4,
      applicationId: "PA-2024-004",
      companyName: "EduTech Innovations Africa",
      businessType: "corporation",
      contactPerson: "Grace Mwangi",
      email: "grace.mwangi@edutech.africa",
      phone: "+254 745 678 901",
      address: "321 Westlands, Nairobi, Kenya",
      website: "https://edutech.africa",
      status: "pending_information",
      submittedAt: "2024-01-22T09:45:00Z",
      reviewedAt: null,
      reviewedBy: null,
      businessDescription: "Leading educational technology company with presence in 5 African countries. We provide comprehensive digital learning solutions for modern schools.",
      technicalExpertise: "Enterprise architecture, Cloud computing, AI/ML, Mobile development, Web applications",
      targetAudience: "International schools, large school chains, educational institutions",
      proposedModules: [
        { name: "Enterprise LMS", category: "Management", description: "Learning management system for large institutions" },
        { name: "AI Tutor", category: "AI", description: "Personalized AI tutoring system" },
        { name: "Virtual Classroom", category: "Communication", description: "Complete virtual classroom solution" },
      ],
      developmentCapacity: {
        teamSize: 25,
        experience: "10+ years",
        completedProjects: 100,
        technologies: ["React", "Angular", "Vue.js", "Node.js", "Python", "AWS", "Azure", "GCP"],
      },
      documents: {
        businessRegistration: "uploaded",
        technicalPortfolio: "uploaded",
        codeSamples: "pending",
        businessPlan: "uploaded",
      },
      reviewerNotes: "Impressive background and capacity, but missing code samples for review.",
    },
  ];

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review":
        return "bg-yellow-100 text-yellow-800";
      case "pending_information":
        return "bg-orange-100 text-orange-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_review":
        return <Clock className="h-4 w-4" />;
      case "pending_information":
        return <AlertCircle className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "under_review":
        return <Eye className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case "uploaded":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "not_applicable":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  const stats = {
    totalApplications: applications.length,
    pendingReview: applications.filter(a => a.status === "pending_review").length,
    pendingInformation: applications.filter(a => a.status === "pending_information").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publisher Applications</h1>
          <p className="text-gray-600">Review and manage publisher partnership applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalApplications}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingReview}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Info</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingInformation}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
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
                placeholder="Search applications..."
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
            <option value="pending_review">Pending Review</option>
            <option value="pending_information">Pending Information</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modules
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{application.companyName}</div>
                      <div className="text-xs text-gray-500">{application.applicationId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{application.contactPerson}</div>
                      <div className="text-xs text-gray-500">{application.email}</div>
                      <div className="text-xs text-gray-500">{application.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {application.businessType.charAt(0).toUpperCase() + application.businessType.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      <span className="ml-1">
                        {application.status.replace("_", " ").charAt(0).toUpperCase() + application.status.slice(1).replace("_", " ")}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{application.proposedModules.length}</div>
                    <div className="text-xs text-gray-500">proposed</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {Object.entries(application.documents).map(([docType, status]) => (
                        <div
                          key={docType}
                          className={`w-2 h-2 rounded-full ${status === "uploaded" ? "bg-green-500" : status === "pending" ? "bg-yellow-500" : "bg-red-500"}`}
                          title={docType.replace("_", " ")}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
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

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedApplication(null)} />
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{selectedApplication.companyName}</h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Application ID:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedApplication.applicationId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Business Type:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{selectedApplication.businessType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Contact Person:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedApplication.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedApplication.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedApplication.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Address:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedApplication.address}</span>
                    </div>
                    {selectedApplication.website && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Website:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedApplication.website}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Submitted:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedApplication.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedApplication.reviewedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Reviewed:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(selectedApplication.reviewedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedApplication.reviewedBy && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Reviewed By:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedApplication.reviewedBy}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Development Capacity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Development Capacity</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Team Size:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedApplication.developmentCapacity.teamSize} developers</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Experience:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedApplication.developmentCapacity.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completed Projects:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedApplication.developmentCapacity.completedProjects}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Technologies:</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.developmentCapacity.technologies.map((tech, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedApplication.businessDescription}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Technical Expertise</label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedApplication.technicalExpertise}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedApplication.targetAudience}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proposed Modules */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposed Modules</h3>
                <div className="space-y-3">
                  {selectedApplication.proposedModules.map((module, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{module.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {module.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedApplication.documents).map(([docType, status]) => (
                    <div key={docType} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {docType.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentStatusColor(status)}`}>
                          {status.replace("_", " ")}
                        </span>
                        {status === "uploaded" && (
                          <button className="text-gray-400 hover:text-gray-600">
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Notes */}
              {selectedApplication.reviewerNotes && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedApplication.reviewerNotes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedApplication.status === "pending_review" && (
                  <>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <XCircle className="h-4 w-4 mr-2 inline" />
                      Reject
                    </button>
                    <button className="px-4 py-2 bg-[#0F4C2A] text-white rounded-lg hover:bg-[#061A12]">
                      <CheckCircle className="h-4 w-4 mr-2 inline" />
                      Approve
                    </button>
                  </>
                )}
                {selectedApplication.status === "pending_information" && (
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    <AlertCircle className="h-4 w-4 mr-2 inline" />
                      Request Information
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
