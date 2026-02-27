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
  slug: string; // e.g. "greenview-academy" → greenview-academy.edumyles.com
  name: string;
  country: "KE" | "UG" | "TZ" | "RW" | "ET" | "GH" | string;
  currency: "KES" | "UGX" | "TZS" | "RWF" | "ETB" | "GHS" | string;
  tier: TenantTier;
  status: TenantStatus;
  enabledModules: Module[];
  createdAt: number;
  updatedAt: number;
}

// ----------------------------------------------------------
// Users & Roles
// ----------------------------------------------------------
export type UserRole =
  | "platform_admin"  // Mylesoft staff — cross-tenant access
  | "school_admin"    // Full access within their tenant
  | "principal"
  | "teacher"
  | "student"
  | "parent"
  | "finance_officer"
  | "librarian"
  | "transport_officer"
  | "hr_officer"
  | "receptionist";

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
  | "sis"           // Student Information System
  | "admissions"    // Admissions & Enrollment
  | "finance"       // Fee & Finance Management
  | "timetable"     // Timetable & Scheduling
  | "academics"     // Academics & Gradebook
  | "hr"            // HR & Payroll
  | "library"       // Library Management
  | "transport"     // Transport Management
  | "communications"// Messaging & Notifications
  | "ewallet"       // eWallet
  | "ecommerce";    // School Shop / eCommerce

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
