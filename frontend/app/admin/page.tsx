"use client";

import { DashboardLayout } from "../components/layout/dashboard-layout";

const stats = [
  { label: "Total Students", value: 0, icon: "👨‍🎓", color: "text-forest-500" },
  { label: "Total Staff", value: 0, icon: "👨‍🏫", color: "text-forest-400" },
  { label: "Fees Collected", value: "KES 0", icon: "💰", color: "text-amber-600" },
  { label: "Pending Fees", value: "KES 0", icon: "⏳", color: "text-crimson-500" },
  { label: "Present Today", value: "0%", icon: "✅", color: "text-forest-500" },
  { label: "Active Modules", value: 0, icon: "📦", color: "text-zoho-blue" },
];

const quickActions = [
  { label: "Add Student", icon: "➕", href: "/admin/students/new" },
  { label: "Record Payment", icon: "💳", href: "/admin/finance/payment" },
  { label: "Mark Attendance", icon: "✅", href: "/admin/attendance" },
  { label: "Send Notice", icon: "📢", href: "/admin/communications/new" },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout
      title="School Dashboard"
      subtitle="Welcome back, Admin"
      role="school_admin"
      schoolName="My School"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-cream-400 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-charcoal-300 text-xs uppercase tracking-wide font-semibold">{s.label}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-cream-400 rounded-2xl p-6 mb-6 shadow-sm">
        <h2 className="text-charcoal font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 bg-cream hover:bg-cream-300 border border-cream-400 rounded-xl p-4 transition-colors"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-charcoal-400 text-xs text-center font-medium">{action.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white border border-cream-400 rounded-2xl p-6 shadow-sm">
        <h2 className="text-charcoal font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-charcoal-300 text-sm">
          No recent activity yet.
        </div>
      </div>
    </DashboardLayout>
  );
}
