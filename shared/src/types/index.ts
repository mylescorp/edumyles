// ============================================================
// EduMyles — Shared TypeScript Types
// Used by: frontend, mobile, backend (Convex)
// ============================================================

// ----------------------------------------------------------
// Tenant
// ----------------------------------------------------------
export type TenantId = string;

export type TenantTier = "starter" | "standard" | "pro" | "enterprise";

export type TenantStatus = "active" | "suspended" | "trial" | "churned";

export interface Tenant {
  _id: TenantId;
  tenantId: string;
  name: string;
  subdomain: string; // e.g. "greenview-academy" → greenview-academy.edumyles.com
  email: string;
  phone: string;
  plan: TenantTier;
  status: TenantStatus;
  county: string;
  country: string;
  suspendedAt?: number;
  suspendReason?: string;
  createdAt: number;
  updatedAt: number;
}

// ----------------------------------------------------------
// Users & Roles
// ----------------------------------------------------------
export type UserRole =
  | "master_admin" // Platform super-admin
  | "super_admin" // Platform operations admin
  | "platform_manager"
  | "support_agent"
  | "billing_admin"
  | "marketplace_reviewer"
  | "content_moderator"
  | "analytics_viewer"
  | "school_admin" // Full access within their tenant
  | "principal"
  | "teacher"
  | "student"
  | "parent"
  | "bursar" // Finance Officer (canonical backend name)
  | "librarian"
  | "transport_manager"
  | "hr_manager" // HR Officer (canonical backend name)
  | "board_member" // Board-level read-only access
  | "receptionist"
  | "alumni"
  | "partner"
  | "publisher" // Module publisher/developer
  | "reseller" // School reseller partner
  | "affiliate"; // Referral affiliate

export type LegacyUserRoleAlias = "platform_admin";

export interface User {
  _id: string;
  tenantId: TenantId;
  workosUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
}

// ----------------------------------------------------------
// Modules
// ----------------------------------------------------------
export type Module =
  | "sis" // Student Information System
  | "admissions" // Admissions & Enrollment
  | "finance" // Fee & Finance Management
  | "timetable" // Timetable & Scheduling
  | "academics" // Academics & Gradebook
  | "hr" // HR & Payroll
  | "library" // Library Management
  | "transport" // Transport Management
  | "communications" // Messaging & Notifications
  | "users" // User Management & Access Control
  | "tickets" // Support Tickets & Helpdesk
  | "ewallet" // eWallet
  | "ecommerce"; // School Shop / eCommerce

// ----------------------------------------------------------
// Academic
// ----------------------------------------------------------
export type TermType = "term" | "semester" | "quarter" | "trimester";

export interface AcademicYear {
  _id: string;
  tenantId: TenantId;
  name: string; // e.g. "2025–2026"
  startDate: string; // ISO date
  endDate: string;
  isCurrent: boolean;
  terms: AcademicTerm[];
}

export interface AcademicTerm {
  _id: string;
  name: string; // e.g. "Term 1"
  type: TermType;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

// ----------------------------------------------------------
// Students
// ----------------------------------------------------------
export interface Student {
  _id: string;
  tenantId: TenantId;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  classId: string;
  streamId?: string;
  status: "active" | "graduated" | "transferred" | "suspended" | "expelled";
  enrolledAt: number;
  createdAt: number;
  updatedAt: number;
}

// ----------------------------------------------------------
// Finance
// ----------------------------------------------------------
export type PaymentMethod =
  | "mpesa"
  | "airtel_money"
  | "stripe"
  | "bank_transfer"
  | "cash"
  | "cheque";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "cancelled";

export interface Payment {
  _id: string;
  tenantId: TenantId;
  studentId: string;
  amount: number; // in smallest currency unit (e.g. cents/pesa)
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  description: string;
  paidAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface StaffRecord {
  _id: string;
  tenantId: TenantId;
  userId?: string;
  staffId: string;
  firstName: string;
  lastName: string;
  role: UserRole | string;
  department?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SchoolClass {
  _id: string;
  tenantId: TenantId;
  name: string;
  gradeLevel?: string;
  streamIds?: string[];
  classTeacherId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Stream {
  _id: string;
  tenantId: TenantId;
  classId: string;
  name: string;
  capacity?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Invoice {
  _id: string;
  tenantId: TenantId;
  studentId: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  status: "pending" | "partially_paid" | "paid" | "overdue" | "cancelled";
  dueDate?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FeeStructure {
  _id: string;
  tenantId: TenantId;
  name: string;
  amount: number;
  academicYear: string;
  grade: string;
  frequency: "one_time" | "monthly" | "termly" | "yearly";
  createdAt: number;
  updatedAt: number;
}

export interface LedgerEntry {
  _id: string;
  tenantId: TenantId;
  studentId: string;
  invoiceId?: string;
  paymentId?: string;
  type: "charge" | "payment" | "adjustment" | "refund";
  amount: number;
  currency: string;
  description: string;
  createdAt: number;
}

export interface AppNotification {
  _id: string;
  tenantId: TenantId;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: number;
}

export interface SupportTicket {
  _id: string;
  tenantId: TenantId;
  title: string;
  description?: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  requesterId?: string;
  assigneeId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TransportRouteRecord {
  _id: string;
  tenantId: TenantId;
  name: string;
  vehicleId?: string;
  driverId?: string;
  stops: string[];
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface LibraryCirculationRecord {
  _id: string;
  tenantId: TenantId;
  bookId: string;
  borrowerId: string;
  borrowerType: "student" | "staff";
  issuedAt: number;
  dueAt: number;
  returnedAt?: number;
  status: string;
}

export interface EWalletTransactionRecord {
  _id: string;
  tenantId: TenantId;
  walletId: string;
  userId: string;
  amount: number;
  currency: string;
  type: "credit" | "debit" | "transfer" | "topup" | "withdrawal";
  status: string;
  reference?: string;
  createdAt: number;
}

export interface CommunicationTemplateRecord {
  _id: string;
  tenantId: TenantId;
  type: "sms" | "email";
  category: string;
  name: string;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LibraryBookRecord {
  _id: string;
  tenantId: TenantId;
  isbn?: string;
  title: string;
  author: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  createdAt: number;
  updatedAt: number;
}

export interface EcommerceProductRecord {
  _id: string;
  tenantId: TenantId;
  name: string;
  description?: string;
  category?: string;
  priceCents: number;
  stock: number;
  status: string;
  createdAt: number;
  updatedAt: number;
}

// ----------------------------------------------------------
// Timetable
// ----------------------------------------------------------
export interface TimetableSlot {
  _id: string;
  tenantId: TenantId;
  classId: string;
  subjectId: string;
  teacherId: string;
  substituteTeacherId?: string;
  dayOfWeek: number; // 1=Monday … 7=Sunday
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  room?: string;
  academicYear?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SchoolEvent {
  _id: string;
  tenantId: TenantId;
  title: string;
  description?: string;
  eventType: "academic" | "sports" | "cultural" | "holiday" | "meeting" | "other";
  startDate: string;  // ISO date
  endDate?: string;
  startTime?: string; // "HH:MM"
  endTime?: string;
  location?: string;
  audience?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

/** Database record for a school subject (distinct from the timetable scheduling Subject type). */
export interface SubjectRecord {
  _id: string;
  tenantId: TenantId;
  name: string;
  code?: string;
  department?: string;
  createdAt: number;
  updatedAt: number;
}

// ----------------------------------------------------------
// Announcements
// ----------------------------------------------------------
export type AnnouncementAudience =
  | "all"
  | "students"
  | "parents"
  | "guardians"
  | "teachers"
  | "staff";

export type AnnouncementPriority = "low" | "medium" | "high" | "urgent";

export interface Announcement {
  _id: string;
  tenantId: TenantId;
  title: string;
  body: string;
  audience: AnnouncementAudience | string;
  priority: AnnouncementPriority | string;
  status: "draft" | "published" | "archived";
  publishedAt?: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// ----------------------------------------------------------
// Guardians / Parents
// ----------------------------------------------------------
export interface Guardian {
  _id: string;
  tenantId: TenantId;
  userId?: string;
  firstName: string;
  lastName: string;
  relationship: "father" | "mother" | "guardian" | "other";
  phone?: string;
  email?: string;
  studentIds: string[];
  createdAt: number;
  updatedAt: number;
}

// ----------------------------------------------------------
// Academics
// ----------------------------------------------------------
export interface AttendanceRecord {
  _id: string;
  tenantId: TenantId;
  classId: string;
  studentId: string;
  date: string;         // ISO date "YYYY-MM-DD"
  status: "present" | "absent" | "late" | "excused";
  note?: string;
  recordedBy: string;
  createdAt: number;
}

export interface GradeEntry {
  _id: string;
  tenantId: TenantId;
  studentId: string;
  classId: string;
  subjectId: string;
  term: string;
  academicYear: string;
  score: number;
  maxScore: number;
  grade?: string;
  comment?: string;
  gradedBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface Assignment {
  _id: string;
  tenantId: TenantId;
  classId: string;
  subjectId?: string;
  teacherId: string;
  title: string;
  description?: string;
  dueDate: string;
  maxScore?: number;
  status: "draft" | "published" | "closed";
  createdAt: number;
  updatedAt: number;
}

// ----------------------------------------------------------
// Utility Types
// ----------------------------------------------------------
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
