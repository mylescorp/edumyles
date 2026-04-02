/**
 * Central module definitions for the EduMyles platform.
 *
 * Core modules: Always available for all tenants, auto-installed, cannot be uninstalled.
 * Optional modules: Available via marketplace, can be installed/uninstalled per tenant.
 */

export interface ModuleDefinition {
  moduleId: string;
  name: string;
  description: string;
  /** Minimum subscription tier required to install this module */
  tier: "starter" | "standard" | "pro" | "enterprise";
  category: "academics" | "administration" | "communications" | "finance" | "analytics" | "security" | "integrations";
  isCore: boolean;
  iconName: string;
  version: string;
  features: string[];
  dependencies: string[];
  documentation: string;
  pricing: { monthly: number; quarterly?: number; annual?: number; currency: string };
  support: { email: string; phone: string; responseTime: string };
}

/**
 * Module dependency graph — single source of truth.
 * Keys: module that has dependencies. Values: modules that must be installed first.
 * Imported by mutations.ts, moduleGuard.ts, and frontend components.
 */
export const MODULE_DEPENDENCIES: Record<string, string[]> = {
  academics: ["sis"],
  admissions: ["sis"],
  finance: ["sis"],
  timetable: ["sis", "academics"],
  hr: [],
  library: ["sis"],
  transport: ["sis"],
  ewallet: ["finance"],
  ecommerce: ["ewallet"],
  tickets: [],
  communications: [],
  users: [],
  sis: [],
};

/** Core modules — always available, auto-installed for every tenant */
export const CORE_MODULES: ModuleDefinition[] = [
  {
    moduleId: "sis",
    name: "Student Information System",
    description: "Core student management — enrollment, records, classes, and student profiles. The foundation module required by most other modules.",
    tier: "starter",
    category: "administration",
    isCore: true,
    iconName: "GraduationCap",
    version: "1.0.0",
    features: [
      "Student enrollment & registration",
      "Student profiles & records",
      "Class & section management",
      "Student status tracking",
      "Bulk student import",
      "Student search & filtering",
    ],
    dependencies: [],
    documentation: "https://docs.edumyles.com/modules/sis",
    pricing: { monthly: 0, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "24h" },
  },
  {
    moduleId: "communications",
    name: "Communications",
    description: "Core messaging and announcements. Send announcements, emails, SMS, and push notifications to students, parents, and staff.",
    tier: "starter",
    category: "communications",
    isCore: true,
    iconName: "MessageSquare",
    version: "1.0.0",
    features: [
      "Announcements & notices",
      "Email messaging",
      "SMS notifications",
      "Push notifications",
      "Audience targeting",
      "Message templates",
    ],
    dependencies: [],
    documentation: "https://docs.edumyles.com/modules/communications",
    pricing: { monthly: 0, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "24h" },
  },
  {
    moduleId: "users",
    name: "User Management",
    description: "Core user and role management. Invite users, assign roles, and manage access control across your school.",
    tier: "starter",
    category: "administration",
    isCore: true,
    iconName: "Users",
    version: "1.0.0",
    features: [
      "User directory",
      "Role assignment",
      "User invitations",
      "Access control",
      "Activity tracking",
    ],
    dependencies: [],
    documentation: "https://docs.edumyles.com/modules/users",
    pricing: { monthly: 0, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "24h" },
  },
];

/** Optional modules — available via marketplace, install/uninstall per tenant */
export const OPTIONAL_MODULES: ModuleDefinition[] = [
  {
    moduleId: "admissions",
    name: "Admissions",
    description: "Manage the complete student admissions pipeline — from application submission through review, acceptance, and enrollment.",
    tier: "starter",
    category: "administration",
    isCore: false,
    iconName: "ClipboardList",
    version: "1.0.0",
    features: [
      "Online application forms",
      "Application tracking pipeline",
      "Document uploads",
      "Admission workflow (draft → submitted → review → accepted/rejected)",
      "Waitlist management",
      "Guardian information collection",
    ],
    dependencies: ["sis"],
    documentation: "https://docs.edumyles.com/modules/admissions",
    pricing: { monthly: 15, annual: 150, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "24h" },
  },
  {
    moduleId: "academics",
    name: "Academics",
    description: "Manage academic operations — exams, grading, subjects, curriculum, and academic performance tracking.",
    tier: "standard",
    category: "academics",
    isCore: false,
    iconName: "BookOpen",
    version: "1.0.0",
    features: [
      "Exam management & scheduling",
      "Grade recording & report cards",
      "Subject management",
      "Curriculum tracking",
      "Academic performance analytics",
      "Academic calendar & events",
    ],
    dependencies: ["sis"],
    documentation: "https://docs.edumyles.com/modules/academics",
    pricing: { monthly: 20, annual: 200, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "24h" },
  },
  {
    moduleId: "finance",
    name: "Finance & Fees",
    description: "Complete financial management — fee structures, invoicing, payment tracking, and financial reporting.",
    tier: "standard",
    category: "finance",
    isCore: false,
    iconName: "DollarSign",
    version: "1.0.0",
    features: [
      "Fee structure management",
      "Invoice generation",
      "Payment tracking",
      "Collection rate analytics",
      "Financial reports",
      "Multi-currency support",
    ],
    dependencies: ["sis"],
    documentation: "https://docs.edumyles.com/modules/finance",
    pricing: { monthly: 25, annual: 250, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "12h" },
  },
  {
    moduleId: "timetable",
    name: "Timetable & Scheduling",
    description: "Create and manage class timetables with automatic conflict detection for teachers, rooms, and subjects.",
    tier: "standard",
    category: "academics",
    isCore: false,
    iconName: "Calendar",
    version: "1.0.0",
    features: [
      "Visual timetable builder",
      "Conflict detection (teacher/room/class)",
      "Auto-resolve conflicts",
      "Teacher assignment management",
      "Room utilization tracking",
      "Timetable export",
    ],
    dependencies: ["sis", "academics"],
    documentation: "https://docs.edumyles.com/modules/timetable",
    pricing: { monthly: 15, annual: 150, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "24h" },
  },
  {
    moduleId: "hr",
    name: "HR & Payroll",
    description: "Comprehensive human resources management — staff records, payroll processing, leave management, and performance reviews.",
    tier: "pro",
    category: "administration",
    isCore: false,
    iconName: "UserCog",
    version: "1.0.0",
    features: [
      "Staff directory & profiles",
      "Payroll processing",
      "Leave request & approval",
      "Employment contracts",
      "Performance reviews",
      "Department management",
    ],
    dependencies: [],
    documentation: "https://docs.edumyles.com/modules/hr",
    pricing: { monthly: 30, annual: 300, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "12h" },
  },
  {
    moduleId: "library",
    name: "Library Management",
    description: "Digital library catalog, book circulation, overdue tracking, and library analytics.",
    tier: "pro",
    category: "academics",
    isCore: false,
    iconName: "Library",
    version: "1.0.0",
    features: [
      "Book catalog management",
      "Borrow & return tracking",
      "Overdue alerts",
      "Low stock alerts",
      "Circulation reports",
      "Book ratings & reviews",
    ],
    dependencies: ["sis"],
    documentation: "https://docs.edumyles.com/modules/library",
    pricing: { monthly: 10, annual: 100, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "24h" },
  },
  {
    moduleId: "transport",
    name: "Transport Management",
    description: "Manage school transport — routes, vehicles, drivers, and real-time GPS tracking.",
    tier: "pro",
    category: "administration",
    isCore: false,
    iconName: "Bus",
    version: "1.0.0",
    features: [
      "Route creation & management",
      "Vehicle fleet tracking",
      "Driver management",
      "GPS tracking integration",
      "Capacity utilization",
      "Maintenance scheduling",
    ],
    dependencies: ["sis"],
    documentation: "https://docs.edumyles.com/modules/transport",
    pricing: { monthly: 20, annual: 200, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "24h" },
  },
  {
    moduleId: "ewallet",
    name: "eWallet",
    description: "Digital wallet system for cashless transactions — student wallets, top-ups, and transaction tracking.",
    tier: "enterprise",
    category: "finance",
    isCore: false,
    iconName: "Wallet",
    version: "1.0.0",
    features: [
      "Student & staff wallets",
      "Wallet top-up (M-Pesa, card, bank)",
      "Transaction processing",
      "Transaction history",
      "Bulk top-up",
      "Balance analytics",
    ],
    dependencies: ["finance"],
    documentation: "https://docs.edumyles.com/modules/ewallet",
    pricing: { monthly: 25, annual: 250, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "12h" },
  },
  {
    moduleId: "ecommerce",
    name: "eCommerce",
    description: "Online school store — sell uniforms, books, supplies, and manage orders with payment integration.",
    tier: "enterprise",
    category: "finance",
    isCore: false,
    iconName: "ShoppingCart",
    version: "1.0.0",
    features: [
      "Product catalog",
      "Order management",
      "Payment processing",
      "Stock management",
      "Sales analytics",
      "Order tracking",
    ],
    dependencies: ["ewallet"],
    documentation: "https://docs.edumyles.com/modules/ecommerce",
    pricing: { monthly: 30, annual: 300, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "12h" },
  },
  {
    moduleId: "tickets",
    name: "Support Tickets",
    description: "Internal support ticket system for staff, students, and parents to raise issues and track resolution.",
    tier: "starter",
    category: "communications",
    isCore: false,
    iconName: "Headphones",
    version: "1.0.0",
    features: [
      "Ticket creation & assignment",
      "Priority levels",
      "Status tracking",
      "Resolution workflow",
      "Ticket analytics",
      "SLA tracking",
    ],
    dependencies: [],
    documentation: "https://docs.edumyles.com/modules/tickets",
    pricing: { monthly: 0, currency: "USD" },
    support: { email: "support@edumyles.com", phone: "+254 700 000 000", responseTime: "24h" },
  },
];

/** All modules combined */
export const ALL_MODULES = [...CORE_MODULES, ...OPTIONAL_MODULES];

/** Core module IDs for quick lookup */
export const CORE_MODULE_IDS = CORE_MODULES.map((m) => m.moduleId);

/** Check if a module is a core module */
export function isCoreModule(moduleId: string): boolean {
  return CORE_MODULE_IDS.includes(moduleId);
}
