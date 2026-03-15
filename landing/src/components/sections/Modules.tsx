"use client";

import { useState } from "react";

const modules = [
  {
    id: "sis",
    name: "Student Information System",
    icon: "🎓",
    features: [
      "Student profiles & admissions",
      "Enrollment management",
      "Transfer certificates",
      "NEMIS integration",
    ],
    description:
      "Complete digital student records from day one. Manage admissions, enrollments, and generate official certificates and NEMIS reports instantly.",
  },
  {
    id: "admissions",
    name: "Admissions & Enrollment",
    icon: "📋",
    features: [
      "Online application portal",
      "Document upload & verification",
      "Interview scheduling",
      "Offer letters & acceptance",
    ],
    description:
      "Streamline your admissions process with an online portal. Parents apply online, upload documents, and track application status in real-time.",
  },
  {
    id: "finance",
    name: "Fee & Finance Management",
    icon: "💳",
    features: [
      "M-Pesa Daraja integration",
      "Airtel Money support",
      "Fee statements & receipts",
      "Defaulter alerts & reminders",
    ],
    description:
      "Collect school fees via M-Pesa, Airtel Money, or bank transfer. Automated fee statements, defaulter alerts, and real-time financial reporting.",
    isDefault: true,
  },
  {
    id: "timetable",
    name: "Timetable & Scheduling",
    icon: "📅",
    features: [
      "Drag-and-drop timetable builder",
      "Clash detection",
      "Teacher allocation",
      "Room & venue booking",
    ],
    description:
      "Build conflict-free timetables in minutes. Auto-detect clashes, allocate teachers, and manage room bookings across all classes.",
  },
  {
    id: "academics",
    name: "Academics & Gradebook",
    icon: "📊",
    features: [
      "Digital marking & grading",
      "CBC & 8-4-4 support",
      "Report card generation",
      "Parent-visible results",
    ],
    description:
      "Digital gradebook supporting both CBC and 8-4-4 curriculums. Generate report cards automatically and give parents real-time access to their child's results.",
  },
  {
    id: "hr",
    name: "HR & Payroll",
    icon: "👥",
    features: [
      "Staff profiles & records",
      "Payroll processing",
      "Leave management",
      "NHIF & NSSF deductions",
    ],
    description:
      "Manage all staff records, process payroll, and handle leave requests. Automatic NHIF and NSSF deductions with detailed payslip generation.",
  },
  {
    id: "library",
    name: "Library Management",
    icon: "📚",
    features: [
      "Digital book catalogue",
      "Barcode scanning",
      "Borrowing & returns",
      "Overdue alerts",
    ],
    description:
      "Digitise your school library. Catalogue all resources, manage borrowing with barcode scanning, and automatically alert students with overdue books.",
  },
  {
    id: "transport",
    name: "Transport Management",
    icon: "🚌",
    features: [
      "Live GPS tracking",
      "Route management",
      "Parent notifications",
      "Driver records & safety",
    ],
    description:
      "Know where every school bus is in real-time. Parents receive instant notifications when the bus is 5 minutes away. Manage routes, drivers, and safety records.",
  },
  {
    id: "communications",
    name: "Communications",
    icon: "📱",
    features: [
      "SMS & email broadcasts",
      "In-app push notifications",
      "WhatsApp integration",
      "Swahili language support",
    ],
    description:
      "Reach every parent instantly. Send SMS, email, in-app, and WhatsApp messages in English or Swahili. Full broadcast and targeted messaging.",
  },
  {
    id: "ewallet",
    name: "eWallet",
    icon: "💰",
    features: [
      "School canteen payments",
      "School shop credits",
      "Parent top-up via M-Pesa",
      "Transaction history",
    ],
    description:
      "Replace cash in your school with a digital eWallet. Parents top up via M-Pesa. Students pay in the canteen, shop, and for trips with their student card.",
  },
  {
    id: "ecommerce",
    name: "eCommerce",
    icon: "🛒",
    features: [
      "Uniform shop online",
      "School supplies ordering",
      "Order management",
      "Delivery or collection",
    ],
    description:
      "Run your school's online shop. Sell uniforms, books, and stationery directly to parents. Orders managed online with delivery or collection options.",
  },
];

export default function Modules() {
  const [activeId, setActiveId] = useState("finance");
  const active = (modules.find((m) => m.id === activeId) ?? modules[2])!;

  return (
    <section id="modules" className="py-20 lg:py-32 bg-off-white" aria-label="All 11 modules">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="font-inter font-semibold text-gold uppercase tracking-widest text-sm mb-3">
            Complete Platform
          </p>
          <h2 className="font-jakarta font-bold text-4xl lg:text-5xl text-navy mb-4">
            11 Modules. One Platform.
          </h2>
          <p className="font-inter text-lg text-mid-grey max-w-2xl mx-auto">
            Every operation your school runs — from admissions to alumni — managed from a single
            dashboard.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Tab list */}
          <div className="lg:w-72 flex-shrink-0">
            <nav
              className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0"
              aria-label="Module tabs"
            >
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveId(mod.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl font-inter font-medium text-sm text-left transition-all ${
                    activeId === mod.id
                      ? "bg-navy text-white shadow-navy-glow"
                      : "text-mid-grey hover:bg-white hover:text-navy"
                  }`}
                  aria-selected={activeId === mod.id}
                >
                  <span className="text-base">{mod.icon}</span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{mod.name}</span>
                  {activeId === mod.id && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div
            className="flex-1 bg-white rounded-2xl border border-light-grey p-6 lg:p-8 shadow-sm"
            key={activeId}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="text-5xl">{active.icon}</div>
              <div>
                <div className="inline-block px-3 py-1 bg-gold/10 rounded-full text-gold text-xs font-inter font-semibold mb-2">
                  Module {modules.findIndex((m) => m.id === activeId) + 1} of 11
                </div>
                <h3 className="font-jakarta font-bold text-2xl text-navy">{active.name}</h3>
              </div>
            </div>
            <p className="font-inter text-base text-mid-grey leading-relaxed mb-6">
              {active.description}
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 mb-8">
              {active.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-gold font-bold mt-0.5">✓</span>
                  <span className="font-inter text-sm text-dark-grey">{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3 pt-4 border-t border-light-grey">
              <a
                href="#demo"
                className="bg-gold hover:bg-gold-dark text-white font-inter font-semibold text-sm px-6 py-2.5 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                See it in action →
              </a>
              <span className="font-inter text-xs text-mid-grey">
                Free 30-min personalised demo
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
