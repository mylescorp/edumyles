"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  DollarSign,
  Bus,
  Library,
  MessageSquare,
  Wallet,
  ShoppingCart,
  Settings,
  ClipboardList,
  FileText,
  Shield,
  UserCog,
  Bell,
  BarChart3,
  Eye,
  Headphones,
  Flag,
  TrendingUp,
  Activity,
  Zap,
  Download,
  Timer,
  History,
  Webhook,
  Key,
  Palette,
  Rocket,
  Lock,
  Clock,
  Package,
  Kanban,
  Code2,
  ExternalLink,
} from "lucide-react";

interface PanelLink {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface PanelSection {
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  role: string;
  dashboardHref: string;
  links: PanelLink[];
}

const panels: PanelSection[] = [
  {
    title: "Platform Panel",
    description: "Super Admin & Master Admin — Platform-wide management",
    color: "text-violet-700 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
    role: "master_admin / super_admin",
    dashboardHref: "/platform",
    links: [
      { label: "Dashboard", href: "/platform", icon: LayoutDashboard },
      { label: "Tenants", href: "/platform/tenants", icon: Building2 },
      { label: "Create Tenant", href: "/platform/tenants/create", icon: Building2, badge: "form" },
      { label: "CRM Pipeline", href: "/platform/crm", icon: TrendingUp },
      { label: "Proposals", href: "/platform/crm/proposals", icon: FileText },
      { label: "Users", href: "/platform/users", icon: Users },
      { label: "Invite User", href: "/platform/users/invite", icon: Users, badge: "form" },
      { label: "Staff Performance", href: "/platform/staff-performance", icon: BarChart3 },
      { label: "Tickets", href: "/platform/tickets", icon: Headphones },
      { label: "Create Ticket", href: "/platform/tickets/create", icon: Headphones, badge: "form" },
      { label: "Communications", href: "/platform/communications", icon: MessageSquare },
      { label: "Broadcast", href: "/platform/communications/broadcast", icon: MessageSquare },
      { label: "System Health", href: "/platform/health", icon: Activity },
      { label: "Security Ops", href: "/platform/security", icon: Shield },
      { label: "Automation", href: "/platform/automation", icon: Zap },
      { label: "Tenant Success", href: "/platform/tenant-success", icon: TrendingUp },
      { label: "Analytics", href: "/platform/analytics", icon: BarChart3 },
      { label: "Marketplace", href: "/platform/marketplace", icon: ShoppingCart },
      { label: "Marketplace Admin", href: "/platform/marketplace/admin", icon: ShoppingCart },
      { label: "Developer Portal", href: "/platform/marketplace/developer", icon: Code2 },
      { label: "Project Management", href: "/platform/pm", icon: Kanban },
      { label: "Billing", href: "/platform/billing", icon: DollarSign },
      { label: "Create Invoice", href: "/platform/billing/invoices/create", icon: DollarSign, badge: "form" },
      { label: "Feature Flags", href: "/platform/feature-flags", icon: Flag },
      { label: "Impersonation", href: "/platform/impersonation", icon: Eye },
      { label: "Knowledge Base", href: "/platform/knowledge-base", icon: BookOpen },
      { label: "Data Export", href: "/platform/data-export", icon: Download },
      { label: "SLA Management", href: "/platform/sla", icon: Timer },
      { label: "Webhooks", href: "/platform/webhooks", icon: Webhook },
      { label: "API Keys", href: "/platform/api-keys", icon: Key },
      { label: "White-Label", href: "/platform/white-label", icon: Palette },
      { label: "Onboarding", href: "/platform/onboarding", icon: Rocket },
      { label: "Role Builder", href: "/platform/role-builder", icon: Lock },
      { label: "Scheduled Reports", href: "/platform/scheduled-reports", icon: Clock },
      { label: "Changelog", href: "/platform/changelog", icon: History },
      { label: "AI Support", href: "/platform/ai-support", icon: Headphones },
      { label: "Operations Center", href: "/platform/operations", icon: Activity },
      { label: "Audit Log", href: "/platform/audit", icon: FileText },
      { label: "Settings", href: "/platform/settings", icon: Settings },
    ],
  },
  {
    title: "Admin Panel",
    description: "School Admin, Principal, Bursar, HR Manager — School management",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    role: "school_admin / principal / bursar / hr_manager",
    dashboardHref: "/admin",
    links: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Students", href: "/admin/students", icon: GraduationCap, badge: "sis" },
      { label: "Add Student", href: "/admin/students/create", icon: GraduationCap, badge: "form" },
      { label: "Import Students", href: "/admin/students/import", icon: GraduationCap, badge: "form" },
      { label: "Classes", href: "/admin/classes", icon: BookOpen, badge: "sis" },
      { label: "Create Class", href: "/admin/classes/create", icon: BookOpen, badge: "form" },
      { label: "Academics", href: "/admin/academics", icon: BookOpen, badge: "academics" },
      { label: "Staff", href: "/admin/staff", icon: Users, badge: "hr" },
      { label: "Hire Staff", href: "/admin/staff/create", icon: Users, badge: "form" },
      { label: "Admissions", href: "/admin/admissions", icon: ClipboardList, badge: "admissions" },
      { label: "Finance", href: "/admin/finance", icon: DollarSign, badge: "finance" },
      { label: "Fee Management", href: "/admin/finance/fees", icon: DollarSign, badge: "finance" },
      { label: "Invoices", href: "/admin/finance/invoices", icon: FileText, badge: "finance" },
      { label: "Create Invoice", href: "/admin/finance/invoices/create", icon: FileText, badge: "form" },
      { label: "Timetable", href: "/admin/timetable", icon: Calendar, badge: "timetable" },
      { label: "Schedule Builder", href: "/admin/timetable/schedule", icon: Calendar, badge: "timetable" },
      { label: "Events", href: "/admin/timetable/events", icon: Calendar, badge: "timetable" },
      { label: "HR & Payroll", href: "/admin/hr", icon: UserCog, badge: "hr" },
      { label: "Leave Management", href: "/admin/hr/leave", icon: UserCog, badge: "hr" },
      { label: "Payroll", href: "/admin/hr/payroll", icon: DollarSign, badge: "hr" },
      { label: "Library", href: "/admin/library", icon: Library, badge: "library" },
      { label: "Book Catalog", href: "/admin/library/books", icon: Library, badge: "library" },
      { label: "Circulation", href: "/admin/library/circulation", icon: Library, badge: "library" },
      { label: "Transport", href: "/admin/transport", icon: Bus, badge: "transport" },
      { label: "Routes", href: "/admin/transport/routes", icon: Bus, badge: "transport" },
      { label: "GPS Tracking", href: "/admin/transport/tracking", icon: Bus, badge: "transport" },
      { label: "Communications", href: "/admin/communications", icon: MessageSquare, badge: "comms" },
      { label: "eWallet", href: "/admin/ewallet", icon: Wallet, badge: "ewallet" },
      { label: "Student Wallets", href: "/admin/ewallet/wallets", icon: Wallet, badge: "ewallet" },
      { label: "Transactions", href: "/admin/ewallet/transactions", icon: Wallet, badge: "ewallet" },
      { label: "eCommerce", href: "/admin/ecommerce", icon: ShoppingCart, badge: "ecommerce" },
      { label: "Orders", href: "/admin/ecommerce/orders", icon: ShoppingCart, badge: "ecommerce" },
      { label: "Tickets", href: "/admin/tickets", icon: Headphones, badge: "tickets" },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Invite User", href: "/admin/users/invite", icon: Users, badge: "form" },
      { label: "Modules", href: "/admin/modules", icon: Package },
      { label: "Marketplace", href: "/admin/marketplace", icon: ShoppingCart },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Audit Log", href: "/admin/audit", icon: FileText },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Security", href: "/admin/security", icon: Shield },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    title: "Student Portal",
    description: "Student — Personal academic dashboard",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    role: "student",
    dashboardHref: "/portal/student",
    links: [
      { label: "Dashboard", href: "/portal/student", icon: LayoutDashboard },
      { label: "Grades", href: "/portal/student/grades", icon: GraduationCap, badge: "academics" },
      { label: "Timetable", href: "/portal/student/timetable", icon: Calendar, badge: "timetable" },
      { label: "Assignments", href: "/portal/student/assignments", icon: FileText, badge: "academics" },
      { label: "Attendance", href: "/portal/student/attendance", icon: ClipboardList, badge: "sis" },
      { label: "Report Cards", href: "/portal/student/report-cards", icon: FileText, badge: "academics" },
      { label: "Wallet", href: "/portal/student/wallet", icon: Wallet, badge: "ewallet" },
      { label: "Top Up Wallet", href: "/portal/student/wallet/topup", icon: Wallet, badge: "form" },
      { label: "Wallet Transactions", href: "/portal/student/wallet/transactions", icon: Wallet, badge: "ewallet" },
      { label: "Communications", href: "/portal/student/communications", icon: MessageSquare, badge: "comms" },
      { label: "Announcements", href: "/portal/student/announcements", icon: Bell, badge: "comms" },
      { label: "Notifications", href: "/portal/student/notifications", icon: Bell },
      { label: "Profile", href: "/portal/student/profile", icon: UserCog },
      { label: "Support Tickets", href: "/support/tickets", icon: Headphones, badge: "tickets" },
    ],
  },
  {
    title: "Teacher Portal",
    description: "Teacher — Classroom and academic management",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    role: "teacher",
    dashboardHref: "/portal/teacher",
    links: [
      { label: "Dashboard", href: "/portal/teacher", icon: LayoutDashboard },
      { label: "My Classes", href: "/portal/teacher/classes", icon: BookOpen, badge: "sis" },
      { label: "Gradebook", href: "/portal/teacher/gradebook", icon: ClipboardList, badge: "academics" },
      { label: "Attendance", href: "/portal/teacher/attendance", icon: Calendar, badge: "sis" },
      { label: "Assignments", href: "/portal/teacher/assignments", icon: FileText, badge: "academics" },
      { label: "Create Assignment", href: "/portal/teacher/assignments/create", icon: FileText, badge: "form" },
      { label: "Timetable", href: "/portal/teacher/timetable", icon: Calendar, badge: "timetable" },
      { label: "Communications", href: "/portal/teacher/communications", icon: MessageSquare, badge: "comms" },
      { label: "Notifications", href: "/portal/teacher/notifications", icon: Bell },
      { label: "Profile", href: "/portal/teacher/profile", icon: UserCog },
      { label: "Support Tickets", href: "/support/tickets", icon: Headphones, badge: "tickets" },
    ],
  },
  {
    title: "Parent Portal",
    description: "Parent / Guardian — Child monitoring and school communication",
    color: "text-rose-700 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800",
    role: "parent",
    dashboardHref: "/portal/parent",
    links: [
      { label: "Dashboard", href: "/portal/parent", icon: LayoutDashboard },
      { label: "Children", href: "/portal/parent/children", icon: Users, badge: "sis" },
      { label: "Fees", href: "/portal/parent/fees", icon: DollarSign, badge: "finance" },
      { label: "Pay Fees", href: "/portal/parent/fees/pay", icon: DollarSign, badge: "form" },
      { label: "Payment History", href: "/portal/parent/fees/history", icon: DollarSign, badge: "finance" },
      { label: "Messages", href: "/portal/parent/messages", icon: MessageSquare, badge: "comms" },
      { label: "Announcements", href: "/portal/parent/announcements", icon: Bell, badge: "comms" },
      { label: "Payments", href: "/portal/parent/payments", icon: DollarSign, badge: "finance" },
      { label: "Notifications", href: "/portal/parent/notifications", icon: Bell },
      { label: "Profile", href: "/portal/parent/profile", icon: UserCog },
      { label: "Enhanced Dashboard", href: "/portal/parent/dashboard/enhanced", icon: LayoutDashboard },
      { label: "Support Tickets", href: "/support/tickets", icon: Headphones, badge: "tickets" },
    ],
  },
  {
    title: "Alumni Portal",
    description: "Alumni — Graduate network and records",
    color: "text-cyan-700 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    role: "alumni",
    dashboardHref: "/portal/alumni",
    links: [
      { label: "Dashboard", href: "/portal/alumni", icon: LayoutDashboard },
      { label: "Transcripts", href: "/portal/alumni/transcripts", icon: FileText },
      { label: "Alumni Directory", href: "/portal/alumni/directory", icon: Users },
      { label: "Events", href: "/portal/alumni/events", icon: Calendar },
      { label: "Profile", href: "/portal/alumni/profile", icon: UserCog },
      { label: "Notifications", href: "/portal/alumni/notifications", icon: Bell },
      { label: "Support Tickets", href: "/support/tickets", icon: Headphones, badge: "tickets" },
    ],
  },
  {
    title: "Partner Portal",
    description: "Partner — Third-party access and financial reports",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    role: "partner",
    dashboardHref: "/portal/partner",
    links: [
      { label: "Dashboard", href: "/portal/partner", icon: LayoutDashboard },
      { label: "Students", href: "/portal/partner/students", icon: GraduationCap, badge: "sis" },
      { label: "Reports", href: "/portal/partner/reports", icon: BarChart3, badge: "finance" },
      { label: "Payments", href: "/portal/partner/payments", icon: DollarSign, badge: "finance" },
      { label: "Messages", href: "/portal/partner/messages", icon: MessageSquare, badge: "comms" },
      { label: "Communications", href: "/portal/partner/communications", icon: MessageSquare, badge: "comms" },
      { label: "Notifications", href: "/portal/partner/notifications", icon: Bell },
      { label: "Profile", href: "/portal/partner/profile", icon: Building2 },
      { label: "Support Tickets", href: "/support/tickets", icon: Headphones, badge: "tickets" },
    ],
  },
  {
    title: "Support System",
    description: "Shared — Cross-role support ticket management",
    color: "text-slate-700 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    borderColor: "border-slate-200 dark:border-slate-800",
    role: "all roles",
    dashboardHref: "/support/tickets",
    links: [
      { label: "All Tickets", href: "/support/tickets", icon: Headphones },
      { label: "Create Ticket", href: "/support/tickets/create", icon: Headphones, badge: "form" },
    ],
  },
  {
    title: "Auth Pages",
    description: "Authentication — Login, signup, and session management",
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
    role: "unauthenticated",
    dashboardHref: "/auth/login",
    links: [
      { label: "Login", href: "/auth/login", icon: Lock },
      { label: "Sign Up", href: "/auth/signup", icon: UserCog },
      { label: "Auth Error", href: "/auth/error", icon: Shield },
    ],
  },
];

const badgeColors: Record<string, string> = {
  form: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  sis: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  academics: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  finance: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  hr: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  timetable: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  library: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  transport: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  comms: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  ewallet: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  ecommerce: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  tickets: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  admissions: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

export default function DevPanelsPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-600 text-white">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                EduMyles Dev Navigator
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Developer panel — all user panels &amp; pages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Dev Only — Do not expose in production
          </div>
        </div>
      </div>

      {/* Panel count summary */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3 mb-8">
          {panels.map((panel) => (
            <a
              key={panel.title}
              href={`#${panel.title.toLowerCase().replace(/\s+/g, "-")}`}
              className={`rounded-lg border p-3 text-center cursor-pointer hover:shadow-md transition-shadow ${panel.bgColor} ${panel.borderColor}`}
            >
              <p className={`text-xs font-semibold leading-tight ${panel.color}`}>
                {panel.title.replace(" Panel", "").replace(" Portal", "").replace(" System", "").replace(" Pages", "")}
              </p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-1">
                {panel.links.length}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">pages</p>
            </a>
          ))}
        </div>

        {/* Panel sections */}
        <div className="space-y-8">
          {panels.map((panel) => {
            const Icon = LayoutDashboard;
            return (
              <section
                key={panel.title}
                id={panel.title.toLowerCase().replace(/\s+/g, "-")}
                className={`rounded-xl border ${panel.borderColor} overflow-hidden`}
              >
                {/* Section header */}
                <div className={`${panel.bgColor} px-6 py-4 border-b ${panel.borderColor}`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className={`text-base font-bold ${panel.color}`}>{panel.title}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {panel.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-900/60 rounded px-2 py-1 border border-gray-200 dark:border-gray-700 font-mono">
                        role: {panel.role}
                      </span>
                      <Link
                        href={panel.dashboardHref}
                        target="_blank"
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
                          panel.color.includes("violet")
                            ? "bg-violet-600"
                            : panel.color.includes("blue")
                              ? "bg-blue-600"
                              : panel.color.includes("emerald")
                                ? "bg-emerald-600"
                                : panel.color.includes("amber")
                                  ? "bg-amber-600"
                                  : panel.color.includes("rose")
                                    ? "bg-rose-600"
                                    : panel.color.includes("cyan")
                                      ? "bg-cyan-600"
                                      : panel.color.includes("orange")
                                        ? "bg-orange-600"
                                        : "bg-gray-600"
                        }`}
                      >
                        Open Dashboard
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Links grid */}
                <div className="bg-white dark:bg-gray-900 p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {panel.links.map((link) => {
                      const LinkIcon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          className="group flex items-start gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                          <LinkIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${panel.color} opacity-70 group-hover:opacity-100`} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-tight truncate">
                              {link.label}
                            </p>
                            {link.badge && (
                              <span
                                className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                                  badgeColors[link.badge] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                              >
                                {link.badge}
                              </span>
                            )}
                            <p className="text-[10px] text-gray-400 dark:text-gray-600 font-mono mt-0.5 truncate">
                              {link.href}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Some pages require a user to be authenticated with the correct role. Pages with module badges (e.g. <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded text-xs">sis</code>, <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded text-xs">finance</code>) also require that module to be installed in the tenant.
        </div>
      </div>
    </div>
  );
}
