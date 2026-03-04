"use client";

import { useState } from "react";

const userPanels = [
  {
    id: "master-admin",
    title: "Master Admin",
    description: "Platform-level administration for all tenants and system management",
    icon: "👑",
    color: "bg-purple-500",
    href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://edumyles.vercel.app'}/auth/bypass/platform`,
    features: [
      "Multi-tenant management",
      "Platform analytics", 
      "System configuration",
      "Tenant billing"
    ]
  },
  {
    id: "admin",
    title: "School Admin",
    description: "School-level administration for students, staff, and operations",
    icon: "🏫",
    color: "bg-blue-500", 
    href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://edumyles.vercel.app'}/auth/bypass/admin`,
    features: [
      "Student management",
      "Staff administration",
      "Academic oversight",
      "Finance & billing"
    ]
  },
  {
    id: "teacher",
    title: "Teacher",
    description: "Classroom management, grading, and student engagement tools",
    icon: "👨‍🏫",
    color: "bg-green-500",
    href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://edumyles.vercel.app'}/auth/bypass/teacher`,
    features: [
      "Class management",
      "Gradebook & assignments",
      "Attendance tracking",
      "Student communication"
    ]
  },
  {
    id: "student",
    title: "Student",
    description: "Personal dashboard for academics, assignments, and school life",
    icon: "🎓",
    color: "bg-indigo-500",
    href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://edumyles.vercel.app'}/auth/bypass/student`, 
    features: [
      "View grades & assignments",
      "Track attendance",
      "E-wallet management",
      "School announcements"
    ]
  },
  {
    id: "parent",
    title: "Parent",
    description: "Monitor children's progress, fees, and school communications",
    icon: "👨‍👩‍👧‍👦",
    color: "bg-orange-500",
    href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://edumyles.vercel.app'}/auth/bypass/parent`,
    features: [
      "Children's academic progress",
      "Fee management",
      "School communications",
      "Attendance monitoring"
    ]
  },
  {
    id: "alumni",
    title: "Alumni",
    description: "Stay connected with alma mater and access alumni services",
    icon: "🎓",
    color: "bg-pink-500",
    href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://edumyles.vercel.app'}/auth/bypass/alumni`,
    features: [
      "Alumni directory",
      "Transcript requests",
      "Event management",
      "Networking tools"
    ]
  },
  {
    id: "partner",
    title: "Partner",
    description: "External partner collaboration and resource management",
    icon: "🤝",
    color: "bg-teal-500",
    href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://edumyles.vercel.app'}/auth/bypass/partner`,
    features: [
      "Resource sharing",
      "Collaboration tools",
      "Partnership management",
      "Service delivery"
    ]
  }
];

export default function UserPanelsPage() {
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">EduMyles User Panels</h1>
              <p className="mt-2 text-gray-600">
                Explore all user dashboards and their capabilities
              </p>
            </div>
            <a 
              href="/"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Landing
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Complete User Experience Overview
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Click on any panel below to access that user's dashboard directly. 
            Each panel is designed for specific user roles with tailored features and permissions.
          </p>
        </div>

        {/* Panels Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {userPanels.map((panel) => (
            <a
              key={panel.id}
              href={panel.href}
              className="group"
              onMouseEnter={() => setHoveredPanel(panel.id)}
              onMouseLeave={() => setHoveredPanel(null)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
                {/* Header */}
                <div className={`${panel.color} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{panel.icon}</span>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      Direct Access
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{panel.title}</h3>
                  <p className="text-white/90 text-sm">{panel.description}</p>
                </div>

                {/* Features */}
                <div className="p-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                    {panel.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hover Action */}
                  <div className={`mt-6 text-center transition-all duration-300 ${
                    hoveredPanel === panel.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
                      <span>Access Dashboard</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-blue-50 rounded-xl p-8 border border-blue-200">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              🔓 Bypass Authentication for Demo
            </h3>
            <p className="text-blue-700 max-w-2xl mx-auto">
              These panels are configured for direct access without OAuth authentication, 
              allowing you to explore each user interface and functionality immediately. 
              In production, all panels would require proper authentication and authorization.
            </p>
          </div>
        </div>

        {/* Navigation Hints */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">🏢 Platform Level</h4>
            <p className="text-sm text-gray-600">
              Master Admin manages all schools and system-wide settings
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">🏫 School Level</h4>
            <p className="text-sm text-gray-600">
              Admin, Teacher, Student, Parent, and Alumni panels
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">🤝 External Access</h4>
            <p className="text-sm text-gray-600">
              Partner panel for external collaborators
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
