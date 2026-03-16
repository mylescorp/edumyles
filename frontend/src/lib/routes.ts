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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module?: string;
  children?: NavItem[];
}

export const platformNavItems: NavItem[] = [
  { label: "Dashboard", href: "/platform", icon: LayoutDashboard },
  { label: "Tenants", href: "/platform/tenants", icon: Building2 },
  { label: "CRM Pipeline", href: "/platform/crm", icon: TrendingUp },
  { label: "Proposals", href: "/platform/crm/proposals", icon: FileText },
  { label: "Users", href: "/platform/users", icon: Users },
  { label: "Staff Performance", href: "/platform/staff-performance", icon: BarChart3 },
  { label: "Tickets", href: "/platform/tickets", icon: Headphones },
  { label: "Communications", href: "/platform/communications", icon: MessageSquare },
  { label: "System Health", href: "/platform/health", icon: Activity },
  { label: "Security Operations", href: "/platform/security", icon: Shield },
  { label: "Automation Center", href: "/platform/automation", icon: Zap },
  { label: "Tenant Success", href: "/platform/tenant-success", icon: TrendingUp },
  { label: "Analytics", href: "/platform/analytics", icon: BarChart3 },
  { label: "Marketplace", href: "/platform/marketplace", icon: ShoppingCart },
  { label: "Billing", href: "/platform/billing", icon: DollarSign },
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
  { label: "Marketplace", href: "/admin/marketplace", icon: ShoppingCart },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Log", href: "/admin/audit", icon: FileText },
];

export const teacherNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/teacher", icon: LayoutDashboard },
  { label: "My Classes", href: "/portal/teacher/classes", icon: BookOpen },
  { label: "Gradebook", href: "/portal/teacher/gradebook", icon: ClipboardList },
  { label: "Attendance", href: "/portal/teacher/attendance", icon: Calendar },
  { label: "Assignments", href: "/portal/teacher/assignments", icon: FileText },
  { label: "Timetable", href: "/portal/teacher/timetable", icon: Calendar },
  { label: "Support Tickets", href: "/support/tickets", icon: Headphones },
];

export const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/student", icon: LayoutDashboard },
  { label: "Grades", href: "/portal/student/grades", icon: GraduationCap },
  { label: "Timetable", href: "/portal/student/timetable", icon: Calendar },
  { label: "Assignments", href: "/portal/student/assignments", icon: FileText },
  { label: "Attendance", href: "/portal/student/attendance", icon: ClipboardList },
  { label: "Support Tickets", href: "/support/tickets", icon: Headphones },
  { label: "Wallet", href: "/portal/student/wallet", icon: Wallet },
  { label: "Report Cards", href: "/portal/student/report-cards", icon: FileText },
];

export const parentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/parent", icon: LayoutDashboard },
  { label: "Children", href: "/portal/parent/children", icon: Users },
  { label: "Fees", href: "/portal/parent/fees", icon: DollarSign },
  { label: "Messages", href: "/portal/parent/messages", icon: MessageSquare },
  { label: "Announcements", href: "/portal/parent/announcements", icon: Bell },
  { label: "Support Tickets", href: "/support/tickets", icon: Headphones },
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
  { label: "Students", href: "/portal/partner/students", icon: GraduationCap },
  { label: "Reports", href: "/portal/partner/reports", icon: FileText },
  { label: "Payments", href: "/portal/partner/payments", icon: DollarSign },
  { label: "Messages", href: "/portal/partner/messages", icon: MessageSquare },
  { label: "Support Tickets", href: "/support/tickets", icon: Headphones },
  { label: "Profile", href: "/portal/partner/profile", icon: Building2 },
];

export function getNavItemsForRole(role: string): NavItem[] {
  switch (role) {
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
  switch (role) {
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
  return labels[role] ?? role;
}
