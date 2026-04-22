import type { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  CheckCircle2,
  ArrowRight,
  Zap,
  Users,
  Shield,
  Database,
  Smartphone,
  TrendingUp,
  Clock,
  Globe,
  Settings,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Introducing the All-New EduMyles 2026: Real-Time, Role-Based, and Built for Scale",
  description:
    "We rebuilt EduMyles from the ground up with a real-time architecture, 11 deeply integrated modules, and a brand new interface. Here's everything that's new in EduMyles 2026.",
};

export default function EduMyles2026Launch() {
  return (
    <div style={{ color: "#212121" }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #061A12 0%, #0F4C2A 50%, #1A7A4A 100%)",
          padding: "6rem 2rem 4rem",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(232,160,32,0.3) 0%, transparent 50%), 
                            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
              width: "100%",
              height: "100%",
            }}
          />
        </div>

        <div className="relative max-w-[800px] mx-auto">
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-jakarta text-sm px-4 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.1)", color: "#A8E6C3" }}
            >
              ← Back to Blog
            </Link>
          </div>

          <div className="max-w-[800px]">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] px-5 py-2 rounded-[50px]">
                <Rocket className="w-4 h-4" />
                Product Update
              </span>
            </div>
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", color: "#ffffff" }}
            >
              Introducing the <span style={{ color: "#E8A020" }}>All-New EduMyles 2026</span>
            </h1>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>
                  EduMyles Team
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>
                  March 2026
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "#A8E6C3" }}>
                  8 min read
                </span>
              </div>
            </div>

            <p
              className="font-jakarta text-xl leading-[1.7] font-light"
              style={{ color: "#A8E6C3" }}
            >
              We rebuilt EduMyles from the ground up with a real-time architecture, 11 deeply
              integrated modules, and a brand new interface. Here&apos;s everything that&apos;s new.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[800px] mx-auto">
          {/* Introduction */}
          <div className="mb-12">
            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "#374151" }}>
              After three years of serving 500+ schools across East Africa, we&apos;ve learned what
              truly matters in school management: real-time data, seamless collaboration, and the
              flexibility to grow. Today, we&apos;re proud to introduce EduMyles 2026 — our most
              ambitious release yet.
            </p>

            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "#374151" }}>
              This isn&apos;t just an update. It&apos;s a complete reimagining of how school
              management should work, built from the ground up with modern architecture, real-time
              collaboration, and the specific needs of African schools at its core.
            </p>

            <div
              className="p-6 rounded-2xl mb-8"
              style={{
                background: "linear-gradient(135deg, #F3FBF6 0%, #E8F5EE 100%)",
                border: "1px solid rgba(26,122,74,0.2)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Rocket className="w-6 h-6" style={{ color: "#1A7A4A" }} />
                <h3 className="font-display font-bold text-xl" style={{ color: "#061A12" }}>
                  2026 by the Numbers
                </h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    number: "11",
                    label: "Deeply Integrated Modules",
                    desc: "From admissions to alumni management",
                  },
                  {
                    number: "100%",
                    label: "Real-Time Architecture",
                    desc: "No more delays or sync issues",
                  },
                  {
                    number: "5x",
                    label: "Performance Improvement",
                    desc: "Faster load times and smoother experience",
                  },
                ].map((stat) => (
                  <div
                    key={stat.number}
                    className="text-center p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(26,122,74,0.1)",
                    }}
                  >
                    <div
                      className="font-jakarta font-bold text-2xl mb-1"
                      style={{ color: "#E8A020" }}
                    >
                      {stat.number}
                    </div>
                    <div
                      className="font-jakarta font-semibold text-sm mb-1"
                      style={{ color: "#061A12" }}
                    >
                      {stat.label}
                    </div>
                    <div className="font-jakarta text-xs" style={{ color: "#5a5a5a" }}>
                      {stat.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-Time Architecture */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Real-Time Architecture: No More Waiting
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#061A12" }}>
                  Before EduMyles 2026
                </h3>
                <div className="space-y-3">
                  {[
                    "Batch processing (overnight updates)",
                    "Manual data synchronization",
                    "5-10 minute delays in updates",
                    "Separate databases per module",
                    "Limited concurrent users",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: "#FEF2F2", border: "1px solid #fecaca" }}
                    >
                      <span className="text-red-500 text-lg">✕</span>
                      <span className="font-jakarta text-sm" style={{ color: "#991b1b" }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#061A12" }}>
                  With EduMyles 2026
                </h3>
                <div className="space-y-3">
                  {[
                    "Real-time processing (instant updates)",
                    "Automatic synchronization",
                    "Sub-second response times",
                    "Unified database architecture",
                    "Unlimited concurrent users",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: "#F0FDF4", border: "1px solid #bbf7d0" }}
                    >
                      <CheckCircle2
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: "#16a34a" }}
                      />
                      <span className="font-jakarta text-sm" style={{ color: "#15803d" }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 11 Integrated Modules */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              11 Deeply Integrated Modules
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Users,
                  name: "Student Management",
                  description: "Complete student lifecycle from admission to alumni",
                  features: [
                    "Digital admissions",
                    "Student profiles",
                    "Academic records",
                    "Alumni tracking",
                  ],
                },
                {
                  icon: Settings,
                  name: "Academic Management",
                  description: "Curriculum, timetables, and assessment tools",
                  features: [
                    "Curriculum planning",
                    "Timetable generation",
                    "Grade management",
                    "Report cards",
                  ],
                },
                {
                  icon: Database,
                  name: "Financial Management",
                  description: "Fee collection, budgeting, and financial reporting",
                  features: [
                    "Fee structures",
                    "Online payments",
                    "Budget tracking",
                    "Financial reports",
                  ],
                },
                {
                  icon: Users,
                  name: "HR & Payroll",
                  description: "Staff management and automated payroll processing",
                  features: [
                    "Staff records",
                    "Leave management",
                    "Payroll processing",
                    "Performance tracking",
                  ],
                },
                {
                  icon: Smartphone,
                  name: "Parent Portal",
                  description: "Real-time parent engagement and communication",
                  features: [
                    "Grade access",
                    "Fee payments",
                    "Communication",
                    "Attendance tracking",
                  ],
                },
                {
                  icon: Globe,
                  name: "Communication",
                  description: "Multi-channel communication and notifications",
                  features: [
                    "Email & SMS",
                    "Push notifications",
                    "Announcements",
                    "Emergency alerts",
                  ],
                },
                {
                  icon: Shield,
                  name: "Library Management",
                  description: "Digital library with catalog and circulation",
                  features: [
                    "Book catalog",
                    "Issue tracking",
                    "Fine management",
                    "Digital resources",
                  ],
                },
                {
                  icon: TrendingUp,
                  name: "Inventory & Assets",
                  description: "Track school assets and consumable inventory",
                  features: [
                    "Asset tracking",
                    "Inventory management",
                    "Maintenance scheduling",
                    "Depreciation",
                  ],
                },
                {
                  icon: Clock,
                  name: "Attendance Management",
                  description: "Automated attendance tracking and reporting",
                  features: [
                    "Biometric check-in",
                    "Class attendance",
                    "Leave tracking",
                    "Analytics",
                  ],
                },
                {
                  icon: Zap,
                  name: "Examination Management",
                  description: "Comprehensive exam creation and management",
                  features: [
                    "Exam scheduling",
                    "Digital assessments",
                    "Result processing",
                    "Analytics",
                  ],
                },
                {
                  icon: Globe,
                  name: "Transport Management",
                  description: "School transport routing and fleet management",
                  features: [
                    "Route planning",
                    "Vehicle tracking",
                    "Driver management",
                    "Fee calculation",
                  ],
                },
              ].map((module) => (
                <div
                  key={module.name}
                  className="p-5 rounded-xl"
                  style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(26,122,74,0.1)" }}
                    >
                      <module.icon className="w-5 h-5" style={{ color: "#1A7A4A" }} />
                    </div>
                    <h3 className="font-jakarta font-bold text-base" style={{ color: "#061A12" }}>
                      {module.name}
                    </h3>
                  </div>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "#5a5a5a" }}>
                    {module.description}
                  </p>
                  <div className="space-y-1">
                    {module.features.slice(0, 2).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs">
                        <CheckCircle2
                          className="w-3 h-3 flex-shrink-0"
                          style={{ color: "#1A7A4A" }}
                        />
                        <span style={{ color: "#374151" }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role-Based Access */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Role-Based Access: Right Information, Right People
            </h2>

            <div className="space-y-6">
              {[
                {
                  role: "School Administrators",
                  access: "Complete oversight and control",
                  permissions: [
                    "Full system access",
                    "Financial reporting",
                    "Staff management",
                    "System configuration",
                    "Compliance reporting",
                  ],
                },
                {
                  role: "Teachers",
                  access: "Classroom and student-focused tools",
                  permissions: [
                    "Student grades",
                    "Attendance tracking",
                    "Lesson planning",
                    "Parent communication",
                    "Class schedules",
                  ],
                },
                {
                  role: "Parents",
                  access: "Student progress and engagement",
                  permissions: [
                    "Grade viewing",
                    "Fee payments",
                    "Attendance reports",
                    "Communication",
                    "School updates",
                  ],
                },
                {
                  role: "Students",
                  access: "Personal academic information",
                  permissions: [
                    "Class schedules",
                    "Grade viewing",
                    "Assignment submission",
                    "Resource access",
                    "Attendance tracking",
                  ],
                },
                {
                  role: "Finance Office",
                  access: "Financial management and reporting",
                  permissions: [
                    "Fee collection",
                    "Budget management",
                    "Financial reporting",
                    "Payment processing",
                    "Audit trails",
                  ],
                },
              ].map((role) => (
                <div key={role.role} className="border-l-4 pl-6" style={{ borderColor: "#E8A020" }}>
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "#061A12" }}>
                    {role.role}
                  </h3>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "#5a5a5a" }}>
                    {role.access}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: "rgba(26,122,74,0.1)", color: "#1A7A4A" }}
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Built for Scale */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Built for Scale: From 50 to 50,000 Students
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#061A12" }}>
                  Scalability Features
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      feature: "Cloud-Native Architecture",
                      description: "Scales automatically with your growth",
                    },
                    {
                      feature: "Load Balancing",
                      description: "Distributes traffic efficiently across servers",
                    },
                    {
                      feature: "Database Optimization",
                      description: "Handles millions of records without slowdown",
                    },
                    {
                      feature: "CDN Integration",
                      description: "Fast content delivery across Africa",
                    },
                    {
                      feature: "Microservices Design",
                      description: "Independent scaling of different modules",
                    },
                  ].map((item) => (
                    <div
                      key={item.feature}
                      className="flex gap-3 p-3 rounded-lg"
                      style={{ background: "rgba(26,122,74,0.1)" }}
                    >
                      <Zap className="w-5 h-5 flex-shrink-0" style={{ color: "#1A7A4A" }} />
                      <div>
                        <div
                          className="font-jakarta font-semibold text-sm"
                          style={{ color: "#061A12" }}
                        >
                          {item.feature}
                        </div>
                        <div className="font-jakarta text-xs" style={{ color: "#5a5a5a" }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#061A12" }}>
                  Performance Metrics
                </h3>
                <div className="space-y-4">
                  {[
                    { metric: "99.9%", label: "Uptime SLA", desc: "Guaranteed availability" },
                    {
                      metric: "<200ms",
                      label: "Average Response Time",
                      desc: "Sub-second page loads",
                    },
                    {
                      metric: "10,000+",
                      label: "Concurrent Users",
                      desc: "Supports large schools",
                    },
                    { metric: "100TB", label: "Database Capacity", desc: "Scales with your data" },
                    { metric: "24/7", label: "Monitoring", desc: "Proactive issue detection" },
                  ].map((stat) => (
                    <div
                      key={stat.metric}
                      className="flex justify-between items-center p-3 rounded-lg"
                      style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}
                    >
                      <div>
                        <div
                          className="font-jakarta font-bold text-lg"
                          style={{ color: "#E8A020" }}
                        >
                          {stat.metric}
                        </div>
                        <div className="font-jakarta text-xs" style={{ color: "#5a5a5a" }}>
                          {stat.label}
                        </div>
                      </div>
                      <div
                        className="text-xs text-right"
                        style={{ color: "#374151", maxWidth: "120px" }}
                      >
                        {stat.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* New Interface */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Brand New Interface: Modern, Intuitive, Accessible
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#061A12" }}>
                  Design Principles
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      principle: "Mobile-First Design",
                      description: "Works perfectly on smartphones and tablets",
                    },
                    {
                      principle: "Accessibility First",
                      description: "WCAG 2.1 AA compliant for all users",
                    },
                    {
                      principle: "Progressive Enhancement",
                      description: "Works even on slow internet connections",
                    },
                    {
                      principle: "Consistent Experience",
                      description: "Same great experience across all devices",
                    },
                  ].map((item) => (
                    <div
                      key={item.principle}
                      className="p-3 rounded-lg"
                      style={{ background: "#F9FAFB", border: "1px solid #e5e7eb" }}
                    >
                      <h4
                        className="font-jakarta font-semibold text-sm mb-1"
                        style={{ color: "#061A12" }}
                      >
                        {item.principle}
                      </h4>
                      <p className="font-jakarta text-xs" style={{ color: "#5a5a5a" }}>
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#061A12" }}>
                  User Experience Improvements
                </h3>
                <div className="space-y-3">
                  {[
                    "50% faster navigation between modules",
                    "Intelligent search across all data",
                    "Personalized dashboards for each role",
                    "Dark mode support for all screens",
                    "Offline mode for basic functions",
                    "Real-time notifications and alerts",
                    "Drag-and-drop file uploads",
                    "Bulk operations for efficiency",
                  ].map((improvement) => (
                    <div
                      key={improvement}
                      className="flex items-center gap-2 p-2 rounded"
                      style={{ background: "rgba(26,122,74,0.1)" }}
                    >
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "#1A7A4A" }}
                      />
                      <span className="font-jakarta text-sm" style={{ color: "#061A12" }}>
                        {improvement}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Migration Path */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Seamless Migration: Upgrade Without Disruption
            </h2>

            <div className="space-y-6">
              {[
                {
                  phase: "Phase 1: Assessment",
                  duration: "1 week",
                  description:
                    "We analyze your current systems, data structure, and specific requirements.",
                  deliverables: [
                    "System audit",
                    "Data mapping",
                    "Migration plan",
                    "Timeline creation",
                  ],
                },
                {
                  phase: "Phase 2: Data Migration",
                  duration: "1-2 weeks",
                  description: "Secure migration of all your data with zero downtime.",
                  deliverables: [
                    "Data extraction",
                    "Data cleaning",
                    "Validation testing",
                    "Backup creation",
                  ],
                },
                {
                  phase: "Phase 3: Training & Go-Live",
                  duration: "1 week",
                  description: "Comprehensive training and phased rollout.",
                  deliverables: [
                    "Staff training",
                    "System testing",
                    "Go-live support",
                    "Performance monitoring",
                  ],
                },
                {
                  phase: "Phase 4: Optimization",
                  duration: "Ongoing",
                  description: "Continuous improvement and support.",
                  deliverables: [
                    "Performance tuning",
                    "User feedback",
                    "Feature updates",
                    "Regular maintenance",
                  ],
                },
              ].map((phase) => (
                <div key={phase.phase} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: "#E8A020", color: "#061A12" }}
                    >
                      <span className="font-jakarta font-bold text-sm">
                        {phase.phase.split(":")[0]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3
                      className="font-jakarta font-bold text-lg mb-2"
                      style={{ color: "#061A12" }}
                    >
                      {phase.phase}
                    </h3>
                    <p className="font-jakarta text-sm mb-2" style={{ color: "#5a5a5a" }}>
                      {phase.description}
                    </p>
                    <div
                      className="flex items-center gap-2 text-xs font-semibold"
                      style={{ color: "#1A7A4A" }}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{phase.duration}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {phase.deliverables.map((deliverable) => (
                        <span
                          key={deliverable}
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: "rgba(26,122,74,0.1)", color: "#1A7A4A" }}
                        >
                          {deliverable}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Early Access */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "#061A12" }}>
              Early Access Program
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#061A12" }}>
                  What You Get
                </h3>
                <div className="space-y-3">
                  {[
                    "Priority access to EduMyles 2026",
                    "Dedicated migration specialist",
                    "50% discount on first year",
                    "Free data migration service",
                    "Priority support channel",
                    "Input on feature development",
                    "Beta access to new modules",
                    "Quarterly strategy sessions",
                  ].map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center gap-2 p-2 rounded"
                      style={{ background: "rgba(26,122,74,0.1)" }}
                    >
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "#1A7A4A" }}
                      />
                      <span className="font-jakarta text-sm" style={{ color: "#061A12" }}>
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "#061A12" }}>
                  Limited Spots Available
                </h3>
                <div
                  className="p-6 rounded-2xl text-center"
                  style={{
                    background: "linear-gradient(135deg, #E8A020 0%, #F59E0B 100%)",
                    color: "#ffffff",
                  }}
                >
                  <div className="font-jakarta font-bold text-3xl mb-2">20</div>
                  <div className="font-jakarta text-sm mb-4">Schools Accepted This Month</div>
                  <div className="font-jakarta text-xs opacity-90">
                    First come, first served basis
                  </div>
                </div>
                <div
                  className="mt-4 p-4 rounded-lg"
                  style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" style={{ color: "#D97706" }} />
                    <span
                      className="font-jakarta font-semibold text-sm"
                      style={{ color: "#92400E" }}
                    >
                      Application Deadline: March 31, 2026
                    </span>
                  </div>
                  <p className="font-jakarta text-xs" style={{ color: "#78350F" }}>
                    Don&apos;t miss this opportunity to be among the first schools in Africa to
                    experience the future of education management.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-display font-bold text-2xl mb-4" style={{ color: "#061A12" }}>
              Ready for the Future of School Management?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "#5a5a5a" }}>
              Join the early access program and transform your school with EduMyles 2026.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/book-demo"
                className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "#E8A020", color: "#061A12" }}
              >
                Schedule 2026 Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 font-jakarta font-semibold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "transparent", color: "#061A12", border: "2px solid #061A12" }}
              >
                Apply for Early Access
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
