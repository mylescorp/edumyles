"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Users, GraduationCap, Building2, BookOpen, Calendar,
  DollarSign, Bus, Library, MessageSquare, Wallet, ShoppingCart, Settings,
  ClipboardList, FileText, Shield, UserCog, Bell, BarChart3, Eye, Headphones,
  Flag, TrendingUp, Activity, Zap, Download, Timer, History, Webhook, Key,
  Palette, Rocket, Lock, Clock, Package, Kanban, Code2, ExternalLink,
  Search, X, ChevronDown, ChevronRight, Copy, Check, Info, Terminal,
  Globe, RefreshCw, AlertCircle, CheckCircle2, XCircle, Loader2,
  Server, Database, Sliders, Filter, LogOut, User, Layers,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  roles: string[];
  dashboardHref: string;
  links: PanelLink[];
}

interface SessionInfo {
  hasSession: boolean;
  role: string | null;
  user: { email?: string; name?: string; id?: string } | null;
  isImpersonating: boolean;
  maintenance: boolean;
  tenantSlug: string | null;
}

interface RecentEntry {
  href: string;
  label: string;
  panelTitle: string;
  color: string;
  ts: number;
}

type RouteStatus = number | "loading" | "error" | null;

// ─── Panel data ───────────────────────────────────────────────────────────────

const panels: PanelSection[] = [
  {
    title: "Platform Panel",
    description: "Super Admin & Master Admin — Platform-wide management",
    color: "text-violet-700 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200 dark:border-violet-800",
    role: "master_admin / super_admin",
    roles: ["master_admin", "super_admin"],
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
    roles: ["school_admin", "principal", "bursar", "hr_manager", "librarian", "transport_manager", "master_admin", "super_admin"],
    dashboardHref: "/portal/admin",
    links: [
      { label: "Dashboard", href: "/portal/admin", icon: LayoutDashboard },
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
      { label: "Timetable", href: "/portal/admin/timetable", icon: Calendar, badge: "timetable" },
      { label: "Schedule Builder", href: "/portal/admin/timetable/builder", icon: Calendar, badge: "timetable" },
      { label: "Events", href: "/admin/timetable/events", icon: Calendar, badge: "timetable" },
      { label: "HR & Payroll", href: "/portal/admin/hr", icon: UserCog, badge: "hr" },
      { label: "HR Dashboard", href: "/portal/admin/hr/dashboard", icon: UserCog, badge: "hr" },
      { label: "Contracts", href: "/portal/admin/hr/contracts", icon: FileText, badge: "hr" },
      { label: "Payroll", href: "/portal/admin/hr/payroll", icon: DollarSign, badge: "hr" },
      { label: "Library", href: "/portal/admin/library", icon: Library, badge: "library" },
      { label: "Book Catalog", href: "/admin/library/books", icon: Library, badge: "library" },
      { label: "Circulation", href: "/portal/admin/library/circulation", icon: Library, badge: "library" },
      { label: "Library Dashboard", href: "/portal/admin/library/dashboard", icon: Library, badge: "library" },
      { label: "Transport", href: "/admin/transport", icon: Bus, badge: "transport" },
      { label: "Routes", href: "/admin/transport/routes", icon: Bus, badge: "transport" },
      { label: "GPS Tracking", href: "/admin/transport/tracking", icon: Bus, badge: "transport" },
      { label: "Communications", href: "/portal/admin/communications", icon: MessageSquare, badge: "comms" },
      { label: "Finance Portal", href: "/portal/admin/finance", icon: DollarSign, badge: "finance" },
      { label: "Fees Portal", href: "/portal/admin/finance/fees", icon: DollarSign, badge: "finance" },
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
    roles: ["student", "master_admin", "super_admin"],
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
      { label: "Send Funds", href: "/portal/student/wallet/send", icon: Wallet, badge: "ewallet" },
      { label: "Wallet Transactions", href: "/portal/student/wallet/transactions", icon: Wallet, badge: "ewallet" },
      { label: "Communications", href: "/portal/student/communications", icon: MessageSquare, badge: "comms" },
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
    roles: ["teacher", "master_admin", "super_admin"],
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
    roles: ["parent", "master_admin", "super_admin"],
    dashboardHref: "/portal/parent",
    links: [
      { label: "Dashboard", href: "/portal/parent", icon: LayoutDashboard },
      { label: "Enhanced Dashboard", href: "/portal/parent/dashboard/enhanced", icon: LayoutDashboard },
      { label: "Children", href: "/portal/parent/children", icon: Users, badge: "sis" },
      { label: "Fees", href: "/portal/parent/fees", icon: DollarSign, badge: "finance" },
      { label: "Pay Fees", href: "/portal/parent/fees/pay", icon: DollarSign, badge: "form" },
      { label: "Payment History", href: "/portal/parent/fees/history", icon: DollarSign, badge: "finance" },
      { label: "Messages", href: "/portal/parent/messages", icon: MessageSquare, badge: "comms" },
      { label: "Announcements", href: "/portal/parent/announcements", icon: Bell, badge: "comms" },
      { label: "Payments", href: "/portal/parent/payments", icon: DollarSign, badge: "finance" },
      { label: "Notifications", href: "/portal/parent/notifications", icon: Bell },
      { label: "Profile", href: "/portal/parent/profile", icon: UserCog },
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
    roles: ["alumni", "master_admin", "super_admin"],
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
    roles: ["partner", "master_admin", "super_admin"],
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
    roles: [],
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
    roles: [],
    dashboardHref: "/auth/login",
    links: [
      { label: "Login", href: "/auth/login", icon: Lock },
      { label: "Sign Up", href: "/auth/signup", icon: UserCog },
      { label: "Auth Error", href: "/auth/error", icon: Shield },
    ],
  },
];

// ─── Badge + role config ──────────────────────────────────────────────────────

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

const ALL_BADGES = Object.keys(badgeColors);

const ALL_ROLES = [
  "master_admin", "super_admin", "school_admin", "principal",
  "bursar", "hr_manager", "librarian", "transport_manager",
  "teacher", "student", "parent", "alumni", "partner",
];

// ─── Session reader ───────────────────────────────────────────────────────────

function parseCookies(): Record<string, string> {
  return document.cookie.split(";").reduce(
    (acc, c) => {
      const idx = c.indexOf("=");
      if (idx < 0) return acc;
      const key = c.slice(0, idx).trim();
      const val = c.slice(idx + 1).trim();
      acc[key] = val;
      return acc;
    },
    {} as Record<string, string>
  );
}

function readSessionInfo(): SessionInfo {
  const cookies = parseCookies();
  let user: SessionInfo["user"] = null;
  try {
    const raw = cookies["edumyles_user"];
    if (raw) user = JSON.parse(decodeURIComponent(raw));
  } catch { /* malformed */ }

  return {
    hasSession: !!cookies["edumyles_session"],
    role: cookies["edumyles_role"] ?? null,
    user,
    isImpersonating: cookies["edumyles_impersonating"] === "true",
    maintenance: cookies["edumyles_maintenance"] === "true",
    tenantSlug: cookies["edumyles_tenant"] ?? null,
  };
}

// ─── Route status helpers ─────────────────────────────────────────────────────

function StatusIcon({ status }: { status: RouteStatus }) {
  if (status === null) return null;
  if (status === "loading") return <Loader2 className="w-3 h-3 animate-spin text-gray-400" />;
  if (status === "error") return <AlertCircle className="w-3 h-3 text-orange-500" aria-label="Network error" />;
  if (status === 200) return <CheckCircle2 className="w-3 h-3 text-emerald-500" aria-label="200 OK" />;
  if (status === 404) return <XCircle className="w-3 h-3 text-red-500" aria-label="404 Not Found" />;
  if (status >= 300 && status < 400) return <RefreshCw className="w-3 h-3 text-blue-400" aria-label={`${status} Redirect`} />;
  if (status >= 500) return <AlertCircle className="w-3 h-3 text-red-600" aria-label={`${status} Server Error`} />;
  return <span className="text-[9px] font-mono text-gray-400">{status}</span>;
}

function statusLabel(status: RouteStatus): string {
  if (status === null) return "";
  if (status === "loading") return "Checking…";
  if (status === "error") return "Network error";
  if (status === 200) return "200 OK";
  if (status === 404) return "404 Not Found";
  if (status !== null && typeof status === "number" && status >= 300 && status < 400) return `${status} Redirect`;
  if (status !== null && typeof status === "number" && status >= 500) return `${status} Server Error`;
  return String(status);
}

function panelAccentBg(color: string): string {
  if (color.includes("violet")) return "bg-violet-600";
  if (color.includes("blue")) return "bg-blue-600";
  if (color.includes("emerald")) return "bg-emerald-600";
  if (color.includes("amber")) return "bg-amber-600";
  if (color.includes("rose")) return "bg-rose-600";
  if (color.includes("cyan")) return "bg-cyan-600";
  if (color.includes("orange")) return "bg-orange-600";
  return "bg-gray-600";
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DevPanelsPage() {
  const [search, setSearch] = useState("");
  const [activeBadges, setActiveBadges] = useState<Set<string>>(new Set());
  const [activeRole, setActiveRole] = useState("");
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(new Set());
  const [recentlyVisited, setRecentlyVisited] = useState<RecentEntry[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showSession, setShowSession] = useState(false);
  const [showEnv, setShowEnv] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [routeStatuses, setRouteStatuses] = useState<Record<string, RouteStatus>>({});
  const [checkingPanel, setCheckingPanel] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load session + recent from client storage
  useEffect(() => {
    setSessionInfo(readSessionInfo());
    try {
      const stored = localStorage.getItem("edumyles_dev_recent");
      if (stored) setRecentlyVisited(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K → focus search, Esc → clear
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "Escape") {
        setSearch("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const trackVisit = useCallback((entry: Omit<RecentEntry, "ts">) => {
    setRecentlyVisited((prev) => {
      const filtered = prev.filter((r) => r.href !== entry.href);
      const next = [{ ...entry, ts: Date.now() }, ...filtered].slice(0, 8);
      try { localStorage.setItem("edumyles_dev_recent", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentlyVisited([]);
    try { localStorage.removeItem("edumyles_dev_recent"); } catch { /* ignore */ }
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(window.location.origin + text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => { /* ignore */ });
  }, []);

  const toggleCollapse = useCallback((title: string) => {
    setCollapsedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedPanels(new Set(panels.map((p) => p.title)));
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedPanels(new Set());
  }, []);

  const toggleBadge = useCallback((badge: string) => {
    setActiveBadges((prev) => {
      const next = new Set(prev);
      if (next.has(badge)) next.delete(badge); else next.add(badge);
      return next;
    });
  }, []);

  const checkRoute = useCallback(async (href: string) => {
    setRouteStatuses((prev) => ({ ...prev, [href]: "loading" }));
    try {
      const res = await fetch(href, { method: "GET", redirect: "manual" });
      const status = res.status === 0 ? 302 : res.status;
      setRouteStatuses((prev) => ({ ...prev, [href]: status }));
    } catch {
      setRouteStatuses((prev) => ({ ...prev, [href]: "error" }));
    }
  }, []);

  const checkAllInPanel = useCallback(async (panelLinks: PanelLink[], panelTitle: string) => {
    setCheckingPanel(panelTitle);
    const unique = [...new Set(panelLinks.map((l) => l.href))];
    for (const href of unique) {
      setRouteStatuses((prev) => ({ ...prev, [href]: "loading" }));
    }
    await Promise.all(
      unique.map(async (href) => {
        try {
          const res = await fetch(href, { method: "GET", redirect: "manual" });
          const status = res.status === 0 ? 302 : res.status;
          setRouteStatuses((prev) => ({ ...prev, [href]: status }));
        } catch {
          setRouteStatuses((prev) => ({ ...prev, [href]: "error" }));
        }
      })
    );
    setCheckingPanel(null);
  }, []);

  const clearStatuses = useCallback(() => setRouteStatuses({}), []);

  // ── Filtered panels ────────────────────────────────────────────────────────

  const filteredPanels = useMemo(() => {
    return panels
      .map((panel) => {
        const roleMatch =
          !activeRole ||
          panel.roles.includes(activeRole) ||
          panel.role === "all roles" ||
          panel.role === "unauthenticated";
        if (!roleMatch) return null;

        const filteredLinks = panel.links.filter((link) => {
          const matchSearch =
            !search ||
            link.label.toLowerCase().includes(search.toLowerCase()) ||
            link.href.toLowerCase().includes(search.toLowerCase());
          const matchBadge =
            activeBadges.size === 0 ||
            (link.badge ? activeBadges.has(link.badge) : false);
          return matchSearch && matchBadge;
        });

        if ((search || activeBadges.size > 0) && filteredLinks.length === 0) return null;
        return { ...panel, links: filteredLinks };
      })
      .filter(Boolean) as PanelSection[];
  }, [search, activeBadges, activeRole]);

  const totalPages = useMemo(() => panels.reduce((s, p) => s + p.links.length, 0), []);
  const filteredTotal = useMemo(() => filteredPanels.reduce((s, p) => s + p.links.length, 0), [filteredPanels]);
  const hasActiveFilters = search || activeBadges.size > 0 || activeRole;

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setActiveBadges(new Set());
    setActiveRole("");
  }, []);

  // ── Environment vars ───────────────────────────────────────────────────────
  const envVars: Array<{ key: string; value: string; sensitive?: boolean }> = [
    { key: "NODE_ENV", value: process.env.NODE_ENV ?? "—" },
    { key: "NEXT_PUBLIC_APP_URL", value: process.env.NEXT_PUBLIC_APP_URL ?? "—" },
    { key: "NEXT_PUBLIC_CONVEX_URL", value: process.env.NEXT_PUBLIC_CONVEX_URL ?? "—" },
    { key: "NEXT_PUBLIC_ROOT_DOMAIN", value: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "—" },
    { key: "NEXT_PUBLIC_LANDING_URL", value: process.env.NEXT_PUBLIC_LANDING_URL ?? "—" },
    { key: "NEXT_PUBLIC_WORKOS_CLIENT_ID", value: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID ? "set ✓" : "not set", sensitive: true },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 font-sans">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600 text-white shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Dev Navigator</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-none">EduMyles · all panels</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages… (⌘K)"
              className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All roles</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40 font-medium transition-colors"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
            {Object.keys(routeStatuses).length > 0 && (
              <button
                onClick={clearStatuses}
                title="Clear route status checks"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <XCircle className="w-3 h-3" />
                Clear checks
              </button>
            )}
            <button
              onClick={() => { setShowEnv(false); setShowSession((v) => !v); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${
                showSession
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Database className="w-3 h-3" />
              Session
              {sessionInfo?.hasSession && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              )}
            </button>
            <button
              onClick={() => { setShowSession(false); setShowEnv((v) => !v); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${
                showEnv
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Server className="w-3 h-3" />
              Env
            </button>
            <button
              onClick={collapsedPanels.size === panels.length ? expandAll : collapseAll}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              <Layers className="w-3 h-3" />
              {collapsedPanels.size === panels.length ? "Expand all" : "Collapse all"}
            </button>
          </div>

          {/* Dev warning pill */}
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5 font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Dev Only
          </div>
        </div>

        {/* Badge filter strip */}
        <div className="max-w-screen-2xl mx-auto px-4 pb-2.5 flex flex-wrap items-center gap-1.5">
          <Filter className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="text-[10px] text-gray-400 mr-0.5">Module:</span>
          {ALL_BADGES.map((badge) => (
            <button
              key={badge}
              onClick={() => toggleBadge(badge)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-sm border transition-all ${
                activeBadges.has(badge)
                  ? `${badgeColors[badge]} border-current ring-1 ring-current ring-offset-0 opacity-100`
                  : `${badgeColors[badge]} border-transparent opacity-60 hover:opacity-100`
              }`}
            >
              {badge}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-4 space-y-6">

        {/* ── Session inspector panel ── */}
        {showSession && sessionInfo && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">Session Inspector</h3>
              </div>
              <button onClick={() => setShowSession(false)} className="text-blue-400 hover:text-blue-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Session", value: sessionInfo.hasSession ? "Active" : "None", ok: sessionInfo.hasSession },
                { label: "Role", value: sessionInfo.role ?? "—", ok: !!sessionInfo.role },
                { label: "Email", value: sessionInfo.user?.email ?? "—", ok: !!sessionInfo.user?.email },
                { label: "Name", value: sessionInfo.user?.name ?? "—", ok: !!sessionInfo.user?.name },
                { label: "Impersonating", value: sessionInfo.isImpersonating ? "Yes" : "No", ok: !sessionInfo.isImpersonating },
                { label: "Maintenance", value: sessionInfo.maintenance ? "ON" : "Off", ok: !sessionInfo.maintenance },
              ].map(({ label, value, ok }) => (
                <div key={label} className="bg-white dark:bg-gray-900 rounded-lg border border-blue-100 dark:border-blue-900 p-3">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  <p className={`text-xs font-semibold truncate ${ok ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/auth/login"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
              >
                <Lock className="w-3 h-3" /> Login page
              </a>
              <a
                href="/platform/impersonation"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
              >
                <Eye className="w-3 h-3" /> Impersonation
              </a>
              <button
                onClick={() => setSessionInfo(readSessionInfo())}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
          </div>
        )}

        {/* ── Env info panel ── */}
        {showEnv && (
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-bold text-green-700 dark:text-green-300">Environment</h3>
              </div>
              <button onClick={() => setShowEnv(false)} className="text-green-400 hover:text-green-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {envVars.map(({ key, value }) => (
                <div key={key} className="bg-white dark:bg-gray-900 rounded-lg border border-green-100 dark:border-green-900 p-3 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 leading-tight">{key}</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 font-mono break-all mt-0.5 leading-tight">
                      {value}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(value)}
                    className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5"
                    title="Copy value"
                  >
                    {copied === value ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recently visited ── */}
        {recentlyVisited.length > 0 && !hasActiveFilters && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Recently visited</span>
              </div>
              <button onClick={clearRecent} className="text-[10px] text-gray-400 hover:text-gray-600 underline">
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentlyVisited.map((entry) => (
                <a
                  key={entry.href}
                  href={entry.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackVisit(entry)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all group"
                >
                  <span className={`text-[10px] font-medium ${entry.color} opacity-70 group-hover:opacity-100`}>
                    {entry.panelTitle.replace(" Panel", "").replace(" Portal", "")}
                  </span>
                  <span className="text-xs text-gray-700 dark:text-gray-300">{entry.label}</span>
                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats tiles ── */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {hasActiveFilters
                  ? `${filteredTotal} of ${totalPages} pages across ${filteredPanels.length} panels`
                  : `${totalPages} pages across ${panels.length} panels`}
              </span>
            </div>
            {Object.keys(routeStatuses).length > 0 && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                · {Object.values(routeStatuses).filter((s) => s !== "loading").length} routes checked
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {panels.map((panel) => {
              const isFiltered = !filteredPanels.find((p) => p.title === panel.title);
              return (
                <button
                  key={panel.title}
                  onClick={() => {
                    const el = document.getElementById(panel.title.toLowerCase().replace(/\s+/g, "-"));
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`rounded-lg border p-2.5 text-center hover:shadow-md transition-all ${panel.bgColor} ${panel.borderColor} ${
                    isFiltered ? "opacity-30" : ""
                  }`}
                >
                  <p className={`text-[10px] font-semibold leading-tight ${panel.color}`}>
                    {panel.title.replace(" Panel", "").replace(" Portal", "").replace(" System", "").replace(" Pages", "")}
                  </p>
                  <p className="text-base font-bold text-gray-800 dark:text-gray-200 mt-0.5 leading-none">
                    {filteredPanels.find((p) => p.title === panel.title)?.links.length ?? 0}
                    {hasActiveFilters && (
                      <span className="text-[10px] font-normal text-gray-400">/{panel.links.length}</span>
                    )}
                  </p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">pages</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── No results ── */}
        {filteredPanels.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No pages match your filters</p>
            <button onClick={clearAllFilters} className="mt-2 text-xs underline text-violet-600 dark:text-violet-400">
              Clear all filters
            </button>
          </div>
        )}

        {/* ── Panel sections ── */}
        <div className="space-y-4">
          {filteredPanels.map((panel) => {
            const isCollapsed = collapsedPanels.has(panel.title);
            const panelId = panel.title.toLowerCase().replace(/\s+/g, "-");
            const isCheckingThis = checkingPanel === panel.title;
            const panelStatuses = panel.links.map((l) => routeStatuses[l.href]).filter(Boolean);
            const hasChecked = panelStatuses.length > 0;

            return (
              <section
                key={panel.title}
                id={panelId}
                className={`rounded-xl border ${panel.borderColor} overflow-hidden scroll-mt-24`}
              >
                {/* Section header */}
                <div className={`${panel.bgColor} px-5 py-3.5 border-b ${panel.borderColor}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <button
                      onClick={() => toggleCollapse(panel.title)}
                      className="flex items-center gap-2 text-left group"
                    >
                      {isCollapsed
                        ? <ChevronRight className={`w-4 h-4 ${panel.color} opacity-60 group-hover:opacity-100`} />
                        : <ChevronDown className={`w-4 h-4 ${panel.color} opacity-60 group-hover:opacity-100`} />
                      }
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className={`text-sm font-bold ${panel.color}`}>{panel.title}</h2>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-900/60 rounded px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 font-mono">
                            {panel.links.length} pages
                          </span>
                          {hasChecked && (
                            <span className="flex items-center gap-0.5">
                              {panelStatuses.filter((s) => s === 200).length > 0 && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                  {panelStatuses.filter((s) => s === 200).length} ✓
                                </span>
                              )}
                              {panelStatuses.filter((s) => s === 404).length > 0 && (
                                <span className="text-[10px] text-red-600 dark:text-red-400 ml-1">
                                  {panelStatuses.filter((s) => s === 404).length} ✗
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-none">{panel.description}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-900/60 rounded px-2 py-1 border border-gray-200 dark:border-gray-700 font-mono hidden sm:inline">
                        {panel.role}
                      </span>
                      <button
                        onClick={() => checkAllInPanel(panel.links, panel.title)}
                        disabled={isCheckingThis}
                        title="Health-check all routes in this panel"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
                      >
                        {isCheckingThis
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Checking…</>
                          : <><Activity className="w-3 h-3" /> Check all</>
                        }
                      </button>
                      <Link
                        href={panel.dashboardHref}
                        target="_blank"
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 ${panelAccentBg(panel.color)}`}
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Links grid */}
                {!isCollapsed && (
                  <div className="bg-white dark:bg-gray-900 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
                      {panel.links.map((link) => {
                        const LinkIcon = link.icon;
                        const status = routeStatuses[link.href];
                        const isCopied = copied === link.href;

                        return (
                          <div
                            key={link.href}
                            className="group relative flex flex-col gap-1.5 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                          >
                            {/* Top row: icon + status + copy button */}
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <LinkIcon className={`w-3.5 h-3.5 shrink-0 ${panel.color} opacity-60 group-hover:opacity-100`} />
                                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-tight truncate">
                                  {link.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {/* Status icon */}
                                {status !== null && status !== undefined && (
                                  <span title={statusLabel(status)}>
                                    <StatusIcon status={status} />
                                  </span>
                                )}
                                {/* Copy button */}
                                <button
                                  onClick={(e) => { e.preventDefault(); copyToClipboard(link.href); }}
                                  title="Copy URL"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  {isCopied
                                    ? <Check className="w-3 h-3 text-emerald-500" />
                                    : <Copy className="w-3 h-3" />
                                  }
                                </button>
                              </div>
                            </div>

                            {/* Badge + path */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {link.badge && (
                                <span className={`text-[9px] font-medium px-1 py-0.5 rounded-sm ${badgeColors[link.badge] ?? "bg-gray-100 text-gray-600"}`}>
                                  {link.badge}
                                </span>
                              )}
                              <span className="text-[9px] text-gray-400 dark:text-gray-600 font-mono truncate flex-1 min-w-0">
                                {link.href}
                              </span>
                            </div>

                            {/* Action row: open + check */}
                            <div className="flex items-center gap-1 mt-0.5">
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackVisit({ href: link.href, label: link.label, panelTitle: panel.title, color: panel.color })}
                                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-medium text-white transition-opacity hover:opacity-90 ${panelAccentBg(panel.color)}`}
                              >
                                Open <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              <button
                                onClick={() => checkRoute(link.href)}
                                title="Check route status"
                                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                {status === "loading"
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <Activity className="w-3 h-3" />
                                }
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* ── Route status legend ── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dev Notes</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Route health check legend</p>
              <div className="space-y-1">
                {[
                  { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />, text: "200 OK — Page renders (may need auth)" },
                  { icon: <RefreshCw className="w-3.5 h-3.5 text-blue-400" />, text: "302/307 Redirect — Usually to login page" },
                  { icon: <XCircle className="w-3.5 h-3.5 text-red-500" />, text: "404 Not Found — Route not yet implemented" },
                  { icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" />, text: "500 Server Error — Investigate logs" },
                  { icon: <AlertCircle className="w-3.5 h-3.5 text-orange-500" />, text: "Network error — CORS or fetch issue" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    {icon}
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Module badge reference</p>
              <div className="flex flex-wrap gap-1">
                {ALL_BADGES.map((b) => (
                  <span key={b} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${badgeColors[b]}`}>
                    {b}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-gray-500 dark:text-gray-500">
                Pages with module badges also require that module to be installed in the tenant via{" "}
                <a href="/admin/modules" target="_blank" className="underline text-violet-600 dark:text-violet-400">
                  /admin/modules
                </a>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
