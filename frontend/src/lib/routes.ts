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
  Activity,
  Webhook,
  Key,
  Palette,
  Rocket,
  Clock,
  Package,
  Kanban,
  ClipboardCheck,
  Sparkles,
  Store,
  Code2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module?: string;
  section?: string;
  permission?: string | null;
  children?: NavItem[];
}

export const platformNavItems: NavItem[] = [
  { label: "Dashboard", href: "/platform", icon: LayoutDashboard, permission: null },
  { label: "All Tenants", href: "/platform/tenants", icon: Building2, section: "Tenants", permission: "tenants.view" },
  { label: "Create Tenant", href: "/platform/tenants/create", icon: Rocket, section: "Tenants", permission: "tenants.create" },
  { label: "Tenant Success", href: "/platform/tenant-success", icon: TrendingUp, section: "Tenants", permission: "onboarding.view" },
  { label: "Waitlist", href: "/platform/waitlist", icon: ClipboardCheck, section: "Tenants", permission: "waitlist.view" },
  { label: "Onboarding", href: "/platform/onboarding", icon: Rocket, section: "Tenants", permission: "onboarding.view" },

  { label: "All Users", href: "/platform/users", icon: Users, section: "Users & Staff", permission: "platform_users.view" },
  { label: "Invite Staff", href: "/platform/users/invite", icon: UserCog, section: "Users & Staff", permission: "platform_users.invite" },
  { label: "Roles", href: "/platform/users/roles", icon: Shield, section: "Users & Staff", permission: "platform_users.view" },
  { label: "Impersonation", href: "/platform/impersonation", icon: Eye, section: "Users & Staff", permission: "tenants.impersonate" },
  { label: "Staff Performance", href: "/platform/staff-performance", icon: BarChart3, section: "Users & Staff", permission: "staff_performance.view" },
  { label: "Sessions", href: "/platform/users/sessions", icon: Clock, section: "Users & Staff", permission: "platform_users.view_sessions" },
  { label: "Activity Logs", href: "/platform/users/activity", icon: Activity, section: "Users & Staff", permission: "platform_users.view_activity" },

  { label: "Marketplace Overview", href: "/platform/marketplace", icon: ShoppingCart, section: "Marketplace", permission: "marketplace.view" },
  { label: "Modules", href: "/platform/marketplace/module", icon: Package, section: "Marketplace", permission: "marketplace.view" },
  { label: "Review Queue", href: "/platform/marketplace/admin", icon: ClipboardList, section: "Marketplace", permission: "marketplace.review_modules" },
  { label: "Pricing", href: "/platform/marketplace/pricing", icon: DollarSign, section: "Marketplace", permission: "marketplace.manage_pricing" },
  { label: "Flags", href: "/platform/marketplace/flags", icon: Flag, section: "Marketplace", permission: "marketplace.manage_flags" },
  { label: "Reviews", href: "/platform/marketplace/reviews", icon: ClipboardCheck, section: "Marketplace", permission: "marketplace.manage_reviews" },
  { label: "Pilot Grants", href: "/platform/marketplace/pilot-grants", icon: Sparkles, section: "Marketplace", permission: "marketplace.manage_pilot_grants" },
  { label: "Publishers", href: "/platform/marketplace/publishers", icon: Building2, section: "Marketplace", permission: "publishers.view" },

  { label: "Reseller Management", href: "/admin/resellers", icon: Store, section: "Resellers", permission: "marketplace.view" },
  { label: "Reseller Analytics", href: "/admin/resellers/analytics", icon: BarChart3, section: "Resellers", permission: "analytics.view_platform" },
  { label: "Reseller Applications", href: "/admin/resellers/applications", icon: ClipboardCheck, section: "Resellers", permission: "marketplace.review_modules" },
  { label: "Reseller Settings", href: "/admin/resellers/settings", icon: Settings, section: "Resellers", permission: "settings.view" },
  { label: "Affiliate Dashboard", href: "/portal/affiliate", icon: Users, section: "Resellers", permission: "marketplace.view" },
  { label: "Affiliate Referrals", href: "/portal/affiliate/referrals", icon: TrendingUp, section: "Resellers", permission: "marketplace.view" },
  { label: "Affiliate Analytics", href: "/portal/affiliate/analytics", icon: BarChart3, section: "Resellers", permission: "analytics.view_platform" },
  { label: "Affiliate Marketing", href: "/portal/affiliate/marketing", icon: MessageSquare, section: "Resellers", permission: "marketplace.view" },
  { label: "Affiliate Settings", href: "/portal/affiliate/settings", icon: Settings, section: "Resellers", permission: "settings.view" },

  { label: "Developer Portal", href: "/platform/marketplace/developer", icon: Code2, section: "Developers", permission: "marketplace.view" },

  { label: "PM", href: "/platform/pm", icon: Kanban, section: "Project Management", permission: "pm.view" },

  { label: "Billing Dashboard", href: "/platform/billing", icon: DollarSign, section: "Billing", permission: "billing.view_dashboard" },
  { label: "Plans", href: "/platform/billing/plans", icon: Package, section: "Billing", permission: "billing.manage_plans" },
  { label: "Invoices", href: "/platform/billing/invoices", icon: FileText, section: "Billing", permission: "billing.view_invoices" },
  { label: "Subscriptions", href: "/platform/billing/subscriptions", icon: Wallet, section: "Billing", permission: "billing.view_subscriptions" },
  { label: "Reports", href: "/platform/billing/reports", icon: BarChart3, section: "Billing", permission: "billing.view_reports" },

  { label: "Pipeline", href: "/platform/crm", icon: ClipboardList, section: "CRM", permission: "crm.view" },
  { label: "Leads", href: "/platform/crm/leads", icon: TrendingUp, section: "CRM", permission: "crm.view" },
  { label: "Create Lead", href: "/platform/crm/leads/create", icon: Rocket, section: "CRM", permission: "crm.create_lead" },
  { label: "Proposals", href: "/platform/crm/proposals", icon: FileText, section: "CRM", permission: "crm.create_proposal" },

  { label: "Broadcast", href: "/platform/communications/broadcast", icon: Bell, section: "Communications", permission: "communications.send_broadcast" },
  { label: "Announcements", href: "/platform/communications", icon: MessageSquare, section: "Communications", permission: "communications.manage_announcements" },
  { label: "Knowledge Base", href: "/platform/knowledge-base", icon: BookOpen, section: "Communications", permission: "knowledge_base.view" },

  { label: "Analytics", href: "/platform/analytics", icon: BarChart3, section: "Operations", permission: "analytics.view_platform" },
  { label: "Scheduled Reports", href: "/platform/scheduled-reports", icon: Clock, section: "Operations", permission: "analytics.manage_reports" },
  { label: "SLA", href: "/platform/sla", icon: Timer, section: "Operations", permission: "settings.manage_sla" },
  { label: "Tickets", href: "/platform/tickets", icon: Headphones, section: "Tickets", permission: "support.view" },

  { label: "Feature Flags", href: "/platform/feature-flags", icon: Flag, section: "Security", permission: "settings.manage_feature_flags" },
  { label: "Security", href: "/platform/security", icon: Shield, section: "Security", permission: "security.view_dashboard" },
  { label: "Audit Log", href: "/platform/audit", icon: History, section: "Security", permission: "security.view_audit_log" },
  { label: "API Keys", href: "/platform/api-keys", icon: Key, section: "Security", permission: "security.manage_api_keys" },
  { label: "Webhooks", href: "/platform/webhooks", icon: Webhook, section: "Security", permission: "security.manage_webhooks" },
  { label: "White-Label", href: "/platform/white-label", icon: Palette, section: "Security", permission: "settings.edit_general" },

  { label: "Settings", href: "/platform/settings", icon: Settings, section: "Settings", permission: "settings.view" },
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

export const developerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/developer", icon: LayoutDashboard },
  { label: "My Modules", href: "/portal/developer/modules", icon: Package },
  { label: "Analytics", href: "/portal/developer/analytics", icon: BarChart3 },
  { label: "Applications", href: "/portal/developer/applications", icon: FileText },
  { label: "Profile", href: "/portal/developer/profile", icon: UserCog },
  { label: "Support", href: "/portal/developer/support", icon: Headphones },
  { label: "Settings", href: "/portal/developer/settings", icon: Settings },
];

export const affiliateNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/affiliate", icon: LayoutDashboard },
  { label: "Referrals", href: "/portal/affiliate/referrals", icon: Users },
  { label: "Analytics", href: "/portal/affiliate/analytics", icon: BarChart3 },
  { label: "Marketing", href: "/portal/affiliate/marketing", icon: MessageSquare },
  { label: "Profile", href: "/portal/affiliate/profile", icon: UserCog },
  { label: "Support", href: "/portal/affiliate/support", icon: Headphones },
  { label: "Settings", href: "/portal/affiliate/settings", icon: Settings },
];

export const resellerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/reseller", icon: LayoutDashboard },
  { label: "Products", href: "/portal/reseller/products", icon: Package },
  { label: "Customers", href: "/portal/reseller/customers", icon: Users },
  { label: "Analytics", href: "/portal/reseller/analytics", icon: BarChart3 },
  { label: "Orders", href: "/portal/reseller/orders", icon: FileText },
  { label: "Profile", href: "/portal/reseller/profile", icon: UserCog },
  { label: "Support", href: "/portal/reseller/support", icon: Headphones },
  { label: "Settings", href: "/portal/reseller/settings", icon: Settings },
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
    case "developer":
      return developerNavItems;
    case "affiliate":
      return affiliateNavItems;
    case "reseller":
      return resellerNavItems;
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
    case "developer":
      return "/portal/developer";
    case "affiliate":
      return "/portal/affiliate";
    case "reseller":
      return "/portal/reseller";
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
    developer: "Developer",
    affiliate: "Affiliate",
    reseller: "Reseller",
  };
  const normalizedRole = role === "platform_admin" ? "super_admin" : role;
  return labels[normalizedRole] ?? normalizedRole;
}
