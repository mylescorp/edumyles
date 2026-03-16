"use client";

import { useState } from "react";
import Link from "next/link";

const moduleCategories = [
  {
    key: "student",
    label: "Student Management",
    description:
      "Manage the entire student lifecycle — from admissions and enrollment through academics, assessments, and alumni tracking. Every record, every interaction, one single source of truth.",
    apps: [
      { name: "Student Information System", desc: "Profiles, classes, streams, demographics" },
      { name: "Admissions & Enrollment",    desc: "Applications, waitlists, auto-allocation" },
      { name: "Academics & Gradebook",      desc: "Assessments, report cards, CBC/8-4-4" },
      { name: "Communications Hub",         desc: "SMS, email, in-app parent messaging" },
    ],
  },
  {
    key: "finance",
    label: "Finance & Billing",
    description:
      "Streamline fee collection, invoicing, and financial reporting. Automated reminders, real-time payment tracking, and full reconciliation across M-Pesa, Airtel Money, bank transfers, and cards.",
    apps: [
      { name: "Fee Management",           desc: "Tuition, billing, flexible payment plans" },
      { name: "Mobile Money Integration", desc: "M-Pesa, Airtel Money, MTN MoMo" },
      { name: "Financial Reports",        desc: "Revenue dashboards, expense analytics" },
      { name: "Payment Reminders",        desc: "Automated SMS & email notifications" },
    ],
  },
  {
    key: "operations",
    label: "Operations & HR",
    description:
      "Manage staff records, payroll, leave management, timetable creation, transport routing, library management, and facility scheduling — all from one central operations hub.",
    apps: [
      { name: "HR & Payroll",         desc: "Staff records, contracts, salary processing" },
      { name: "Timetable Builder",    desc: "Drag-and-drop scheduling, conflict detection" },
      { name: "Transport Management", desc: "Bus routes, fleet tracking, driver assignments" },
      { name: "Library System",       desc: "Catalogue, circulation, overdue tracking" },
    ],
  },
  {
    key: "portals",
    label: "Stakeholder Portals",
    description:
      "Dedicated portals for every user: parents track fees and grades, teachers manage classes and assignments, students access timetables and results, and alumni stay connected.",
    apps: [
      { name: "Parent Portal",  desc: "Fees, grades, attendance, messaging" },
      { name: "Teacher Portal", desc: "Classes, gradebook, assignments, attendance" },
      { name: "Student Portal", desc: "Timetable, results, wallet, announcements" },
      { name: "Alumni Portal",  desc: "Events, networking, school updates" },
    ],
  },
] as const;

export default function ModulesSection() {
  const [activeTab, setActiveTab] = useState<(typeof moduleCategories)[number]["key"]>("student");
  const activeCategory = moduleCategories.find((c) => c.key === activeTab) ?? moduleCategories[0];

  return (
    <section className="modules-section">
      <div className="section-header centered" data-reveal>
        <h2>11 modules. One platform. Zero silos.</h2>
        <p className="section-subtitle">
          Everything you need to run your school efficiently — from admissions to alumni, finance to
          facilities. Pick the modules you need, activate more as you grow.
        </p>
      </div>

      {/* Pill tabs */}
      <div
        className="module-tabs"
        role="tablist"
        aria-label="Module categories"
        data-reveal
        data-reveal-delay="100"
      >
        {moduleCategories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            role="tab"
            className={`module-tab ${activeTab === cat.key ? "active" : ""}`}
            aria-selected={activeTab === cat.key}
            aria-controls={`module-panel-${cat.key}`}
            onClick={() => setActiveTab(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/*
        The `key` prop forces React to unmount/remount this div when the tab
        changes, re-triggering the tabFadeIn CSS animation defined in
        landing-premium.css.
      */}
      <div
        key={activeTab}
        className="module-tab-content"
        role="tabpanel"
        id={`module-panel-${activeCategory.key}`}
      >
        <div className="module-tab-text">
          <h3>{activeCategory.label}</h3>
          <p>{activeCategory.description}</p>
          <Link className="btn btn-primary" href="/auth/signup/api">
            Try It Free
          </Link>
        </div>

        <div className="module-tab-apps">
          {activeCategory.apps.map((app, i) => (
            <div
              key={app.name}
              className="module-app-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <h4>{app.name}</h4>
              <p>{app.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
