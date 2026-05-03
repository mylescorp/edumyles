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
  FolderKanban,
  ClipboardCheck,
  Sparkles,
  Store,
  Code2,
  Share2,
  Send,
  CalendarDays,
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
  {
    label: "Dashboard",
    href: "/platform",
    icon: LayoutDashboard,
    section: "Overview",
    permission: null,
  },
  {
    label: "All Tenants",
    href: "/platform/tenants",
    icon: Building2,
    section: "Tenants",
    permission: "tenants.view",
  },
  {
    label: "Networks",
    href: "/platform/networks",
    icon: Share2,
    section: "Tenants",
    permission: "tenants.view",
  },
  {
    label: "Create Tenant",
    href: "/platform/tenants/create",
    icon: Rocket,
    section: "Tenants",
    permission: "tenants.create",
  },
  {
    label: "Tenant Success",
    href: "/platform/tenant-success",
    icon: TrendingUp,
    section: "Tenants",
    permission: "onboarding.view",
  },
  {
    label: "Waitlist",
    href: "/platform/waitlist",
    icon: ClipboardCheck,
    section: "Tenants",
    permission: "waitlist.view",
  },
  {
    label: "Demo Ops",
    href: "/platform/demo-requests",
    icon: Calendar,
    section: "Tenants",
    permission: "demo_requests.view",
  },
  {
    label: "Landing Inbox",
    href: "/platform/landing-engagements",
    icon: MessageSquare,
    section: "Tenants",
    permission: "support.view",
  },
  {
    label: "Onboarding",
    href: "/platform/onboarding",
    icon: Rocket,
    section: "Tenants",
    permission: "onboarding.view",
  },

  {
    label: "All Users",
    href: "/platform/users",
    icon: Users,
    section: "Users & Staff",
    permission: "platform_users.view",
  },
  {
    label: "Invite Staff",
    href: "/platform/users/invite",
    icon: UserCog,
    section: "Users & Staff",
    permission: "platform_users.invite",
  },
  {
    label: "Roles",
    href: "/platform/users/roles",
    icon: Shield,
    section: "Users & Staff",
    permission: "platform_users.view",
  },
  {
    label: "Create Role",
    href: "/platform/users/roles/create",
    icon: Shield,
    section: "Users & Staff",
    permission: "platform_users.edit_role",
  },
  {
    label: "Role Builder",
    href: "/platform/role-builder",
    icon: Shield,
    section: "Users & Staff",
    permission: "platform_users.view",
  },
  {
    label: "Impersonation",
    href: "/platform/impersonation",
    icon: Eye,
    section: "Users & Staff",
    permission: "tenants.impersonate",
  },
  {
    label: "Staff Performance",
    href: "/platform/staff-performance",
    icon: BarChart3,
    section: "Users & Staff",
    permission: "staff_performance.view",
  },
  {
    label: "Sessions",
    href: "/platform/users/sessions",
    icon: Clock,
    section: "Users & Staff",
    permission: "platform_users.view_sessions",
  },
  {
    label: "Activity Logs",
    href: "/platform/users/activity",
    icon: Activity,
    section: "Users & Staff",
    permission: "platform_users.view_activity",
  },

  {
    label: "Marketplace Overview",
    href: "/platform/marketplace",
    icon: ShoppingCart,
    section: "Marketplace",
    permission: "marketplace.view",
  },
  {
    label: "Modules",
    href: "/platform/marketplace/module",
    icon: Package,
    section: "Marketplace",
    permission: "marketplace.view",
  },
  {
    label: "Module Directory",
    href: "/platform/marketplace/modules",
    icon: Package,
    section: "Marketplace",
    permission: "marketplace.view",
  },
  {
    label: "Marketplace Billing",
    href: "/platform/marketplace/billing",
    icon: DollarSign,
    section: "Marketplace",
    permission: "marketplace.view",
  },
  {
    label: "Developer Console",
    href: "/platform/marketplace/developer",
    icon: Code2,
    section: "Marketplace",
    permission: "marketplace.view",
  },
  {
    label: "Review Queue",
    href: "/platform/marketplace/admin",
    icon: ClipboardList,
    section: "Marketplace",
    permission: "marketplace.review_modules",
  },
  {
    label: "Pricing",
    href: "/platform/marketplace/pricing",
    icon: DollarSign,
    section: "Marketplace",
    permission: "marketplace.manage_pricing",
  },
  {
    label: "Flags",
    href: "/platform/marketplace/flags",
    icon: Flag,
    section: "Marketplace",
    permission: "marketplace.manage_flags",
  },
  {
    label: "Reviews",
    href: "/platform/marketplace/reviews",
    icon: ClipboardCheck,
    section: "Marketplace",
    permission: "marketplace.manage_reviews",
  },
  {
    label: "Pilot Grants",
    href: "/platform/marketplace/pilot-grants",
    icon: Sparkles,
    section: "Marketplace",
    permission: "marketplace.manage_pilot_grants",
  },
  {
    label: "Publishers",
    href: "/platform/marketplace/publishers",
    icon: Building2,
    section: "Marketplace",
    permission: "publishers.view",
  },

  {
    label: "Reseller Management",
    href: "/admin/resellers",
    icon: Store,
    section: "Resellers",
    permission: "marketplace.view",
  },
  {
    label: "Reseller Analytics",
    href: "/admin/resellers/analytics",
    icon: BarChart3,
    section: "Resellers",
    permission: "analytics.view_platform",
  },
  {
    label: "Reseller Applications",
    href: "/admin/resellers/applications",
    icon: ClipboardCheck,
    section: "Resellers",
    permission: "marketplace.review_modules",
  },
  {
    label: "Reseller Settings",
    href: "/admin/resellers/settings",
    icon: Settings,
    section: "Resellers",
    permission: "settings.view",
  },
  {
    label: "Affiliate Dashboard",
    href: "/portal/affiliate",
    icon: Users,
    section: "Resellers",
    permission: "marketplace.view",
  },
  {
    label: "Affiliate Referrals",
    href: "/portal/affiliate/referrals",
    icon: TrendingUp,
    section: "Resellers",
    permission: "marketplace.view",
  },
  {
    label: "Affiliate Analytics",
    href: "/portal/affiliate/analytics",
    icon: BarChart3,
    section: "Resellers",
    permission: "analytics.view_platform",
  },
  {
    label: "Affiliate Marketing",
    href: "/portal/affiliate/marketing",
    icon: MessageSquare,
    section: "Resellers",
    permission: "marketplace.view",
  },
  {
    label: "Affiliate Settings",
    href: "/portal/affiliate/settings",
    icon: Settings,
    section: "Resellers",
    permission: "settings.view",
  },
  {
    label: "Developer Portal",
    href: "/platform/marketplace/developer",
    icon: Code2,
    section: "Developers",
    permission: "marketplace.view",
  },

  {
    label: "PM Dashboard",
    href: "/platform/pm",
    icon: Kanban,
    section: "Project Management",
    permission: "pm.view_own",
  },
  {
    label: "Boards",
    href: "/platform/pm/boards",
    icon: Kanban,
    section: "Project Management",
    permission: "pm.view_own",
  },
  {
    label: "Workspaces",
    href: "/platform/pm/workspaces",
    icon: FolderKanban,
    section: "Project Management",
    permission: "pm.view_own",
  },
  {
    label: "My Tasks",
    href: "/platform/pm/my-tasks",
    icon: ClipboardList,
    section: "Project Management",
    permission: "pm.view_own",
  },

  {
    label: "Dashboard",
    href: "/platform/social",
    icon: Share2,
    section: "Social Media",
    permission: "social.view",
  },
  {
    label: "Posts",
    href: "/platform/social/posts",
    icon: ClipboardList,
    section: "Social Media",
    permission: "social.view",
  },
  {
    label: "Create Post",
    href: "/platform/social/posts/create",
    icon: Send,
    section: "Social Media",
    permission: "social.create",
  },
  {
    label: "Accounts",
    href: "/platform/social/accounts",
    icon: Users,
    section: "Social Media",
    permission: "social.manage_accounts",
  },
  {
    label: "Analytics",
    href: "/platform/social/analytics",
    icon: BarChart3,
    section: "Social Media",
    permission: "social.view_analytics",
  },
  {
    label: "Comments",
    href: "/platform/social/comments",
    icon: MessageSquare,
    section: "Social Media",
    permission: "social.manage_comments",
  },
  {
    label: "Calendar",
    href: "/platform/social/calendar",
    icon: CalendarDays,
    section: "Social Media",
    permission: "social.view",
  },

  {
    label: "Billing Dashboard",
    href: "/platform/billing",
    icon: DollarSign,
    section: "Billing",
    permission: "billing.view_dashboard",
  },
  {
    label: "Plans",
    href: "/platform/billing/plans",
    icon: Package,
    section: "Billing",
    permission: "billing.manage_plans",
  },
  {
    label: "Invoices",
    href: "/platform/billing/invoices",
    icon: FileText,
    section: "Billing",
    permission: "billing.view_invoices",
  },
  {
    label: "Create Invoice",
    href: "/platform/billing/invoices/create",
    icon: FileText,
    section: "Billing",
    permission: "billing.manage_invoices",
  },
  {
    label: "Subscriptions",
    href: "/platform/billing/subscriptions",
    icon: Wallet,
    section: "Billing",
    permission: "billing.view_subscriptions",
  },
  {
    label: "Reports",
    href: "/platform/billing/reports",
    icon: BarChart3,
    section: "Billing",
    permission: "billing.view_reports",
  },

  {
    label: "Dashboard",
    href: "/platform/crm",
    icon: ClipboardList,
    section: "CRM",
    permission: "crm.view_own",
  },
  {
    label: "Pipeline Board",
    href: "/platform/crm/pipeline",
    icon: TrendingUp,
    section: "CRM",
    permission: "crm.view_own",
  },
  {
    label: "Leads",
    href: "/platform/crm/leads",
    icon: TrendingUp,
    section: "CRM",
    permission: "crm.view_own",
  },
  {
    label: "Create Lead",
    href: "/platform/crm/leads/create",
    icon: Rocket,
    section: "CRM",
    permission: "crm.create_lead",
  },
  {
    label: "Proposals",
    href: "/platform/crm/proposals",
    icon: FileText,
    section: "CRM",
    permission: "crm.create_proposal",
  },
  {
    label: "Reports",
    href: "/platform/crm/reports",
    icon: BarChart3,
    section: "CRM",
    permission: "crm.view_reports",
  },
  {
    label: "Settings",
    href: "/platform/crm/settings",
    icon: Settings,
    section: "CRM",
    permission: "crm.manage_pipeline",
  },

  {
    label: "Broadcast",
    href: "/platform/communications/broadcast",
    icon: Bell,
    section: "Communications",
    permission: "communications.send_broadcast",
  },
  {
    label: "Announcements",
    href: "/platform/communications",
    icon: MessageSquare,
    section: "Communications",
    permission: "communications.manage_announcements",
  },
  {
    label: "Knowledge Base",
    href: "/platform/knowledge-base",
    icon: BookOpen,
    section: "Communications",
    permission: "knowledge_base.view",
  },
  {
    label: "Notifications",
    href: "/platform/notifications",
    icon: Bell,
    section: "Communications",
    permission: null,
  },
  {
    label: "Support Hub",
    href: "/platform/support",
    icon: Headphones,
    section: "Communications",
    permission: null,
  },

  {
    label: "Operations Hub",
    href: "/platform/operations",
    icon: Sparkles,
    section: "Operations",
    permission: null,
  },
  {
    label: "Analytics",
    href: "/platform/analytics",
    icon: BarChart3,
    section: "Operations",
    permission: "analytics.view_platform",
  },
  {
    label: "Scheduled Reports",
    href: "/platform/scheduled-reports",
    icon: Clock,
    section: "Operations",
    permission: "analytics.manage_reports",
  },
  {
    label: "Automation",
    href: "/platform/automation",
    icon: Clock,
    section: "Operations",
    permission: null,
  },
  {
    label: "Health",
    href: "/platform/health",
    icon: Activity,
    section: "Operations",
    permission: null,
  },
  {
    label: "Data Export",
    href: "/platform/data-export",
    icon: FileText,
    section: "Operations",
    permission: null,
  },
  {
    label: "Changelog",
    href: "/platform/changelog",
    icon: FileText,
    section: "Operations",
    permission: null,
  },
  {
    label: "SLA",
    href: "/platform/sla",
    icon: Timer,
    section: "Operations",
    permission: "settings.manage_sla",
  },
  {
    label: "AI Support",
    href: "/platform/ai-support",
    icon: Headphones,
    section: "Operations",
    permission: null,
  },
  {
    label: "Tickets",
    href: "/platform/tickets",
    icon: Headphones,
    section: "Tickets",
    permission: "support.view",
  },
  {
    label: "Create Ticket",
    href: "/platform/tickets/create",
    icon: Headphones,
    section: "Tickets",
    permission: "support.reply",
  },

  {
    label: "Feature Flags",
    href: "/platform/feature-flags",
    icon: Flag,
    section: "Security",
    permission: "settings.manage_feature_flags",
  },
  {
    label: "Security",
    href: "/platform/security",
    icon: Shield,
    section: "Security",
    permission: "security.view_dashboard",
  },
  {
    label: "Audit Log",
    href: "/platform/audit",
    icon: History,
    section: "Security",
    permission: "security.view_audit_log",
  },
  {
    label: "API Keys",
    href: "/platform/api-keys",
    icon: Key,
    section: "Security",
    permission: "security.manage_api_keys",
  },
  {
    label: "Webhooks",
    href: "/platform/webhooks",
    icon: Webhook,
    section: "Security",
    permission: "security.manage_webhooks",
  },
  {
    label: "White-Label",
    href: "/platform/white-label",
    icon: Palette,
    section: "Security",
    permission: "settings.edit_general",
  },

  {
    label: "Profile",
    href: "/platform/profile",
    icon: UserCog,
    section: "Settings",
    permission: null,
  },
  {
    label: "Settings",
    href: "/platform/settings",
    icon: Settings,
    section: "Settings",
    permission: "settings.view",
  },
];

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, section: "Overview" },
  {
    label: "Students",
    href: "/admin/students",
    icon: GraduationCap,
    module: "sis",
    section: "Students",
  },
  {
    label: "Add Student",
    href: "/admin/students/create",
    icon: Users,
    module: "sis",
    section: "Students",
  },
  {
    label: "Import Students",
    href: "/admin/students/import",
    icon: FileText,
    module: "sis",
    section: "Students",
  },
  { label: "Classes", href: "/admin/classes", icon: BookOpen, module: "sis", section: "Classes" },
  {
    label: "Create Class",
    href: "/admin/classes/create",
    icon: BookOpen,
    module: "sis",
    section: "Classes",
  },
  { label: "Staff", href: "/admin/staff", icon: Users, module: "hr", section: "Staff" },
  {
    label: "Add Staff",
    href: "/admin/staff/create",
    icon: UserCog,
    module: "hr",
    section: "Staff",
  },
  {
    label: "Admissions",
    href: "/admin/admissions",
    icon: ClipboardList,
    module: "admissions",
    section: "Admissions",
  },
  {
    label: "Academics",
    href: "/admin/academics",
    icon: BookOpen,
    module: "academics",
    section: "Academics",
  },
  {
    label: "Assignments",
    href: "/admin/academics/assignments",
    icon: ClipboardList,
    module: "academics",
    section: "Academics",
  },
  {
    label: "Create Assignment",
    href: "/admin/academics/assignments/create",
    icon: Send,
    module: "academics",
    section: "Academics",
  },
  {
    label: "Academic Classes",
    href: "/admin/academics/classes",
    icon: BookOpen,
    module: "academics",
    section: "Academics",
  },
  {
    label: "Create Academic Class",
    href: "/admin/academics/classes/create",
    icon: BookOpen,
    module: "academics",
    section: "Academics",
  },
  {
    label: "Exams",
    href: "/admin/academics/exams",
    icon: ClipboardCheck,
    module: "academics",
    section: "Academics",
  },
  {
    label: "Create Exam",
    href: "/admin/academics/exams/create",
    icon: ClipboardCheck,
    module: "academics",
    section: "Academics",
  },
  {
    label: "Academic Reports",
    href: "/admin/academics/reports",
    icon: BarChart3,
    module: "academics",
    section: "Academics",
  },
  {
    label: "Finance",
    href: "/admin/finance",
    icon: DollarSign,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Fees",
    href: "/admin/finance/fees",
    icon: DollarSign,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Invoices",
    href: "/admin/finance/invoices",
    icon: FileText,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Create Invoice",
    href: "/admin/finance/invoices/create",
    icon: FileText,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Timetable",
    href: "/admin/timetable",
    icon: Calendar,
    module: "timetable",
    section: "Timetable",
  },
  {
    label: "Schedule",
    href: "/admin/timetable/schedule",
    icon: Calendar,
    module: "timetable",
    section: "Timetable",
  },
  {
    label: "Assignments",
    href: "/admin/timetable/assignments",
    icon: ClipboardList,
    module: "timetable",
    section: "Timetable",
  },
  {
    label: "Events",
    href: "/admin/timetable/events",
    icon: CalendarDays,
    module: "timetable",
    section: "Timetable",
  },
  {
    label: "Create Event",
    href: "/admin/timetable/events/create",
    icon: Send,
    module: "timetable",
    section: "Timetable",
  },
  {
    label: "HR & Payroll",
    href: "/admin/hr",
    icon: UserCog,
    module: "hr",
    section: "HR & Payroll",
  },
  {
    label: "Leave",
    href: "/admin/hr/leave",
    icon: Calendar,
    module: "hr",
    section: "HR & Payroll",
  },
  {
    label: "Payroll",
    href: "/admin/hr/payroll",
    icon: DollarSign,
    module: "hr",
    section: "HR & Payroll",
  },
  {
    label: "Performance",
    href: "/admin/hr/performance",
    icon: TrendingUp,
    module: "hr",
    section: "HR & Payroll",
  },
  {
    label: "Library",
    href: "/admin/library",
    icon: Library,
    module: "library",
    section: "Library",
  },
  {
    label: "Books",
    href: "/admin/library/books",
    icon: BookOpen,
    module: "library",
    section: "Library",
  },
  {
    label: "Add Book",
    href: "/admin/library/books/create",
    icon: BookOpen,
    module: "library",
    section: "Library",
  },
  {
    label: "Circulation",
    href: "/admin/library/circulation",
    icon: ClipboardList,
    module: "library",
    section: "Library",
  },
  {
    label: "Library Reports",
    href: "/admin/library/reports",
    icon: BarChart3,
    module: "library",
    section: "Library",
  },
  {
    label: "Transport",
    href: "/admin/transport",
    icon: Bus,
    module: "transport",
    section: "Transport",
  },
  {
    label: "Routes",
    href: "/admin/transport/routes",
    icon: Bus,
    module: "transport",
    section: "Transport",
  },
  {
    label: "Create Route",
    href: "/admin/transport/routes/create",
    icon: ClipboardList,
    module: "transport",
    section: "Transport",
  },
  {
    label: "Tracking",
    href: "/admin/transport/tracking",
    icon: Activity,
    module: "transport",
    section: "Transport",
  },
  {
    label: "Communications",
    href: "/admin/communications",
    icon: MessageSquare,
    module: "communications",
    section: "Communications",
  },
  {
    label: "Compose",
    href: "/admin/communications/create",
    icon: Send,
    module: "communications",
    section: "Communications",
  },
  {
    label: "Email",
    href: "/admin/communications/email",
    icon: Bell,
    module: "communications",
    section: "Communications",
  },
  {
    label: "Dashboard",
    href: "/admin/social",
    icon: Share2,
    module: "social",
    section: "Social Media",
  },
  {
    label: "Posts",
    href: "/admin/social/posts",
    icon: ClipboardList,
    module: "social",
    section: "Social Media",
  },
  {
    label: "Create Post",
    href: "/admin/social/posts/create",
    icon: Send,
    module: "social",
    section: "Social Media",
  },
  {
    label: "Accounts",
    href: "/admin/social/accounts",
    icon: Users,
    module: "social",
    section: "Social Media",
  },
  {
    label: "Analytics",
    href: "/admin/social/analytics",
    icon: BarChart3,
    module: "social",
    section: "Social Media",
  },
  {
    label: "Comments",
    href: "/admin/social/comments",
    icon: MessageSquare,
    module: "social",
    section: "Social Media",
  },
  {
    label: "Calendar",
    href: "/admin/social/calendar",
    icon: CalendarDays,
    module: "social",
    section: "Social Media",
  },
  {
    label: "Support Tickets",
    href: "/admin/tickets",
    icon: Headphones,
    module: "tickets",
    section: "Support",
  },
  {
    label: "Create Ticket",
    href: "/admin/tickets/create",
    icon: Headphones,
    module: "tickets",
    section: "Support",
  },
  { label: "eWallet", href: "/admin/ewallet", icon: Wallet, module: "ewallet", section: "eWallet" },
  {
    label: "Wallets",
    href: "/admin/ewallet/wallets",
    icon: Wallet,
    module: "ewallet",
    section: "eWallet",
  },
  {
    label: "Transactions",
    href: "/admin/ewallet/transactions",
    icon: History,
    module: "ewallet",
    section: "eWallet",
  },
  {
    label: "eCommerce",
    href: "/admin/ecommerce",
    icon: ShoppingCart,
    module: "ecommerce",
    section: "eCommerce",
  },
  {
    label: "Orders",
    href: "/admin/ecommerce/orders",
    icon: ClipboardList,
    module: "ecommerce",
    section: "eCommerce",
  },
  {
    label: "Products",
    href: "/admin/ecommerce/products",
    icon: Package,
    module: "ecommerce",
    section: "eCommerce",
  },
  {
    label: "Create Product",
    href: "/admin/ecommerce/products/create",
    icon: Package,
    module: "ecommerce",
    section: "eCommerce",
  },
  { label: "Users", href: "/admin/users", icon: Users, module: "users", section: "Users & Access" },
  {
    label: "Invite User",
    href: "/admin/users/invite",
    icon: UserCog,
    module: "users",
    section: "Users & Access",
  },
  { label: "Modules", href: "/admin/modules", icon: Package, section: "Marketplace & Modules" },
  {
    label: "Marketplace",
    href: "/admin/marketplace",
    icon: ShoppingCart,
    section: "Marketplace & Modules",
  },
  {
    label: "Requests",
    href: "/admin/marketplace/requests",
    icon: ClipboardCheck,
    section: "Marketplace & Modules",
  },
  { label: "Publishers", href: "/admin/publishers", icon: Building2, section: "Publishers" },
  {
    label: "Publisher Analytics",
    href: "/admin/publishers/analytics",
    icon: BarChart3,
    section: "Publishers",
  },
  {
    label: "Publisher Applications",
    href: "/admin/publishers/applications",
    icon: ClipboardCheck,
    section: "Publishers",
  },
  {
    label: "Publisher Settings",
    href: "/admin/publishers/settings",
    icon: Settings,
    section: "Publishers",
  },
  { label: "Tasks", href: "/admin/tasks", icon: ClipboardList, section: "Operations" },
  { label: "Notes", href: "/admin/notes", icon: FileText, section: "Operations" },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, section: "Operations" },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, section: "Operations" },
  { label: "Profile", href: "/admin/profile", icon: UserCog, section: "Operations" },
  { label: "Security", href: "/admin/security", icon: Shield, section: "Operations" },
  { label: "Setup", href: "/admin/setup", icon: Rocket, section: "Operations" },
  {
    label: "Setup Complete",
    href: "/admin/setup/complete",
    icon: ClipboardCheck,
    section: "Operations",
  },
  { label: "Settings", href: "/admin/settings", icon: Settings, section: "Settings" },
  {
    label: "Billing Settings",
    href: "/admin/settings/billing",
    icon: DollarSign,
    section: "Settings",
  },
  { label: "Module Settings", href: "/admin/settings/modules", icon: Package, section: "Settings" },
  { label: "Role Settings", href: "/admin/settings/roles", icon: Shield, section: "Settings" },
  { label: "Audit Log", href: "/admin/audit", icon: FileText, section: "Audit & Compliance" },
  {
    label: "Audit Reports",
    href: "/admin/audit/reports",
    icon: BarChart3,
    section: "Audit & Compliance",
  },
];

export const portalAdminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/admin", icon: LayoutDashboard, section: "Overview" },
  {
    label: "Communications",
    href: "/portal/admin/communications",
    icon: MessageSquare,
    module: "communications",
    section: "Communications",
  },
  {
    label: "Finance",
    href: "/portal/admin/finance",
    icon: DollarSign,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Fees",
    href: "/portal/admin/finance/fees",
    icon: FileText,
    module: "finance",
    section: "Finance",
  },
  { label: "HR", href: "/portal/admin/hr", icon: UserCog, module: "hr", section: "HR & Payroll" },
  {
    label: "HR Dashboard",
    href: "/portal/admin/hr/dashboard",
    icon: LayoutDashboard,
    module: "hr",
    section: "HR & Payroll",
  },
  {
    label: "Contracts",
    href: "/portal/admin/hr/contracts",
    icon: FileText,
    module: "hr",
    section: "HR & Payroll",
  },
  {
    label: "Payroll",
    href: "/portal/admin/hr/payroll",
    icon: DollarSign,
    module: "hr",
    section: "HR & Payroll",
  },
  {
    label: "Library",
    href: "/portal/admin/library",
    icon: Library,
    module: "library",
    section: "Library",
  },
  {
    label: "Library Dashboard",
    href: "/portal/admin/library/dashboard",
    icon: LayoutDashboard,
    module: "library",
    section: "Library",
  },
  {
    label: "Circulation",
    href: "/portal/admin/library/circulation",
    icon: ClipboardList,
    module: "library",
    section: "Library",
  },
  {
    label: "Timetable",
    href: "/portal/admin/timetable",
    icon: Calendar,
    module: "timetable",
    section: "Timetable",
  },
  {
    label: "Builder",
    href: "/portal/admin/timetable/builder",
    icon: CalendarDays,
    module: "timetable",
    section: "Timetable",
  },
];

export const teacherNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/teacher", icon: LayoutDashboard, section: "Overview" },
  {
    label: "My Classes",
    href: "/portal/teacher/classes",
    icon: BookOpen,
    module: "sis",
    section: "Teaching",
  },
  {
    label: "Gradebook",
    href: "/portal/teacher/gradebook",
    icon: ClipboardList,
    module: "academics",
    section: "Teaching",
  },
  {
    label: "Attendance",
    href: "/portal/teacher/attendance",
    icon: Calendar,
    module: "sis",
    section: "Teaching",
  },
  {
    label: "Assignments",
    href: "/portal/teacher/assignments",
    icon: FileText,
    module: "academics",
    section: "Teaching",
  },
  {
    label: "Create Assignment",
    href: "/portal/teacher/assignments/create",
    icon: Send,
    module: "academics",
    section: "Teaching",
  },
  {
    label: "Timetable",
    href: "/portal/teacher/timetable",
    icon: Calendar,
    module: "timetable",
    section: "Teaching",
  },
  {
    label: "Communications",
    href: "/portal/teacher/communications",
    icon: MessageSquare,
    module: "communications",
    section: "Workspace",
  },
  {
    label: "Notifications",
    href: "/portal/teacher/notifications",
    icon: Bell,
    module: "communications",
    section: "Workspace",
  },
  { label: "Profile", href: "/portal/teacher/profile", icon: UserCog, section: "Workspace" },
  {
    label: "Create Draft",
    href: "/portal/teacher/social/create",
    icon: Send,
    module: "social",
    section: "Social Media",
  },
  {
    label: "My Drafts",
    href: "/portal/teacher/social/status",
    icon: Share2,
    module: "social",
    section: "Social Media",
  },
  {
    label: "Support Tickets",
    href: "/support/tickets",
    icon: Headphones,
    module: "tickets",
    section: "Workspace",
  },
  {
    label: "Create Ticket",
    href: "/support/tickets/create",
    icon: Headphones,
    module: "tickets",
    section: "Workspace",
  },
];

export const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/student", icon: LayoutDashboard, section: "Overview" },
  {
    label: "Grades",
    href: "/portal/student/grades",
    icon: GraduationCap,
    module: "academics",
    section: "Learning",
  },
  {
    label: "Timetable",
    href: "/portal/student/timetable",
    icon: Calendar,
    module: "timetable",
    section: "Learning",
  },
  {
    label: "Assignments",
    href: "/portal/student/assignments",
    icon: FileText,
    module: "academics",
    section: "Learning",
  },
  {
    label: "Attendance",
    href: "/portal/student/attendance",
    icon: ClipboardList,
    module: "sis",
    section: "Learning",
  },
  {
    label: "Report Cards",
    href: "/portal/student/report-cards",
    icon: FileText,
    module: "academics",
    section: "Learning",
  },
  {
    label: "Communications",
    href: "/portal/student/communications",
    icon: MessageSquare,
    module: "communications",
    section: "Workspace",
  },
  {
    label: "Notifications",
    href: "/portal/student/notifications",
    icon: Bell,
    module: "communications",
    section: "Workspace",
  },
  { label: "Profile", href: "/portal/student/profile", icon: UserCog, section: "Workspace" },
  {
    label: "Support Tickets",
    href: "/support/tickets",
    icon: Headphones,
    module: "tickets",
    section: "Workspace",
  },
  {
    label: "Create Ticket",
    href: "/support/tickets/create",
    icon: Headphones,
    module: "tickets",
    section: "Workspace",
  },
  {
    label: "Wallet",
    href: "/portal/student/wallet",
    icon: Wallet,
    module: "ewallet",
    section: "Wallet",
  },
  {
    label: "Send Money",
    href: "/portal/student/wallet/send",
    icon: Send,
    module: "ewallet",
    section: "Wallet",
  },
  {
    label: "Top Up",
    href: "/portal/student/wallet/topup",
    icon: DollarSign,
    module: "ewallet",
    section: "Wallet",
  },
  {
    label: "Transactions",
    href: "/portal/student/wallet/transactions",
    icon: History,
    module: "ewallet",
    section: "Wallet",
  },
];

export const parentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/parent", icon: LayoutDashboard, section: "Overview" },
  {
    label: "Enhanced Dashboard",
    href: "/portal/parent/dashboard/enhanced",
    icon: LayoutDashboard,
    section: "Family",
  },
  {
    label: "Children",
    href: "/portal/parent/children",
    icon: Users,
    module: "sis",
    section: "Family",
  },
  {
    label: "Fees",
    href: "/portal/parent/fees",
    icon: DollarSign,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Payment History",
    href: "/portal/parent/fees/history",
    icon: History,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Pay Fees",
    href: "/portal/parent/fees/pay",
    icon: DollarSign,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Payments",
    href: "/portal/parent/payments",
    icon: Wallet,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Messages",
    href: "/portal/parent/messages",
    icon: MessageSquare,
    module: "communications",
    section: "Communications",
  },
  {
    label: "Communications",
    href: "/portal/parent/communications",
    icon: MessageSquare,
    module: "communications",
    section: "Communications",
  },
  {
    label: "Announcements",
    href: "/portal/parent/announcements",
    icon: Bell,
    module: "communications",
    section: "Communications",
  },
  {
    label: "Notifications",
    href: "/portal/parent/notifications",
    icon: Bell,
    module: "communications",
    section: "Communications",
  },
  { label: "Profile", href: "/portal/parent/profile", icon: UserCog, section: "Account" },
  {
    label: "Support Tickets",
    href: "/support/tickets",
    icon: Headphones,
    module: "tickets",
    section: "Account",
  },
  {
    label: "Create Ticket",
    href: "/support/tickets/create",
    icon: Headphones,
    module: "tickets",
    section: "Account",
  },
];

export const alumniNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/alumni", icon: LayoutDashboard, section: "Overview" },
  { label: "Transcripts", href: "/portal/alumni/transcripts", icon: FileText, section: "Alumni" },
  { label: "Directory", href: "/portal/alumni/directory", icon: Users, section: "Alumni" },
  { label: "Events", href: "/portal/alumni/events", icon: Calendar, section: "Alumni" },
  { label: "Notifications", href: "/portal/alumni/notifications", icon: Bell, section: "Alumni" },
  { label: "Profile", href: "/portal/alumni/profile", icon: UserCog, section: "Alumni" },
  { label: "Support Tickets", href: "/support/tickets", icon: Headphones, section: "Support" },
  { label: "Create Ticket", href: "/support/tickets/create", icon: Headphones, section: "Support" },
];

export const partnerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/partner", icon: LayoutDashboard, section: "Overview" },
  {
    label: "Partner Dashboard",
    href: "/portal/partner/dashboard",
    icon: LayoutDashboard,
    section: "Partnership",
  },
  {
    label: "Students",
    href: "/portal/partner/students",
    icon: GraduationCap,
    module: "sis",
    section: "Partnership",
  },
  {
    label: "Reports",
    href: "/portal/partner/reports",
    icon: FileText,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Payments",
    href: "/portal/partner/payments",
    icon: DollarSign,
    module: "finance",
    section: "Finance",
  },
  {
    label: "Messages",
    href: "/portal/partner/messages",
    icon: MessageSquare,
    module: "communications",
    section: "Communications",
  },
  {
    label: "Notifications",
    href: "/portal/partner/notifications",
    icon: Bell,
    module: "communications",
    section: "Communications",
  },
  {
    label: "Support Tickets",
    href: "/support/tickets",
    icon: Headphones,
    module: "tickets",
    section: "Support",
  },
  {
    label: "Create Ticket",
    href: "/support/tickets/create",
    icon: Headphones,
    module: "tickets",
    section: "Support",
  },
  { label: "Profile", href: "/portal/partner/profile", icon: Building2, section: "Support" },
];

export const developerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/developer", icon: LayoutDashboard, section: "Overview" },
  {
    label: "My Modules",
    href: "/portal/developer/modules",
    icon: Package,
    section: "Developer Workspace",
  },
  {
    label: "Analytics",
    href: "/portal/developer/analytics",
    icon: BarChart3,
    section: "Developer Workspace",
  },
  {
    label: "Applications",
    href: "/portal/developer/applications",
    icon: FileText,
    section: "Developer Workspace",
  },
  { label: "Profile", href: "/portal/developer/profile", icon: UserCog, section: "Account" },
  { label: "Support", href: "/portal/developer/support", icon: Headphones, section: "Account" },
  { label: "Settings", href: "/portal/developer/settings", icon: Settings, section: "Account" },
];

export const affiliateNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/affiliate", icon: LayoutDashboard, section: "Overview" },
  { label: "Referrals", href: "/portal/affiliate/referrals", icon: Users, section: "Growth" },
  { label: "Analytics", href: "/portal/affiliate/analytics", icon: BarChart3, section: "Growth" },
  {
    label: "Marketing",
    href: "/portal/affiliate/marketing",
    icon: MessageSquare,
    section: "Growth",
  },
  { label: "Profile", href: "/portal/affiliate/profile", icon: UserCog, section: "Account" },
  { label: "Support", href: "/portal/affiliate/support", icon: Headphones, section: "Account" },
  { label: "Settings", href: "/portal/affiliate/settings", icon: Settings, section: "Account" },
];

export const resellerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/portal/reseller", icon: LayoutDashboard, section: "Overview" },
  { label: "Products", href: "/portal/reseller/products", icon: Package, section: "Commerce" },
  { label: "Customers", href: "/portal/reseller/customers", icon: Users, section: "Commerce" },
  { label: "Analytics", href: "/portal/reseller/analytics", icon: BarChart3, section: "Commerce" },
  { label: "Orders", href: "/portal/reseller/orders", icon: FileText, section: "Commerce" },
  { label: "Profile", href: "/portal/reseller/profile", icon: UserCog, section: "Account" },
  { label: "Support", href: "/portal/reseller/support", icon: Headphones, section: "Account" },
  { label: "Settings", href: "/portal/reseller/settings", icon: Settings, section: "Account" },
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
