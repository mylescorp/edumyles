import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, CheckCircle2, ArrowRight, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "School Management Software in Uganda: What's Different from Kenya",
  description:
    "UNEB vs CBC, Airtel Money vs M-Pesa, Ugandan MoES requirements — here's what we adapted for Ugandan schools. Complete guide for Ugandan education.",
};

export default function UgandaSchoolManagement() {
  return (
    <div style={{ color: "var(--foreground)" }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--platform-chrome) 0%, var(--primary) 100%)",
          padding: "6rem 2rem 4rem",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgb(var(--primary-rgb) / 30%) 0%, transparent 50%),
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
              style={{ background: "rgba(255,255,255,0.1)", color: "var(--muted-foreground)" }}
            >
              ← Back to Blog
            </Link>
          </div>

          <div className="max-w-[800px]">
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", color: "#ffffff" }}
            >
              School Management in <span style={{ color: "var(--accent-foreground)" }}>Uganda</span>
            </h1>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" style={{ color: "var(--accent-foreground)" }} />
                <span className="font-jakarta text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Regional
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "var(--muted-foreground)" }}>
                  6 min read
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "var(--muted-foreground)" }}>
                  December 2025
                </span>
              </div>
            </div>

            <p className="font-jakarta text-lg leading-[1.7]" style={{ color: "var(--muted-foreground)" }}>
              UNEB vs CBC, Airtel Money vs M-Pesa, Ugandan MoES requirements — here&apos;s what we
              adapted for Ugandan schools. Complete guide for the Ugandan education system.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4" style={{ background: "var(--card)" }}>
        <div className="max-w-[800px] mx-auto">
          {/* Introduction */}
          <div className="mb-12">
            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "var(--muted-foreground)" }}>
              While Kenya and Uganda share many educational challenges, their systems, requirements,
              and payment landscapes differ significantly. A school management system that works
              perfectly in Nairobi needs thoughtful adaptation for Kampala.
            </p>

            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "var(--muted-foreground)" }}>
              EduMyles has been extensively adapted for the Ugandan market, from UNEC curriculum
              alignment to Airtel Money integration. Here&apos;s what makes Ugandan school
              management unique and how we&apos;ve tailored our platform accordingly.
            </p>

            <div
              className="p-6 rounded-2xl mb-8"
              style={{
                background: "linear-gradient(135deg, var(--card) 0%, var(--muted) 100%)",
                border: "1px solid rgba(26,122,74,0.2)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Globe className="w-6 h-6" style={{ color: "var(--primary)" }} />
                <h3 className="font-display font-bold text-xl" style={{ color: "var(--foreground)" }}>
                  Uganda-Specific Adaptations
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  "UNEC curriculum alignment and reporting",
                  "Airtel Money and MTN Mobile Money integration",
                  "Ugandan MoES compliance requirements",
                  "East African Community (EAC) standards",
                  "Local language support (Luganda, Swahili)",
                  "Ugandan school calendar integration",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                    <span className="font-jakarta text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Differences */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Key Differences: Kenya vs Uganda
            </h2>

            <div className="space-y-6">
              {[
                {
                  aspect: "Curriculum System",
                  kenya: "CBC (Competency-Based Curriculum)",
                  uganda: "UNEC (Uganda National Examinations Board)",
                  impact: "Different assessment structures and reporting formats",
                },
                {
                  aspect: "Mobile Payment",
                  kenya: "M-Pesa dominant (90% market share)",
                  uganda: "Airtel Money and MTN Mobile Money",
                  impact: "Multiple payment gateway integrations required",
                },
                {
                  aspect: "Education Authority",
                  kenya: "Ministry of Education (MoE)",
                  uganda: "Ministry of Education and Sports (MoES)",
                  impact: "Different compliance requirements and reporting formats",
                },
                {
                  aspect: "School Structure",
                  kenya: "8-4-4 system (Primary, Secondary, University)",
                  uganda: "7-4-2-3 system (Primary, Lower Secondary, Upper Secondary, University)",
                  impact: "Different grade levels and class structures",
                },
                {
                  aspect: "Examination Bodies",
                  kenya: "KNEC (Kenya National Examinations Council)",
                  uganda: "UNEC (Uganda National Examinations Board)",
                  impact: "Different exam formats and result processing",
                },
                {
                  aspect: "Academic Calendar",
                  kenya: "January-December school year",
                  uganda: "February-December school year",
                  impact: "Different term dates and holiday schedules",
                },
              ].map((difference) => (
                <div
                  key={difference.aspect}
                  className="border-l-4 pl-6"
                  style={{ borderColor: "var(--primary)" }}
                >
                  <h3 className="font-jakarta font-bold text-lg mb-3" style={{ color: "var(--foreground)" }}>
                    {difference.aspect}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ background: "#FEE2E2", border: "1px solid #fecaca" }}
                    >
                      <div className="text-xs font-semibold mb-1" style={{ color: "#991b1b" }}>
                        Kenya
                      </div>
                      <div className="text-sm" style={{ color: "#7f1d1d" }}>
                        {difference.kenya}
                      </div>
                    </div>
                    <div
                      className="p-3 rounded-lg"
                      style={{ background: "#D1FAE5", border: "1px solid #a7f3d0" }}
                    >
                      <div className="text-xs font-semibold mb-1" style={{ color: "#064e3b" }}>
                        Uganda
                      </div>
                      <div className="text-sm" style={{ color: "#065f46" }}>
                        {difference.uganda}
                      </div>
                    </div>
                  </div>
                  <div
                    className="text-sm mt-2 p-2 rounded"
                    style={{ background: "rgb(var(--primary-rgb) / 10%)", color: "#9A5D00" }}
                  >
                    Impact: {difference.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UNEC Integration */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              UNEC Curriculum Integration
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  level: "Primary (P1-P7)",
                  subjects: [
                    "English",
                    "Mathematics",
                    "Science",
                    "Social Studies",
                    "Religious Education",
                    "Physical Education",
                  ],
                  assessment: "Continuous Assessment + End of Year Exams",
                },
                {
                  level: "Lower Secondary (S1-S4)",
                  subjects: [
                    "English",
                    "Mathematics",
                    "Biology",
                    "Chemistry",
                    "Physics",
                    "Geography",
                    "History",
                    "CRE",
                    "IRE",
                    "Local Language",
                  ],
                  assessment: "UNEB Examinations + School-Based Assessment",
                },
                {
                  level: "Upper Secondary (S5-S6)",
                  subjects: ["Subject Combinations", "General Paper", "Subsidiary Mathematics"],
                  assessment: "UNEB UACE Examinations",
                },
                {
                  level: "Technical/Vocational",
                  subjects: [
                    "Agriculture",
                    "Business Studies",
                    "Technical Drawing",
                    "Home Economics",
                  ],
                  assessment: "UBTEB Examinations",
                },
              ].map((level) => (
                <div
                  key={level.level}
                  className="p-5 rounded-xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "var(--foreground)" }}>
                    {level.level}
                  </h3>
                  <div className="mb-3">
                    <div className="text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
                      Key Subjects:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {level.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: "rgba(26,122,74,0.1)", color: "var(--primary)" }}
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
                      Assessment:
                    </div>
                    <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {level.assessment}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Integration */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Mobile Money Integration for Uganda
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "var(--foreground)" }}>
                  Payment Landscape
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      provider: "Airtel Money",
                      market: "45% market share",
                      features: [
                        "Instant transfers",
                        "School fee payments",
                        "Bulk payments",
                        "API integration",
                      ],
                    },
                    {
                      provider: "MTN Mobile Money",
                      market: "40% market share",
                      features: [
                        "Widely accepted",
                        "International transfers",
                        "Business accounts",
                        "Developer API",
                      ],
                    },
                    {
                      provider: "Other Providers",
                      market: "15% market share",
                      features: ["ZamPay", "SafeBoda", "FlexiPay", "Regional coverage"],
                    },
                  ].map((provider) => (
                    <div
                      key={provider.provider}
                      className="p-4 rounded-xl"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4
                          className="font-jakarta font-semibold text-base"
                          style={{ color: "var(--foreground)" }}
                        >
                          {provider.provider}
                        </h4>
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ background: "rgba(26,122,74,0.1)", color: "var(--primary)" }}
                        >
                          {provider.market}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {provider.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle2
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: "var(--primary)" }}
                            />
                            <span style={{ color: "var(--muted-foreground)" }}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "var(--foreground)" }}>
                  EduMyles Integration
                </h3>
                <div className="space-y-3">
                  {[
                    "Multi-provider support (Airtel + MTN)",
                    "Automatic fee reminders via SMS",
                    "Real-time payment reconciliation",
                    "Parent portal payment tracking",
                    "Bulk payment processing",
                    "Payment history and reporting",
                    "Ugx currency support",
                    "School fee structure management",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: "rgba(26,122,74,0.1)" }}
                    >
                      <CreditCard className="w-5 h-5 flex-shrink-0" style={{ color: "var(--primary)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MoES Compliance */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Ministry of Education & Sports Compliance
            </h2>

            <div className="space-y-6">
              {[
                {
                  requirement: "School Registration & Licensing",
                  description:
                    "Automated tracking of school registration numbers, license expiry dates, and renewal requirements.",
                  features: [
                    "License expiry alerts",
                    "Document management",
                    "Compliance reporting",
                    "Audit trail",
                  ],
                },
                {
                  requirement: "Teacher Registration & Qualifications",
                  description:
                    "Integration with Uganda Teacher Service Commission requirements and qualification tracking.",
                  features: [
                    "TSC number tracking",
                    "Qualification verification",
                    "Professional development",
                    "Performance records",
                  ],
                },
                {
                  requirement: "Student Records & Reporting",
                  description:
                    "MoES-compliant student information systems with mandatory data fields and reporting formats.",
                  features: [
                    "Standardized student data",
                    "Enrollment reporting",
                    "Attendance tracking",
                    "Academic records",
                  ],
                },
                {
                  requirement: "Financial Management Standards",
                  description:
                    "Ugandan school financial management requirements with proper accounting and reporting.",
                  features: [
                    "Budget tracking",
                    "Financial reporting",
                    "Audit compliance",
                    "Expense management",
                  ],
                },
              ].map((req) => (
                <div
                  key={req.requirement}
                  className="p-5 rounded-xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: "var(--foreground)" }}>
                    {req.requirement}
                  </h3>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
                    {req.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {req.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: "rgba(26,122,74,0.1)", color: "var(--primary)" }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation Success */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Success Stories: Ugandan Schools
            </h2>

            <div className="space-y-6">
              {[
                {
                  school: "Kampala Parents School",
                  location: "Kampala",
                  students: "1,500 students",
                  challenge: "Managing multiple payment methods and UNEC reporting requirements.",
                  solution:
                    "Implemented EduMyles with Airtel Money/MTN integration and UNEC compliance.",
                  results: "95% fee collection rate, 40% reduction in admin time.",
                },
                {
                  school: "St. Mary's College Kisubi",
                  location: "Entebbe",
                  students: "800 students",
                  challenge: "Complex subject combinations for O'Level and A'Level students.",
                  solution: "Custom curriculum setup with UNEC alignment and automated scheduling.",
                  results: "Improved exam performance by 25%, reduced timetable conflicts.",
                },
                {
                  school: "Greenhill Academy",
                  location: "Kampala",
                  students: "600 students",
                  challenge: "Parent communication across multiple mobile money platforms.",
                  solution: "Unified parent portal with multi-provider payment integration.",
                  results: "98% parent satisfaction, 60% reduction in payment inquiries.",
                },
              ].map((story) => (
                <div
                  key={story.school}
                  className="p-6 rounded-2xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3
                        className="font-jakarta font-bold text-lg mb-1"
                        style={{ color: "var(--foreground)" }}
                      >
                        {story.school}
                      </h3>
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {story.location} • {story.students}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ background: "#D1FAE5", color: "#065f46" }}
                      >
                        Success Story
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "#ef4444" }}>
                        Challenge:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--muted-foreground)" }}>
                        {story.challenge}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--primary)" }}>
                        Solution:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--muted-foreground)" }}>
                        {story.solution}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--accent-foreground)" }}>
                        Results:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--muted-foreground)" }}>
                        {story.results}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Getting Started */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--foreground)" }}>
              Getting Started in Uganda
            </h2>

            <div className="space-y-8">
              {[
                {
                  step: "Step 1",
                  title: "Free Consultation",
                  description:
                    "Schedule a consultation with our Uganda team to discuss your school's specific needs.",
                  duration: "30 minutes",
                },
                {
                  step: "Step 2",
                  title: "Custom Setup",
                  description:
                    "We configure EduMyles for Ugandan curriculum, payment systems, and MoES compliance.",
                  duration: "1-2 weeks",
                },
                {
                  step: "Step 3",
                  title: "Data Migration",
                  description:
                    "Import student records, fee structures, and historical data from your existing systems.",
                  duration: "3-5 days",
                },
                {
                  step: "Step 4",
                  title: "Training & Go-Live",
                  description:
                    "Comprehensive training for staff and parents, followed by system launch.",
                  duration: "1 week",
                },
              ].map((step) => (
                <div key={step.step} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                    >
                      <span className="font-jakarta font-bold text-sm">{step.step}</span>
                    </div>
                  </div>
                  <div>
                    <h3
                      className="font-jakarta font-bold text-lg mb-2"
                      style={{ color: "var(--foreground)" }}
                    >
                      {step.title}
                    </h3>
                    <p className="font-jakarta text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>
                      {step.description}
                    </p>
                    <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                      Duration: {step.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-display font-bold text-2xl mb-4" style={{ color: "var(--foreground)" }}>
              Ready to Transform Your Ugandan School?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "var(--muted-foreground)" }}>
              Join 50+ Ugandan schools using EduMyles for streamlined administration and improved
              student outcomes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/book-demo"
                className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                Schedule Uganda Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 font-jakarta font-semibold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "transparent", color: "var(--foreground)", border: "2px solid var(--border)" }}
              >
                Contact Uganda Team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
