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
  Timer,
  History,
  Webhook,
  Key,
  Palette,
  Rocket,
  Clock,
  Package,
  Kanban,
  ClipboardCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module?: string;
  section?: string;
  children?: NavItem[];
}

export const platformNavItems: NavItem[] = [
  { label: "Dashboard", href: "/platform", icon: LayoutDashboard },
  { label: "All Tenants", href: "/platform/tenants", icon: Building2, section: "Tenants" },
  { label: "Create Tenant", href: "/platform/tenants/create", icon: Rocket, section: "Tenants" },
  { label: "Tenant Success", href: "/platform/tenant-success", icon: TrendingUp, section: "Tenants" },
  { label: "Waitlist", href: "/platform/waitlist", icon: ClipboardCheck, section: "Tenants" },
  { label: "Onboarding", href: "/platform/onboarding", icon: Rocket, section: "Tenants" },

  { label: "All Users", href: "/platform/users", icon: Users, section: "Users & Staff" },
  { label: "Invite Staff", href: "/platform/users/invite", icon: UserCog, section: "Users & Staff" },
  { label: "Impersonation", href: "/platform/impersonation", icon: Eye, section: "Users & Staff" },
  { label: "Staff Performance", href: "/platform/staff-performance", icon: BarChart3, section: "Users & Staff" },

  { label: "Marketplace Overview", href: "/platform/marketplace", icon: ShoppingCart, section: "Marketplace" },
  { label: "Modules", href: "/platform/marketplace/module", icon: Package, section: "Marketplace" },
  { label: "Review Queue", href: "/platform/marketplace/admin", icon: ClipboardList, section: "Marketplace" },
  { label: "Pricing", href: "/platform/marketplace/pricing", icon: DollarSign, section: "Marketplace" },
  { label: "Flags", href: "/platform/marketplace/flags", icon: Flag, section: "Marketplace" },
  { label: "Reviews", href: "/platform/marketplace/reviews", icon: ClipboardCheck, section: "Marketplace" },
  { label: "Pilot Grants", href: "/platform/marketplace/pilot-grants", icon: Sparkles, section: "Marketplace" },
  { label: "Publishers", href: "/platform/marketplace/publishers", icon: Building2, section: "Marketplace" },

  { label: "PM", href: "/platform/pm", icon: Kanban, section: "Project Management" },

  { label: "Billing Dashboard", href: "/platform/billing", icon: DollarSign, section: "Billing" },
  { label: "Plans", href: "/platform/billing/plans", icon: Package, section: "Billing" },
  { label: "Invoices", href: "/platform/billing/invoices", icon: FileText, section: "Billing" },
  { label: "Subscriptions", href: "/platform/billing/subscriptions", icon: Wallet, section: "Billing" },
  { label: "Reports", href: "/platform/billing/reports", icon: BarChart3, section: "Billing" },

  { label: "Pipeline", href: "/platform/crm", icon: ClipboardList, section: "CRM" },
  { label: "Leads", href: "/platform/crm/leads", icon: TrendingUp, section: "CRM" },
  { label: "Create Lead", href: "/platform/crm/leads/create", icon: Rocket, section: "CRM" },
  { label: "Proposals", href: "/platform/crm/proposals", icon: FileText, section: "CRM" },

  { label: "Broadcast", href: "/platform/communications/broadcast", icon: Bell, section: "Communications" },
  { label: "Announcements", href: "/platform/communications", icon: MessageSquare, section: "Communications" },
  { label: "Knowledge Base", href: "/platform/knowledge-base", icon: BookOpen, section: "Communications" },

  { label: "Analytics", href: "/platform/analytics", icon: BarChart3, section: "Operations" },
  { label: "Scheduled Reports", href: "/platform/scheduled-reports", icon: Clock, section: "Operations" },
  { label: "SLA", href: "/platform/sla", icon: Timer, section: "Operations" },
  { label: "Tickets", href: "/platform/tickets", icon: Headphones, section: "Tickets" },

  { label: "Feature Flags", href: "/platform/feature-flags", icon: Flag, section: "Security" },
  { label: "Security", href: "/platform/security", icon: Shield, section: "Security" },
  { label: "Audit Log", href: "/platform/audit", icon: History, section: "Security" },
  { label: "API Keys", href: "/platform/api-keys", icon: Key, section: "Security" },
  { label: "Webhooks", href: "/platform/webhooks", icon: Webhook, section: "Security" },
  { label: "White-Label", href: "/platform/white-label", icon: Palette, section: "Security" },

  { label: "Settings", href: "/platform/settings", icon: Settings, section: "Settings" },
];

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Students", href: "/admin/students", icon: GraduationCap, module: "sis" },
  { label: "Classes", href: "/admin/classes", icon: BookOpen, module: "sis" },
  { label: "Staff", href: "/admin/staff", icon: Users, module: "hr" },
  { label: "Admissions", href: "/admin/admissions", icon: ClipboardList, module: "admissions" },
  { label: "Academics", href: "/admin/academics", icon: BookOpen, module: "academics" },
  { label: "Finance", href: "/admin/finance", icon: DollarSign, module: "finance" },
  { label: "Timetable", href: "/admin/timetable", icon: Calendar, module: "timetable" },
  { label: "HR & Payroll", href: "/admin/hr", icon: UserCog, module: "hr" },
  { label: "Library", href: "/admin/library", icon: Library, module: "library" },
  { label: "Transport", href: "/admin/transport", icon: Bus, module: "transport" },
  { label: "Communications", href: "/admin/communications", icon: MessageSquare, module: "communications" },
  { label: "Support Tickets", href: "/admin/tickets", icon: Headphones, module: "tickets" },
  { label: "eWallet", href: "/admin/ewallet", icon: Wallet, module: "ewallet" },
  { label: "eCommerce", href: "/admin/ecommerce", icon: ShoppingCart, module: "ecommerce" },
  { label: "Users", href: "/admin/users", icon: Users, module: "users" },
  { label: "Modules", href: "/admin/modules", icon: Package },
  { label: "Marketplace", href: "/admin/marketplace", icon: ShoppingCart },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Log", href: "/admin/audit", icon: FileText },
];

export const teacherNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/teacher", icon: LayoutDashboard },
  { label: "My Classes", href: "/portal/teacher/classes", icon: BookOpen, module: "sis" },
  { label: "Gradebook", href: "/portal/teacher/gradebook", icon: ClipboardList, module: "academics" },
  { label: "Attendance", href: "/portal/teacher/attendance", icon: Calendar, module: "sis" },
  { label: "Assignments", href: "/portal/teacher/assignments", icon: FileText, module: "academics" },
  { label: "Timetable", href: "/portal/teacher/timetable", icon: Calendar, module: "timetable" },
  { label: "Support Tickets", href: "/support/tickets", icon: Headphones, module: "tickets" },
];

export const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/student", icon: LayoutDashboard },
  { label: "Grades", href: "/portal/student/grades", icon: GraduationCap, module: "academics" },
  { label: "Timetable", href: "/portal/student/timetable", icon: Calendar, module: "timetable" },
  { label: "Assignments", href: "/portal/student/assignments", icon: FileText, module: "academics" },
  { label: "Attendance", href: "/portal/student/attendance", icon: ClipboardList, module: "sis" },
  { label: "Support Tickets", href: "/support/tickets", icon: Headphones, module: "tickets" },
  { label: "Wallet", href: "/portal/student/wallet", icon: Wallet, module: "ewallet" },
  { label: "Report Cards", href: "/portal/student/report-cards", icon: FileText, module: "academics" },
];

export const parentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/parent", icon: LayoutDashboard },
  { label: "Children", href: "/portal/parent/children", icon: Users, module: "sis" },
  { label: "Fees", href: "/portal/parent/fees", icon: DollarSign, module: "finance" },
  { label: "Messages", href: "/portal/parent/messages", icon: MessageSquare, module: "communications" },
  { label: "Announcements", href: "/portal/parent/announcements", icon: Bell, module: "communications" },
  { label: "Support Tickets", href: "/support/tickets", icon: Headphones, module: "tickets" },
];

export const alumniNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/alumni", icon: LayoutDashboard },
  { label: "Transcripts", href: "/portal/alumni/transcripts", icon: FileText },
  { label: "Directory", href: "/portal/alumni/directory", icon: Users },
  { label: "Events", href: "/portal/alumni/events", icon: Calendar },
  { label: "Support Tickets", href: "/support/tickets", icon: Headphones },
];

export const partnerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/partner", icon: LayoutDashboard },
  { label: "Students", href: "/portal/partner/students", icon: GraduationCap, module: "sis" },
  { label: "Reports", href: "/portal/partner/reports", icon: FileText, module: "finance" },
  { label: "Payments", href: "/portal/partner/payments", icon: DollarSign, module: "finance" },
  { label: "Messages", href: "/portal/partner/messages", icon: MessageSquare, module: "communications" },
  { label: "Support Tickets", href: "/support/tickets", icon: Headphones, module: "tickets" },
  { label: "Profile", href: "/portal/partner/profile", icon: Building2 },
];

export function getNavItemsForRole(role: string): NavItem[] {
  const normalizedRole = role === "platform_admin" ? "super_admin" : role;
  switch (normalizedRole) {
    case "master_admin":
    case "super_admin":
      return platformNavItems;
    case "school_admin":
    case "principal":
    case "bursar":
    case "hr_manager":
    case "librarian":
    case "transport_manager":
      return adminNavItems;
    case "teacher":
      return teacherNavItems;
    case "student":
      return studentNavItems;
    case "parent":
      return parentNavItems;
    case "alumni":
      return alumniNavItems;
    case "partner":
      return partnerNavItems;
    default:
      return adminNavItems;
  }
}

export function getRoleDashboard(role: string): string {
  const normalizedRole = role === "platform_admin" ? "super_admin" : role;
  switch (normalizedRole) {
    case "master_admin":
    case "super_admin":
      return "/platform";
    case "school_admin":
    case "principal":
    case "bursar":
    case "hr_manager":
    case "librarian":
    case "transport_manager":
      return "/admin";
    case "teacher":
      return "/portal/teacher";
    case "parent":
      return "/portal/parent";
    case "student":
      return "/portal/student";
    case "alumni":
      return "/portal/alumni";
    case "partner":
      return "/portal/partner";
    default:
      return "/admin";
  }
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    master_admin: "Master Admin",
    super_admin: "Super Admin",
    platform_manager: "Platform Manager",
    support_agent: "Support Agent",
    billing_admin: "Billing Admin",
    marketplace_reviewer: "Marketplace Reviewer",
    content_moderator: "Content Moderator",
    analytics_viewer: "Analytics Viewer",
    school_admin: "School Admin",
    principal: "Principal",
    teacher: "Teacher",
    student: "Student",
    parent: "Parent",
    bursar: "Bursar",
    hr_manager: "HR Manager",
    librarian: "Librarian",
    transport_manager: "Transport Manager",
    board_member: "Board Member",
    alumni: "Alumni",
    partner: "Partner",
  };
  const normalizedRole = role === "platform_admin" ? "super_admin" : role;
  return labels[normalizedRole] ?? normalizedRole;
}
