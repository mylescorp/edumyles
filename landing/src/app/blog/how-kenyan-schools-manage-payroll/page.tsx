import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Shield,
  Clock,
  DollarSign,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How Kenyan Schools Manage Payroll Efficiently - Complete Guide",
  description:
    "Learn how Kenyan schools are streamlining payroll management with automated systems, KRA compliance, and staff satisfaction. Complete guide for 2026.",
};

export default function KenyanSchoolsPayrollGuide() {
  return (
    <div style={{ color: "var(--color-text-default)" }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-chrome-platform) 0%, var(--color-action-primary) 100%)",
          padding: "6rem 2rem 4rem",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--color-action-primary) 30%, transparent) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--color-text-on-primary) 10%, transparent) 0%, transparent 50%)`,
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
              style={{ background: "color-mix(in srgb, var(--color-surface-default) 10%, transparent)", color: "var(--color-text-muted)" }}
            >
              ← Back to Blog
            </Link>
          </div>

          <div className="max-w-[800px]">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] px-5 py-2 rounded-[50px]">
                <Users className="w-4 h-4" />
                School Management
              </span>
            </div>
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", color: "var(--color-text-inverse)" }}
            >
              How Kenyan Schools <span style={{ color: "var(--color-text-on-primary-subtle)" }}>Manage Payroll</span>
            </h1>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                  EduMyles Team
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                  March 2026
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                  7 min read
                </span>
              </div>
            </div>

            <p
              className="font-jakarta text-xl leading-[1.7] font-light"
              style={{ color: "var(--color-text-muted)" }}
            >
              Discover how Kenyan schools are revolutionizing payroll management with automated
              systems, ensuring KRA compliance while boosting staff satisfaction.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4" style={{ background: "var(--color-surface-default)" }}>
        <div className="max-w-[800px] mx-auto">
          {/* Introduction */}
          <div className="mb-12">
            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "var(--color-text-muted)" }}>
              Managing payroll for Kenyan schools comes with unique challenges: complex tax
              calculations, KRA compliance requirements, multiple pay scales, and the need for
              absolute accuracy. Yet many schools still rely on manual processes that are
              time-consuming and error-prone.
            </p>

            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "var(--color-text-muted)" }}>
              Modern payroll management systems are transforming how schools handle staff
              compensation, from automated tax calculations to seamless integration with school
              management platforms. Here&apos;s how leading Kenyan schools are getting it right.
            </p>

            <div
              className="p-6 rounded-2xl mb-8"
              style={{
                background: "linear-gradient(135deg, var(--color-surface-default) 0%, var(--color-surface-sunken) 100%)",
                border: "1px solid color-mix(in srgb, var(--color-status-success-solid) 20%, transparent)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Calculator className="w-6 h-6" style={{ color: "var(--color-action-primary)" }} />
                <h3 className="font-display font-bold text-xl" style={{ color: "var(--color-text-default)" }}>
                  Payroll Management by the Numbers
                </h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { number: "75%", label: "Time Saved", desc: "vs manual processing" },
                  { number: "Live", label: "Accuracy Rate", desc: "automated calculations" },
                  { number: "100%", label: "KRA Compliant", desc: "with automated updates" },
                ].map((stat) => (
                  <div
                    key={stat.number}
                    className="text-center p-4 rounded-xl"
                    style={{
                      background: "color-mix(in srgb, var(--color-surface-default) 80%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
                    }}
                  >
                    <div
                      className="font-jakarta font-bold text-2xl mb-1"
                      style={{ color: "var(--color-text-on-primary-subtle)" }}
                    >
                      {stat.number}
                    </div>
                    <div
                      className="font-jakarta font-semibold text-sm mb-1"
                      style={{ color: "var(--color-text-default)" }}
                    >
                      {stat.label}
                    </div>
                    <div className="font-jakarta text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {stat.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KRA Compliance */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              KRA Compliance Made Simple
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "var(--color-text-default)" }}>
                  Before Automation
                </h3>
                <div className="space-y-3">
                  {[
                    "Manual tax calculations prone to errors",
                    "Late statutory filings and penalties",
                    "Inconsistent PAYE application",
                    "Missing NHIF and NSSF updates",
                    "Time-consuming reconciliation processes",
                  ].map((issue) => (
                    <div
                      key={issue}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-status-warning-subtle)" }}
                    >
                      <span className="text-red-500 text-lg">✕</span>
                      <span className="font-jakarta text-sm" style={{ color: "var(--color-status-danger-on-subtle)" }}>
                        {issue}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "var(--color-text-default)" }}>
                  With EduMyles
                </h3>
                <div className="space-y-3">
                  {[
                    "Automated KRA tax calculations",
                    "Real-time statutory updates",
                    "Compliant PAYE processing",
                    "Integrated NHIF and NSSF",
                    "Automated monthly filings",
                    "Digital audit trails",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-status-success-subtle)" }}
                    >
                      <CheckCircle2
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: "var(--color-status-success-solid)" }}
                      />
                      <span className="font-jakarta text-sm" style={{ color: "var(--color-status-success-solid)" }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modern Payroll Features */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Essential Payroll Management Features
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Calculator,
                  title: "Automated Calculations",
                  description:
                    "PAYE, NHIF, NSSF, and housing levy calculations updated automatically",
                  benefits: ["Real-time tax rates", "Multiple allowances", "Deduction management"],
                },
                {
                  icon: Users,
                  title: "Staff Management",
                  description:
                    "Complete employee profiles with job details, departments, and employment history",
                  benefits: ["Unlimited employees", "Role-based access", "Performance tracking"],
                },
                {
                  icon: DollarSign,
                  title: "Payslip Generation",
                  description:
                    "Professional payslips with detailed breakdowns and digital signatures",
                  benefits: ["Custom templates", "Bulk generation", "Email distribution"],
                },
                {
                  icon: Shield,
                  title: "Compliance Reporting",
                  description: "KRA-compliant reports ready for submission with proper formatting",
                  benefits: ["Monthly reports", "Annual summaries", "Audit readiness"],
                },
                {
                  icon: Clock,
                  title: "Leave Management",
                  description:
                    "Track annual leave, sick days, and absences with automated accruals",
                  benefits: ["Leave balances", "Approval workflows", "Integration calendar"],
                },
                {
                  icon: TrendingUp,
                  title: "Analytics & Insights",
                  description:
                    "Comprehensive payroll analytics with cost trends and budget forecasting",
                  benefits: ["Cost analysis", "Budget tracking", "Variance reporting"],
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-5 rounded-xl"
                  style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
                    >
                      <feature.icon className="w-5 h-5" style={{ color: "var(--color-action-primary)" }} />
                    </div>
                    <h3 className="font-jakarta font-bold text-base" style={{ color: "var(--color-text-default)" }}>
                      {feature.title}
                    </h3>
                  </div>
                  <p className="font-jakarta text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
                    {feature.description}
                  </p>
                  <div className="space-y-1">
                    {feature.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2 text-xs">
                        <CheckCircle2
                          className="w-3 h-3 flex-shrink-0"
                          style={{ color: "var(--color-action-primary)" }}
                        />
                        <span style={{ color: "var(--color-text-muted)" }}>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation Guide */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Implementation Guide for Kenyan Schools
            </h2>

            <div className="space-y-8">
              {[
                {
                  phase: "Phase 1: Assessment",
                  duration: "1 week",
                  description:
                    "We analyze your current payroll structure, staff data, and KRA compliance requirements.",
                  deliverables: [
                    "Payroll audit",
                    "Tax review",
                    "Compliance gap analysis",
                    "Implementation plan",
                  ],
                },
                {
                  phase: "Phase 2: Setup",
                  duration: "2 weeks",
                  description:
                    "Configure payroll system with your staff data, pay scales, and statutory requirements.",
                  deliverables: [
                    "Staff data import",
                    "Pay structure setup",
                    "Tax configuration",
                    "System testing",
                  ],
                },
                {
                  phase: "Phase 3: Training",
                  duration: "1 week",
                  description:
                    "Train your finance team on the new system with hands-on workshops and documentation.",
                  deliverables: [
                    "Admin training",
                    "Staff guides",
                    "Process documentation",
                    "Support setup",
                  ],
                },
                {
                  phase: "Phase 4: Go-Live",
                  duration: "1 week",
                  description:
                    "Launch the payroll system with parallel run and comprehensive support.",
                  deliverables: [
                    "System launch",
                    "Data validation",
                    "KRA filing support",
                    "Ongoing assistance",
                  ],
                },
              ].map((phase) => (
                <div key={phase.phase} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
                    >
                      <span className="font-jakarta font-bold text-sm">
                        {phase.phase.split(" ")[1]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3
                      className="font-jakarta font-bold text-lg mb-2"
                      style={{ color: "var(--color-text-default)" }}
                    >
                      {phase.phase}
                    </h3>
                    <p className="font-jakarta text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>
                      {phase.description}
                    </p>
                    <div
                      className="flex items-center gap-2 text-xs font-semibold"
                      style={{ color: "var(--color-action-primary)" }}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{phase.duration}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {phase.deliverables.map((deliverable) => (
                        <span
                          key={deliverable}
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)", color: "var(--color-action-primary)" }}
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

          {/* Success Stories */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Success Stories: Kenyan Schools
            </h2>

            <div className="space-y-6">
              {[
                {
                  school: "Nairobi Green Academy",
                  location: "Nairobi",
                  staff: "120 teachers and staff",
                  challenge:
                    "Manual payroll processing took 5 days per month with frequent errors.",
                  solution: "Implemented EduMyles payroll with automated KRA compliance.",
                  results:
                    "Reduced processing time to 1 day, 100% accuracy, KES 200K annual savings.",
                },
                {
                  school: "St. Mary's Girls High",
                  location: "Nairobi",
                  staff: "85 teachers and staff",
                  challenge:
                    "Complex pay scales and multiple statutory deductions were difficult to manage.",
                  solution: "Deployed automated payroll with real-time tax updates.",
                  results:
                    "Staff satisfaction up 40%, zero compliance issues, seamless monthly reporting.",
                },
                {
                  school: "Kisumu Boys High",
                  location: "Kisumu",
                  staff: "95 teachers and staff",
                  challenge:
                    "Leave management and payslip distribution were completely manual processes.",
                  solution: "Integrated payroll system with digital payslips and leave tracking.",
                  results:
                    "Leave processing time reduced by 80%, instant payslip access, improved staff morale.",
                },
              ].map((story) => (
                <div
                  key={story.school}
                  className="p-6 rounded-xl"
                  style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3
                        className="font-jakarta font-bold text-lg mb-1"
                        style={{ color: "var(--color-text-default)" }}
                      >
                        {story.school}
                      </h3>
                      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {story.location} • {story.staff}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ background: "var(--color-status-success-subtle)", color: "var(--color-status-success-on-subtle)" }}
                      >
                        Success Story
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--color-status-danger-solid)" }}>
                        Challenge:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--color-text-muted)" }}>
                        {story.challenge}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--color-action-primary)" }}>
                        Solution:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--color-text-muted)" }}>
                        {story.solution}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                        Results:
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--color-text-muted)" }}>
                        {story.results}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-display font-bold text-2xl mb-4" style={{ color: "var(--color-text-default)" }}>
              Ready to Transform Your Payroll Management?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "var(--color-text-muted)" }}>
              Join 100+ Kenyan schools using EduMyles for automated, KRA-compliant payroll
              processing.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/book-demo"
                className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
              >
                Schedule Payroll Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 font-jakarta font-semibold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "transparent", color: "var(--color-text-default)", border: "2px solid var(--color-border-default)" }}
              >
                Contact Payroll Experts
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
