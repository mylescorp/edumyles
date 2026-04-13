export type ModuleSlug =
  | "mod_finance"
  | "mod_attendance"
  | "mod_academics"
  | "mod_admissions"
  | "mod_library"
  | "mod_transport"
  | "mod_hr"
  | "mod_communications"
  | "mod_ewallet"
  | "mod_ecommerce"
  | "mod_reports"
  | "mod_timetable"
  | "mod_advanced_analytics"
  | "mod_parent_portal"
  | "mod_alumni"
  | "mod_partner";

export type AccessLevel = "full" | "read_only" | "restricted" | "none";
export type RoleKey = "school_admin" | "principal" | "teacher" | "student" | "parent";

export type ModuleMetadata = {
  slug: ModuleSlug;
  displayName: string;
  version: string;
};

export type ModuleNavItem = {
  href: string;
  label: string;
  icon: string;
  requiredFeature: string;
};

export type DashboardWidgetDefinition = {
  widgetId: string;
  title: string;
  supportedRoles: RoleKey[];
};

export type ModuleFeature = {
  key: string;
  label: string;
  description: string;
  defaultRoles: RoleKey[];
};

export type RoleAccessConfig = {
  role: RoleKey;
  accessLevel: AccessLevel;
  allowedFeatures: string[];
};

export type ModuleConfigField = {
  key: string;
  type: "boolean" | "number" | "string" | "select" | "multiselect" | "text" | "time" | "date";
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: string | number | boolean | string[];
  options?: Array<{ label: string; value: string }>;
  dependsOn?: {
    key: string;
    value: string | number | boolean;
  };
};

export type ModuleConfigSection = {
  key: string;
  title: string;
  description: string;
  fields: ModuleConfigField[];
};

export type ModuleConfigSchema = {
  moduleSlug: ModuleSlug;
  sections: ModuleConfigSection[];
};

export type ModuleNotification = {
  key: string;
  label: string;
  description: string;
  defaultChannels: string[];
  canDisable: boolean;
  hasFrequency?: boolean;
};

export type ModuleEventSubscription = {
  eventType: string;
  handlerFunctionName: string;
};

export type ModuleSpec = {
  metadata: ModuleMetadata;
  navConfig: {
    adminNav: ModuleNavItem[];
    teacherNav: ModuleNavItem[];
    studentNav: ModuleNavItem[];
    parentNav: ModuleNavItem[];
    dashboardWidgets: DashboardWidgetDefinition[];
  };
  dashboardWidgets: DashboardWidgetDefinition[];
  features: Record<string, ModuleFeature>;
  defaultRoleAccess: RoleAccessConfig[];
  configSchema: ModuleConfigSchema;
  notifications: ModuleNotification[];
  subscriptions: ModuleEventSubscription[];
};

type ModuleSeedInput = {
  slug: ModuleSlug;
  displayName: string;
  adminHref: string;
  teacherHref?: string;
  studentHref?: string;
  parentHref?: string;
  icon: string;
  featurePrefix: string;
  configSections: ModuleConfigSection[];
  notifications: ModuleNotification[];
  subscriptions?: ModuleEventSubscription[];
  teacherAccess?: AccessLevel;
  studentAccess?: AccessLevel;
  parentAccess?: AccessLevel;
  restrictedFeatures?: Partial<Record<RoleKey, string[]>>;
};

export function createDefaultRoleAccess(
  features: Record<string, ModuleFeature>,
  overrides?: {
    teacherAccess?: AccessLevel;
    studentAccess?: AccessLevel;
    parentAccess?: AccessLevel;
    restrictedFeatures?: Partial<Record<RoleKey, string[]>>;
  }
): RoleAccessConfig[] {
  const featureKeys = Object.keys(features);
  const restricted = overrides?.restrictedFeatures ?? {};

  return [
    {
      role: "school_admin",
      accessLevel: "full",
      allowedFeatures: featureKeys,
    },
    {
      role: "principal",
      accessLevel: "full",
      allowedFeatures: featureKeys,
    },
    {
      role: "teacher",
      accessLevel: overrides?.teacherAccess ?? "restricted",
      allowedFeatures: restricted.teacher ?? featureKeys.filter((key) => key.startsWith("view_")),
    },
    {
      role: "student",
      accessLevel: overrides?.studentAccess ?? "none",
      allowedFeatures: restricted.student ?? [],
    },
    {
      role: "parent",
      accessLevel: overrides?.parentAccess ?? "none",
      allowedFeatures: restricted.parent ?? [],
    },
  ];
}

function createFeatureSet(prefix: string, displayName: string): Record<string, ModuleFeature> {
  return {
    [`view_${prefix}_dashboard`]: {
      key: `view_${prefix}_dashboard`,
      label: `${displayName} Dashboard`,
      description: `View ${displayName.toLowerCase()} dashboards and summaries.`,
      defaultRoles: ["school_admin", "principal", "teacher"],
    },
    [`manage_${prefix}_records`]: {
      key: `manage_${prefix}_records`,
      label: `Manage ${displayName}`,
      description: `Create and update ${displayName.toLowerCase()} records.`,
      defaultRoles: ["school_admin", "principal"],
    },
    [`configure_${prefix}`]: {
      key: `configure_${prefix}`,
      label: `Configure ${displayName}`,
      description: `Update ${displayName.toLowerCase()} settings and policies.`,
      defaultRoles: ["school_admin"],
    },
  };
}

function createModuleSpec(input: ModuleSeedInput): ModuleSpec {
  const features = createFeatureSet(input.featurePrefix, input.displayName);
  const defaultRoleAccess = createDefaultRoleAccess(features, {
    teacherAccess: input.teacherAccess,
    studentAccess: input.studentAccess,
    parentAccess: input.parentAccess,
    restrictedFeatures: input.restrictedFeatures,
  });

  const dashboardWidgets: DashboardWidgetDefinition[] = [
    {
      widgetId: `${input.slug}_overview`,
      title: `${input.displayName} Overview`,
      supportedRoles: ["school_admin", "principal", "teacher"],
    },
  ];

  return {
    metadata: {
      slug: input.slug,
      displayName: input.displayName,
      version: "1.0.0",
    },
    navConfig: {
      adminNav: [
        {
          href: input.adminHref,
          label: input.displayName,
          icon: input.icon,
          requiredFeature: `view_${input.featurePrefix}_dashboard`,
        },
      ],
      teacherNav: input.teacherHref
        ? [
            {
              href: input.teacherHref,
              label: input.displayName,
              icon: input.icon,
              requiredFeature: `view_${input.featurePrefix}_dashboard`,
            },
          ]
        : [],
      studentNav: input.studentHref
        ? [
            {
              href: input.studentHref,
              label: input.displayName,
              icon: input.icon,
              requiredFeature: `view_${input.featurePrefix}_dashboard`,
            },
          ]
        : [],
      parentNav: input.parentHref
        ? [
            {
              href: input.parentHref,
              label: input.displayName,
              icon: input.icon,
              requiredFeature: `view_${input.featurePrefix}_dashboard`,
            },
          ]
        : [],
      dashboardWidgets,
    },
    dashboardWidgets,
    features,
    defaultRoleAccess,
    configSchema: {
      moduleSlug: input.slug,
      sections: input.configSections,
    },
    notifications: input.notifications,
    subscriptions: input.subscriptions ?? [],
  };
}

export const MODULE_SPECS: Record<ModuleSlug, ModuleSpec> = {
  mod_finance: createModuleSpec({
    slug: "mod_finance",
    displayName: "Finance",
    adminHref: "/admin/finance",
    parentHref: "/portal/parent/finance",
    icon: "Coins",
    featurePrefix: "finance",
    restrictedFeatures: {
      teacher: ["view_finance_dashboard"],
      parent: ["view_finance_dashboard"],
    },
    parentAccess: "restricted",
    configSections: [
      {
        key: "billing",
        title: "Billing",
        description: "Configure default finance behaviors.",
        fields: [
          { key: "currency", type: "select", label: "Currency", defaultValue: "KES", options: [{ label: "KES", value: "KES" }] },
          { key: "invoiceDueDays", type: "number", label: "Invoice due days", defaultValue: 14 },
          { key: "applyVat", type: "boolean", label: "Apply VAT", defaultValue: true },
        ],
      },
    ],
    notifications: [
      { key: "payment_received_parent", label: "Payment received", description: "Notify parents after payment is recorded.", defaultChannels: ["in_app", "email"], canDisable: false },
      { key: "invoice_created_parent", label: "Invoice created", description: "Notify parents when a new invoice is generated.", defaultChannels: ["in_app", "email", "sms"], canDisable: false },
      { key: "overdue_reminder_parent", label: "Overdue reminder", description: "Send reminders for overdue invoices.", defaultChannels: ["in_app", "sms"], canDisable: true, hasFrequency: true },
    ],
    subscriptions: [
      { eventType: "student.enrolled", handlerFunctionName: "modules.finance.eventHandlers.onStudentEnrolled" },
      { eventType: "library.book.overdue", handlerFunctionName: "modules.finance.eventHandlers.onLibraryBookOverdue" },
    ],
  }),
  mod_attendance: createModuleSpec({
    slug: "mod_attendance",
    displayName: "Attendance",
    adminHref: "/admin/attendance",
    teacherHref: "/portal/teacher/attendance",
    parentHref: "/portal/parent/attendance",
    icon: "ClipboardCheck",
    featurePrefix: "attendance",
    parentAccess: "restricted",
    restrictedFeatures: {
      teacher: ["view_attendance_dashboard", "manage_attendance_records"],
      parent: ["view_attendance_dashboard"],
    },
    configSections: [
      {
        key: "marking",
        title: "Marking",
        description: "Configure attendance capture rules.",
        fields: [
          { key: "schoolStartTime", type: "time", label: "School start time", defaultValue: "08:00" },
          { key: "lateThresholdMinutes", type: "number", label: "Late threshold (minutes)", defaultValue: 15 },
          { key: "markingMethod", type: "select", label: "Marking method", defaultValue: "period", options: [{ label: "Per period", value: "period" }, { label: "Daily", value: "daily" }] },
        ],
      },
    ],
    notifications: [
      { key: "student_absent_parent", label: "Student absent", description: "Notify parents when a learner is absent.", defaultChannels: ["in_app", "sms"], canDisable: false },
      { key: "student_late_parent", label: "Student late", description: "Notify parents when a learner arrives late.", defaultChannels: ["in_app"], canDisable: true },
      { key: "consecutive_absence_admin", label: "Consecutive absence alert", description: "Alert admins about absence streaks.", defaultChannels: ["in_app", "email"], canDisable: false },
    ],
  }),
  mod_academics: createModuleSpec({
    slug: "mod_academics",
    displayName: "Academics",
    adminHref: "/admin/academics",
    teacherHref: "/portal/teacher/academics",
    studentHref: "/portal/student/academics",
    parentHref: "/portal/parent/academics",
    icon: "BookOpen",
    featurePrefix: "academics",
    studentAccess: "restricted",
    parentAccess: "restricted",
    restrictedFeatures: {
      teacher: ["view_academics_dashboard", "manage_academics_records"],
      student: ["view_academics_dashboard"],
      parent: ["view_academics_dashboard"],
    },
    configSections: [
      {
        key: "grading",
        title: "Grading",
        description: "Configure assessment and grading rules.",
        fields: [
          { key: "passMark", type: "number", label: "Pass mark", defaultValue: 50 },
          { key: "publishToParents", type: "boolean", label: "Publish results to parents", defaultValue: true },
        ],
      },
    ],
    notifications: [
      { key: "grade_posted_student", label: "Grade posted", description: "Notify students when grades are published.", defaultChannels: ["in_app"], canDisable: false },
      { key: "exam_results_published_parent", label: "Exam results published", description: "Notify parents when exam results are available.", defaultChannels: ["in_app", "email"], canDisable: false },
    ],
  }),
  mod_admissions: createModuleSpec({
    slug: "mod_admissions",
    displayName: "Admissions",
    adminHref: "/admin/admissions",
    icon: "ClipboardList",
    featurePrefix: "admissions",
    configSections: [
      {
        key: "applications",
        title: "Applications",
        description: "Configure admission intake settings.",
        fields: [
          { key: "acceptOnlineApplications", type: "boolean", label: "Accept online applications", defaultValue: true },
          { key: "defaultReviewWindowDays", type: "number", label: "Review window (days)", defaultValue: 7 },
        ],
      },
    ],
    notifications: [
      { key: "application_submitted_admin", label: "Application submitted", description: "Notify admins about new applications.", defaultChannels: ["in_app", "email"], canDisable: false },
    ],
  }),
  mod_library: createModuleSpec({
    slug: "mod_library",
    displayName: "Library",
    adminHref: "/admin/library",
    teacherHref: "/portal/teacher/library",
    studentHref: "/portal/student/library",
    icon: "Library",
    featurePrefix: "library",
    studentAccess: "restricted",
    restrictedFeatures: {
      teacher: ["view_library_dashboard", "manage_library_records"],
      student: ["view_library_dashboard"],
    },
    configSections: [
      {
        key: "borrowing",
        title: "Borrowing",
        description: "Configure borrowing periods and fines.",
        fields: [
          { key: "maxBooksPerStudent", type: "number", label: "Max books per student", defaultValue: 3 },
          { key: "borrowingPeriodDays", type: "number", label: "Borrowing period (days)", defaultValue: 14 },
          { key: "finePerDayKes", type: "number", label: "Fine per day (KES)", defaultValue: 5 },
        ],
      },
    ],
    notifications: [
      { key: "book_due_reminder_student", label: "Book due reminder", description: "Remind borrowers before the due date.", defaultChannels: ["in_app"], canDisable: true, hasFrequency: true },
      { key: "book_overdue_student", label: "Book overdue", description: "Alert borrowers when a book is overdue.", defaultChannels: ["in_app", "email"], canDisable: false },
    ],
    subscriptions: [
      { eventType: "finance.invoice.overdue", handlerFunctionName: "modules.library.eventHandlers.onFinanceInvoiceOverdue" },
      { eventType: "finance.payment.received", handlerFunctionName: "modules.library.eventHandlers.onFinancePaymentReceived" },
    ],
  }),
  mod_transport: createModuleSpec({
    slug: "mod_transport",
    displayName: "Transport",
    adminHref: "/admin/transport",
    parentHref: "/portal/parent/transport",
    icon: "Bus",
    featurePrefix: "transport",
    parentAccess: "restricted",
    restrictedFeatures: { parent: ["view_transport_dashboard"] },
    configSections: [
      {
        key: "tracking",
        title: "Tracking",
        description: "Configure route tracking and alerts.",
        fields: [
          { key: "trackingIntervalMinutes", type: "number", label: "Tracking interval (minutes)", defaultValue: 5 },
          { key: "parentNotificationTimingMinutes", type: "number", label: "Notify parents before arrival (minutes)", defaultValue: 10 },
        ],
      },
    ],
    notifications: [
      { key: "route_delay_parent", label: "Route delay", description: "Notify parents about significant delays.", defaultChannels: ["in_app", "sms"], canDisable: true },
    ],
  }),
  mod_hr: createModuleSpec({
    slug: "mod_hr",
    displayName: "HR",
    adminHref: "/admin/hr",
    teacherHref: "/portal/teacher/hr",
    icon: "Briefcase",
    featurePrefix: "hr",
    teacherAccess: "read_only",
    configSections: [
      {
        key: "leave",
        title: "Leave",
        description: "Configure approval workflows and policy.",
        fields: [
          { key: "leaveApprovalChain", type: "multiselect", label: "Leave approval chain", defaultValue: ["principal", "school_admin"], options: [{ label: "Principal", value: "principal" }, { label: "School admin", value: "school_admin" }] },
          { key: "payrollApprovalRequired", type: "boolean", label: "Payroll approval required", defaultValue: true },
        ],
      },
    ],
    notifications: [
      { key: "leave_request_submitted_admin", label: "Leave request submitted", description: "Notify approvers about leave requests.", defaultChannels: ["in_app", "email"], canDisable: false },
      { key: "leave_approved_staff", label: "Leave approved", description: "Notify staff when leave is approved.", defaultChannels: ["in_app"], canDisable: false },
      { key: "payslip_ready_staff", label: "Payslip ready", description: "Notify staff when payslips are ready.", defaultChannels: ["in_app", "email"], canDisable: true },
    ],
  }),
  mod_communications: createModuleSpec({
    slug: "mod_communications",
    displayName: "Communications",
    adminHref: "/admin/communications",
    teacherHref: "/portal/teacher/communications",
    parentHref: "/portal/parent/communications",
    icon: "MessageSquare",
    featurePrefix: "communications",
    parentAccess: "read_only",
    configSections: [
      {
        key: "delivery",
        title: "Delivery",
        description: "Configure channel preferences and approvals.",
        fields: [
          { key: "defaultSenderName", type: "string", label: "Default sender name", defaultValue: "EduMyles" },
          { key: "smsEnabled", type: "boolean", label: "SMS enabled", defaultValue: true },
        ],
      },
    ],
    notifications: [
      { key: "broadcast_sent_admin", label: "Broadcast sent", description: "Confirm broadcast delivery to admins.", defaultChannels: ["in_app"], canDisable: false },
    ],
    subscriptions: [
      { eventType: "attendance.student.absent", handlerFunctionName: "modules.communications.eventHandlers.onAttendanceStudentAbsent" },
      { eventType: "attendance.student.absent.consecutive", handlerFunctionName: "modules.communications.eventHandlers.onAttendanceStudentConsecutive" },
      { eventType: "academics.grade.posted", handlerFunctionName: "modules.communications.eventHandlers.onAcademicsGradePosted" },
      { eventType: "academics.exam.results.published", handlerFunctionName: "modules.communications.eventHandlers.onAcademicsExamResultsPublished" },
      { eventType: "finance.invoice.created", handlerFunctionName: "modules.communications.eventHandlers.onFinanceInvoiceCreated" },
      { eventType: "finance.invoice.overdue", handlerFunctionName: "modules.communications.eventHandlers.onFinanceInvoiceOverdue" },
      { eventType: "finance.payment.received", handlerFunctionName: "modules.communications.eventHandlers.onFinancePaymentReceived" },
    ],
  }),
  mod_ewallet: createModuleSpec({
    slug: "mod_ewallet",
    displayName: "E-Wallet",
    adminHref: "/admin/ewallet",
    parentHref: "/portal/parent/ewallet",
    icon: "Wallet",
    featurePrefix: "ewallet",
    parentAccess: "restricted",
    restrictedFeatures: { parent: ["view_ewallet_dashboard"] },
    configSections: [
      {
        key: "wallet",
        title: "Wallet",
        description: "Configure wallet funding and controls.",
        fields: [
          { key: "allowTopUps", type: "boolean", label: "Allow top-ups", defaultValue: true },
          { key: "minimumTopUpKes", type: "number", label: "Minimum top-up (KES)", defaultValue: 100 },
        ],
      },
    ],
    notifications: [
      { key: "wallet_topup_received", label: "Wallet top-up received", description: "Notify parents after top-ups are applied.", defaultChannels: ["in_app", "email"], canDisable: false },
    ],
    subscriptions: [{ eventType: "finance.payment.received", handlerFunctionName: "modules.ewallet.eventHandlers.onFinancePaymentReceived" }],
  }),
  mod_ecommerce: createModuleSpec({
    slug: "mod_ecommerce",
    displayName: "E-Commerce",
    adminHref: "/admin/ecommerce",
    parentHref: "/portal/parent/store",
    icon: "ShoppingCart",
    featurePrefix: "ecommerce",
    parentAccess: "restricted",
    restrictedFeatures: { parent: ["view_ecommerce_dashboard"] },
    configSections: [
      {
        key: "store",
        title: "Store",
        description: "Configure school store policies.",
        fields: [
          { key: "allowPublicCatalog", type: "boolean", label: "Allow public catalog", defaultValue: false },
          { key: "pickupInstructions", type: "text", label: "Pickup instructions", defaultValue: "Collect from school stores desk." },
        ],
      },
    ],
    notifications: [
      { key: "order_created_parent", label: "Order created", description: "Notify parents when an order is placed.", defaultChannels: ["in_app", "email"], canDisable: false },
    ],
  }),
  mod_reports: createModuleSpec({
    slug: "mod_reports",
    displayName: "Reports",
    adminHref: "/admin/reports",
    teacherHref: "/portal/teacher/reports",
    icon: "BarChart3",
    featurePrefix: "reports",
    teacherAccess: "read_only",
    configSections: [
      {
        key: "exports",
        title: "Exports",
        description: "Configure report export preferences.",
        fields: [
          { key: "defaultFormat", type: "select", label: "Default format", defaultValue: "pdf", options: [{ label: "PDF", value: "pdf" }, { label: "CSV", value: "csv" }] },
        ],
      },
    ],
    notifications: [
      { key: "scheduled_report_ready", label: "Scheduled report ready", description: "Notify users when scheduled reports are ready.", defaultChannels: ["in_app", "email"], canDisable: true },
    ],
  }),
  mod_timetable: createModuleSpec({
    slug: "mod_timetable",
    displayName: "Timetable",
    adminHref: "/admin/timetable",
    teacherHref: "/portal/teacher/timetable",
    studentHref: "/portal/student/timetable",
    parentHref: "/portal/parent/timetable",
    icon: "CalendarDays",
    featurePrefix: "timetable",
    studentAccess: "restricted",
    parentAccess: "restricted",
    restrictedFeatures: {
      teacher: ["view_timetable_dashboard", "manage_timetable_records"],
      student: ["view_timetable_dashboard"],
      parent: ["view_timetable_dashboard"],
    },
    configSections: [
      {
        key: "schedule",
        title: "Schedule",
        description: "Configure scheduling defaults.",
        fields: [
          { key: "defaultLessonDurationMinutes", type: "number", label: "Default lesson duration", defaultValue: 40 },
          { key: "allowAutoCoverSuggestions", type: "boolean", label: "Allow auto cover suggestions", defaultValue: true },
        ],
      },
    ],
    notifications: [
      { key: "cover_needed_admin", label: "Cover needed", description: "Notify admins when timetable cover is required.", defaultChannels: ["in_app"], canDisable: false },
    ],
    subscriptions: [{ eventType: "hr.leave.approved", handlerFunctionName: "modules.timetable.eventHandlers.onHrLeaveApproved" }],
  }),
  mod_advanced_analytics: createModuleSpec({
    slug: "mod_advanced_analytics",
    displayName: "Advanced Analytics",
    adminHref: "/admin/analytics",
    icon: "ChartNoAxesCombined",
    featurePrefix: "advanced_analytics",
    teacherAccess: "read_only",
    configSections: [
      {
        key: "insights",
        title: "Insights",
        description: "Configure analytics refresh and alerting.",
        fields: [
          { key: "refreshCadence", type: "select", label: "Refresh cadence", defaultValue: "daily", options: [{ label: "Daily", value: "daily" }, { label: "Weekly", value: "weekly" }] },
        ],
      },
    ],
    notifications: [
      { key: "anomaly_detected_admin", label: "Anomaly detected", description: "Notify admins when anomalies are detected.", defaultChannels: ["in_app", "email"], canDisable: true },
    ],
  }),
  mod_parent_portal: createModuleSpec({
    slug: "mod_parent_portal",
    displayName: "Parent Portal",
    adminHref: "/admin/parent-portal",
    parentHref: "/portal/parent",
    icon: "Users",
    featurePrefix: "parent_portal",
    parentAccess: "restricted",
    restrictedFeatures: { parent: ["view_parent_portal_dashboard"] },
    configSections: [
      {
        key: "portal",
        title: "Portal",
        description: "Configure parent portal experience.",
        fields: [
          { key: "showFeeSummary", type: "boolean", label: "Show fee summary", defaultValue: true },
          { key: "showAcademicSummary", type: "boolean", label: "Show academic summary", defaultValue: true },
        ],
      },
    ],
    notifications: [
      { key: "portal_invitation_parent", label: "Portal invitation", description: "Notify parents when accounts are created.", defaultChannels: ["email"], canDisable: false },
    ],
  }),
  mod_alumni: createModuleSpec({
    slug: "mod_alumni",
    displayName: "Alumni",
    adminHref: "/admin/alumni",
    icon: "GraduationCap",
    featurePrefix: "alumni",
    configSections: [
      {
        key: "engagement",
        title: "Engagement",
        description: "Configure alumni outreach settings.",
        fields: [
          { key: "welcomeMessage", type: "text", label: "Welcome message", defaultValue: "Welcome to the EduMyles alumni network." },
        ],
      },
    ],
    notifications: [
      { key: "alumni_welcome", label: "Alumni welcome", description: "Send a welcome message to newly created alumni.", defaultChannels: ["email"], canDisable: false },
    ],
    subscriptions: [{ eventType: "student.graduated", handlerFunctionName: "modules.alumni.eventHandlers.onStudentGraduated" }],
  }),
  mod_partner: createModuleSpec({
    slug: "mod_partner",
    displayName: "Partner",
    adminHref: "/admin/partners",
    icon: "Handshake",
    featurePrefix: "partner",
    configSections: [
      {
        key: "portal",
        title: "Partner Portal",
        description: "Configure partner workflows.",
        fields: [
          { key: "allowExternalRequests", type: "boolean", label: "Allow external requests", defaultValue: true },
        ],
      },
    ],
    notifications: [
      { key: "partner_request_received", label: "Partner request received", description: "Notify admins when a partner request is submitted.", defaultChannels: ["in_app", "email"], canDisable: true },
    ],
  }),
};

export function getModuleSpec(moduleSlug: ModuleSlug): ModuleSpec {
  return MODULE_SPECS[moduleSlug];
}
