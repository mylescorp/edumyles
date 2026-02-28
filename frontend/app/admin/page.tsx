"use client";

import { DashboardLayout } from "../components/layout/dashboard-layout";

const stats = [
  { label: "Total Students", value: 0, icon: "👨‍🎓", color: "text-blue-400" },
  { label: "Total Staff", value: 0, icon: "👨‍🏫", color: "text-green-400" },
  { label: "Fees Collected", value: "KES 0", icon: "💰", color: "text-yellow-400" },
  { label: "Pending Fees", value: "KES 0", icon: "⏳", color: "text-red-400" },
  { label: "Present Today", value: "0%", icon: "✅", color: "text-green-400" },
  { label: "Active Modules", value: 0, icon: "📦", color: "text-purple-400" },
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
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-xs uppercase tracking-wide">{s.label}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 transition-colors"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-gray-300 text-xs text-center">{action.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500 text-sm">
          No recent activity yet.
        </div>
      </div>
    </DashboardLayout>
  );
}
