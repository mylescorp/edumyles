// ============================================================
// EduMyles — Shared Zod Validators
// ============================================================
import { z } from "zod";

// ----------------------------------------------------------
// Primitives
// ----------------------------------------------------------
export const tenantIdSchema = z.string().min(1, "Tenant ID is required");

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number. Use international format e.g. +254712345678");

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(63, "Slug must be at most 63 characters")
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
  .refine((s) => !s.startsWith("-") && !s.endsWith("-"), "Slug cannot start or end with a hyphen");

// ----------------------------------------------------------
// Tenant
// ----------------------------------------------------------
export const createTenantSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters").max(100),
  slug: slugSchema,
  country: z.enum(["KE", "UG", "TZ", "RW", "ET", "GH"]),
  currency: z.enum(["KES", "UGX", "TZS", "RWF", "ETB", "GHS"]),
  tier: z.enum(["starter", "standard", "pro", "enterprise"]).default("starter"),
  adminEmail: z.string().email("Invalid email address"),
  adminFirstName: z.string().min(1),
  adminLastName: z.string().min(1),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

// ----------------------------------------------------------
// User
// ----------------------------------------------------------
export const createUserSchema = z.object({
  tenantId: tenantIdSchema,
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: phoneSchema.optional(),
  role: z.enum([
    "school_admin", "principal", "teacher", "student",
    "parent", "finance_officer", "librarian", "transport_officer",
    "hr_officer", "receptionist",
  ]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ----------------------------------------------------------
// Student
// ----------------------------------------------------------
export const createStudentSchema = z.object({
  tenantId: tenantIdSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: dateSchema,
  gender: z.enum(["male", "female", "other"]),
  classId: z.string().min(1, "Class is required"),
  streamId: z.string().optional(),
  admissionNumber: z.string().min(1, "Admission number is required").max(20),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

// ----------------------------------------------------------
// Payment
// ----------------------------------------------------------
export const createPaymentSchema = z.object({
  tenantId: tenantIdSchema,
  studentId: z.string().min(1),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be a 3-letter code"),
  method: z.enum(["mpesa", "airtel_money", "stripe", "bank_transfer", "cash", "cheque"]),
  description: z.string().min(1).max(200),
  phone: phoneSchema.optional(), // required for mobile money
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ----------------------------------------------------------
// Pagination
// ----------------------------------------------------------
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
