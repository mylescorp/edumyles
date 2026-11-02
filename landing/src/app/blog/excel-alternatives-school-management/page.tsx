import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Database,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "5 Signs Your School Has Outgrown Excel — And What to Do About It",
  description:
    "From attendance confusion to fee arrears chaos, these are the warning signs every school administrator should watch for. Know when it's time to move beyond Excel.",
};

export default function ExcelAlternativesGuide() {
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
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", color: "var(--color-text-inverse)" }}
            >
              5 Signs Your School Has <span style={{ color: "var(--color-text-on-primary-subtle)" }}>Outgrown Excel</span>
            </h1>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5" style={{ color: "var(--color-text-on-primary-subtle)" }} />
                <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                  School Management
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: "var(--color-text-on-primary-subtle)" }} />
                <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                  5 min read
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                  January 2026
                </span>
              </div>
            </div>

            <p className="font-jakarta text-lg leading-[1.7]" style={{ color: "var(--color-text-muted)" }}>
              From attendance confusion to fee arrears chaos, these are the warning signs every
              school administrator should watch for. Know when it&apos;s time to move beyond Excel.
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
              Every school starts with Excel. It&apos;s familiar, readily available, and seems
              perfect for tracking students, grades, and fees. But as your school grows, those
              spreadsheets become increasingly complex, error-prone, and time-consuming.
            </p>

            <p className="font-jakarta text-lg leading-[1.8] mb-6" style={{ color: "var(--color-text-muted)" }}>
              The question isn&apos;t if you&apos;ll outgrow Excel—it&apos;s when. Here are the five
              clear signs that your school is ready for a proper school management system, and what
              to do about each one.
            </p>

            <div
              className="p-6 rounded-2xl mb-8"
              style={{
                background: "linear-gradient(135deg, var(--color-surface-default) 0%, var(--color-surface-sunken) 100%)",
                border: "1px solid color-mix(in srgb, var(--color-status-success-solid) 20%, transparent)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6" style={{ color: "var(--color-action-primary)" }} />
                <h3 className="font-display font-bold text-xl" style={{ color: "var(--color-text-default)" }}>
                  The Hidden Cost of Excel
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  "20+ hours per week on manual data entry",
                  "15% error rate in grade calculations",
                  "Lost productivity during report card season",
                  "Parent complaints about delayed information",
                ].map((cost) => (
                  <li key={cost} className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-status-danger-solid)" }} />
                    <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {cost}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The 5 Warning Signs */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              The 5 Warning Signs You&apos;ve Outgrown Excel
            </h2>

            <div className="space-y-8">
              {[
                {
                  sign: "Sign #1",
                  title: "Multiple Conflicting Spreadsheets",
                  description:
                    "You have different Excel files for attendance, grades, fees, and student records that don't sync automatically.",
                  symptoms: [
                    "Copying and pasting data between files",
                    "Manual reconciliation at month-end",
                    "Different student IDs across spreadsheets",
                    "Version control nightmares",
                  ],
                  impact: "High",
                  solution: "Centralized database with automatic synchronization",
                },
                {
                  sign: "Sign #2",
                  title: "Grade Calculation Errors",
                  description:
                    "Teachers spend hours calculating grades manually, and mistakes frequently slip through.",
                  symptoms: [
                    "Formula errors in grade calculations",
                    "Inconsistent grading across classes",
                    "Parents questioning grade accuracy",
                    "Last-minute report card corrections",
                  ],
                  impact: "Critical",
                  solution: "Automated gradebook with built-in calculation rules",
                },
                {
                  sign: "Sign #3",
                  title: "Fee Collection Chaos",
                  description:
                    "Tracking who has paid, who hasn't, and sending reminders is a full-time job.",
                  symptoms: [
                    "Manual fee tracking in spreadsheets",
                    "Lost payment records",
                    "Time-consuming follow-up calls",
                    "No real-time financial visibility",
                  ],
                  impact: "High",
                  solution: "Integrated fee management with automated tracking",
                },
                {
                  sign: "Sign #4",
                  title: "Communication Breakdown",
                  description:
                    "Parents constantly call for information that should be readily available.",
                  symptoms: [
                    "Daily calls for grade inquiries",
                    "Manual progress report preparation",
                    "No centralized parent communication",
                    "Delayed information sharing",
                  ],
                  impact: "Medium",
                  solution: "Parent portal with real-time access to information",
                },
                {
                  sign: "Sign #5",
                  title: "Compliance Nightmares",
                  description:
                    "Preparing reports for Ministry of Education, KNEC, or auditors takes weeks of manual work.",
                  symptoms: [
                    "Manual data compilation for reports",
                    "Missing or incomplete records",
                    "Last-minute report preparation",
                    "Difficulty tracking historical data",
                  ],
                  impact: "Critical",
                  solution: "Automated reporting with compliance templates",
                },
              ].map((warning) => (
                <div
                  key={warning.sign}
                  className="border-l-4 pl-6"
                  style={{ borderColor: "var(--color-action-primary)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="font-jakarta font-bold text-sm px-3 py-1 rounded-full"
                      style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
                    >
                      {warning.sign}
                    </span>
                    <span
                      className={`font-jakarta text-sm px-2 py-1 rounded ${
                        warning.impact === "Critical"
                          ? "bg-red-100 text-red-700"
                          : warning.impact === "High"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {warning.impact} Impact
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3" style={{ color: "var(--color-text-default)" }}>
                    {warning.title}
                  </h3>
                  <p
                    className="font-jakarta text-base leading-[1.7] mb-4"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {warning.description}
                  </p>
                  <div className="mb-4">
                    <h4
                      className="font-jakarta font-semibold text-sm mb-2"
                      style={{ color: "var(--color-text-default)" }}
                    >
                      Common Symptoms:
                    </h4>
                    <ul className="space-y-1">
                      {warning.symptoms.map((symptom) => (
                        <li key={symptom} className="flex items-center gap-2 text-sm">
                          <AlertCircle
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: "var(--color-status-danger-solid)" }}
                          />
                          <span style={{ color: "var(--color-text-muted)" }}>{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "color-mix(in_srgb,_var(--color-status-success-solid)_10%,_transparent)" }}>
                    <span className="font-semibold text-sm" style={{ color: "var(--color-action-primary)" }}>
                      Solution:{" "}
                    </span>
                    <span className="text-sm" style={{ color: "var(--color-action-primary)" }}>
                      {warning.solution}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Cost Analysis */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              The Real Cost of Sticking with Excel
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "var(--color-text-default)" }}>
                  Monthly Excel Costs
                </h3>
                <div className="space-y-3">
                  {[
                    { item: "Staff time (20 hrs/week × 4 weeks)", cost: "KES 80,000" },
                    { item: "Printing and supplies", cost: "KES 15,000" },
                    { item: "Error correction costs", cost: "KES 25,000" },
                    { item: "Communication inefficiency", cost: "KES 20,000" },
                    { item: "Opportunity cost", cost: "KES 60,000" },
                  ].map((item) => (
                    <div
                      key={item.item}
                      className="flex justify-between items-center p-3 rounded-lg"
                      style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                    >
                      <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {item.item}
                      </span>
                      <span
                        className="font-jakarta font-bold text-base"
                        style={{ color: "var(--color-status-danger-solid)" }}
                      >
                        {item.cost}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border-default)" }}>
                  <div className="flex justify-between items-center">
                    <span className="font-jakarta font-bold text-lg" style={{ color: "var(--color-text-default)" }}>
                      Total Monthly Cost
                    </span>
                    <span className="font-jakarta font-bold text-xl" style={{ color: "var(--color-status-danger-solid)" }}>
                      KES 200,000
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "var(--color-text-default)" }}>
                  EduMyles Investment
                </h3>
                <div className="space-y-3">
                  {[
                    { item: "Monthly subscription", cost: "KES 21,500" },
                    { item: "Training & onboarding", cost: "KES 15,000 (one-time)" },
                    { item: "Implementation support", cost: "Included" },
                    { item: "Ongoing updates", cost: "Included" },
                    { item: "24/7 support", cost: "Included" },
                  ].map((item) => (
                    <div
                      key={item.item}
                      className="flex justify-between items-center p-3 rounded-lg"
                      style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                    >
                      <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {item.item}
                      </span>
                      <span
                        className="font-jakarta font-bold text-base"
                        style={{ color: "var(--color-action-primary)" }}
                      >
                        {item.cost}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border-default)" }}>
                  <div className="flex justify-between items-center">
                    <span className="font-jakarta font-bold text-lg" style={{ color: "var(--color-text-default)" }}>
                      Monthly Investment
                    </span>
                    <span className="font-jakarta font-bold text-xl" style={{ color: "var(--color-action-primary)" }}>
                      KES 21,500
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="font-jakarta text-sm" style={{ color: "var(--color-action-primary)" }}>
                      Monthly Savings: KES 178,500 (89% reduction)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Migration Timeline */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Migration Timeline: From Excel to EduMyles
            </h2>

            <div className="space-y-6">
              {[
                {
                  week: "Week 1",
                  title: "Data Preparation & Cleanup",
                  tasks: [
                    "Audit existing Excel files",
                    "Standardize data formats",
                    "Create data migration plan",
                    "Backup all current data",
                  ],
                  time: "8-10 hours",
                },
                {
                  week: "Week 2",
                  title: "System Setup & Configuration",
                  tasks: [
                    "Create EduMyles account",
                    "Set up school structure",
                    "Configure academic calendar",
                    "Create user accounts",
                  ],
                  time: "6-8 hours",
                },
                {
                  week: "Week 3",
                  title: "Data Import & Validation",
                  tasks: [
                    "Import student records",
                    "Migrate fee structures",
                    "Upload academic data",
                    "Validate data integrity",
                  ],
                  time: "10-12 hours",
                },
                {
                  week: "Week 4",
                  title: "Training & Go-Live",
                  tasks: [
                    "Train administrative staff",
                    "Train teachers",
                    "Set up parent access",
                    "Go live with full system",
                  ],
                  time: "8-10 hours",
                },
              ].map((week) => (
                <div key={week.week} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
                    >
                      <span className="font-jakarta font-bold text-sm">{week.week}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3
                      className="font-jakarta font-bold text-lg mb-2"
                      style={{ color: "var(--color-text-default)" }}
                    >
                      {week.title}
                    </h3>
                    <ul className="space-y-1 mb-2">
                      {week.tasks.map((task) => (
                        <li key={task} className="flex items-center gap-2 text-sm">
                          <CheckCircle2
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: "var(--color-action-primary)" }}
                          />
                          <span style={{ color: "var(--color-text-muted)" }}>{task}</span>
                        </li>
                      ))}
                    </ul>
                    <span className="text-xs font-semibold" style={{ color: "var(--color-action-primary)" }}>
                      Estimated time: {week.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Success Metrics */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Expected Results After Migration
            </h2>

            <div
              className="p-8 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, var(--color-chrome-platform) 0%, var(--color-action-primary) 100%)",
                color: "var(--color-text-inverse)",
              }}
            >
              <div className="grid md:grid-cols-3 gap-6 text-center">
                {[
                  {
                    metric: "Time Saved",
                    value: "89%",
                    description: "Reduction in administrative work",
                  },
                  {
                    metric: "Error Rate",
                    value: "0.1%",
                    description: "Compared to 15% with Excel",
                  },
                  {
                    metric: "Parent Satisfaction",
                    value: "96%",
                    description: "With real-time access",
                  },
                  {
                    metric: "Report Generation",
                    value: "5 mins",
                    description: "From 5 days with Excel",
                  },
                  {
                    metric: "Data Accessibility",
                    value: "24/7",
                    description: "From business hours only",
                  },
                  {
                    metric: "ROI Timeline",
                    value: "6 weeks",
                    description: "Full investment recovery",
                  },
                ].map((stat) => (
                  <div key={stat.metric}>
                    <div
                      className="font-jakarta font-bold text-3xl mb-2"
                      style={{ color: "var(--color-text-on-primary-subtle)" }}
                    >
                      {stat.value}
                    </div>
                    <div className="font-jakarta font-semibold text-sm mb-1">{stat.metric}</div>
                    <div className="font-jakarta text-xs opacity-80">{stat.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Common Concerns */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Common Concerns About Leaving Excel
            </h2>

            <div className="space-y-4">
              {[
                {
                  concern: "Our staff isn't tech-savvy",
                  response:
                    "EduMyles is designed for non-technical users. We provide comprehensive training and 24/7 support.",
                },
                {
                  concern: "We have too much historical data",
                  response:
                    "Our migration tools can import years of Excel data in hours, not weeks.",
                },
                {
                  concern: "What if the system goes down?",
                  response:
                    "We guarantee live status monitoring with automatic daily backups and disaster recovery.",
                },
                {
                  concern: "It's too expensive",
                  response:
                    "Most schools save KES 178,500+ monthly by switching from Excel-based processes.",
                },
                {
                  concern: "We'll lose control of our data",
                  response: "You own your data. We provide export tools and full data portability.",
                },
              ].map((item) => (
                <div
                  key={item.concern}
                  className="p-4 rounded-xl"
                  style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                >
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: "var(--color-action-primary)" }} />
                    <div>
                      <h3
                        className="font-jakarta font-semibold text-base mb-2"
                        style={{ color: "var(--color-text-default)" }}
                      >
                        {item.concern}
                      </h3>
                      <p className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {item.response}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Framework */}
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl mb-6" style={{ color: "var(--color-text-default)" }}>
              Quick Decision Framework
            </h2>

            <div
              className="p-6 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, var(--color-surface-default) 0%, var(--color-surface-sunken) 100%)",
                border: "1px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)",
              }}
            >
              <h3 className="font-jakarta font-bold text-lg mb-4" style={{ color: "var(--color-text-default)" }}>
                Answer These Questions:
              </h3>
              <div className="space-y-3">
                {[
                  "Do you spend more than 10 hours per week on Excel maintenance?",
                  "Have you had grade calculation errors in the past term?",
                  "Do parents regularly call for information that should be automated?",
                  "Is preparing reports taking more than 2 days?",
                  "Are you managing multiple conflicting spreadsheets?",
                ].map((question, index) => (
                  <div key={question} className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center font-jakarta font-bold text-sm"
                      style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
                    >
                      {index + 1}
                    </span>
                    <span className="font-jakarta text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {question}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg" style={{ background: "color-mix(in_srgb,_var(--color-action-primary)_15%,_transparent)" }}>
                <p className="font-jakarta font-semibold text-center" style={{ color: "var(--color-status-warning-solid)" }}>
                  If you answered &quot;yes&quot; to 3 or more questions, it&apos;s time to move
                  beyond Excel.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="font-display font-bold text-2xl mb-4" style={{ color: "var(--color-text-default)" }}>
              Ready to Leave Excel Behind?
            </h2>
            <p className="font-jakarta text-lg mb-6" style={{ color: "var(--color-text-muted)" }}>
              Join schools that have transformed their operations with EduMyles.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/book-demo"
                className="inline-flex items-center gap-2 font-jakarta font-bold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
              >
                Schedule Migration Consultation
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 font-jakarta font-semibold text-[16px] px-8 py-4 rounded-xl no-underline"
                style={{ background: "transparent", color: "var(--color-text-default)", border: "2px solid var(--color-border-default)" }}
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
