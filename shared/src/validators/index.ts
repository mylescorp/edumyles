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
  subdomain: slugSchema,
  country: z.enum(["KE", "UG", "TZ", "RW", "ET", "GH"]),
  currency: z.enum(["KES", "UGX", "TZS", "RWF", "ETB", "GHS"]),
  plan: z.enum(["starter", "standard", "pro", "enterprise"]).default("starter"),
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
  role: z
    .enum([
      "school_admin",
      "principal",
      "teacher",
      "student",
      "parent",
      "bursar",
      "librarian",
      "transport_manager",
      "hr_manager",
      "receptionist",
      "alumni",
      "partner",
      "board_member",
      "super_admin",
      "platform_admin",
      "master_admin",
    ])
    .transform((role) => (role === "platform_admin" ? "super_admin" : role)),
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

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(false),
  parentNotifications: z.boolean().default(true),
});

export const createInvoiceSchema = z.object({
  tenantId: tenantIdSchema,
  studentId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3),
  dueDate: dateSchema.optional(),
  description: z.string().min(1).max(200),
});

export const createFeeStructureSchema = z.object({
  name: z.string().min(2).max(100),
  amount: z.number().positive("Amount must be positive"),
  academicYear: z.string().min(2).max(20),
  grade: z.string().min(1).max(50),
  frequency: z.enum(["one_time", "monthly", "termly", "yearly"]),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;

export const generateInvoiceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  dueDate: dateSchema,
  issuedAt: z.string().min(1, "Issue date is required"),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;

export const createStaffSchema = z.object({
  tenantId: tenantIdSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: phoneSchema.optional(),
  role: z.enum([
    "school_admin",
    "principal",
    "teacher",
    "bursar",
    "librarian",
    "transport_manager",
    "hr_manager",
    "receptionist",
  ]),
  employeeId: z.string().min(2).max(40),
  department: z.string().max(80).optional(),
  qualification: z.string().max(120).optional(),
  joinDate: dateSchema,
  status: z.enum(["active", "inactive", "on_leave", "terminated"]),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const createClassSchema = z.object({
  name: z.string().min(2).max(80),
  level: z.string().max(50).optional(),
  stream: z.string().max(50).optional(),
  teacherId: z.string().optional(),
  capacity: z.number().int().positive().max(500).optional(),
  academicYear: z.string().max(20).optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

export const createStudentImportSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  admissionNumber: z.string().min(1).max(30),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: dateSchema,
  classId: z.string().optional(),
});

export const createStudentWithGuardianSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: dateSchema,
  gender: z.enum(["male", "female", "other"]),
  classId: z.string().optional(),
  admissionNo: z.string().min(1).max(30).optional(),
  guardianName: z.string().max(100).optional(),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianPhone: phoneSchema.optional().or(z.literal("")),
  guardianRelationship: z.enum(["father", "mother", "guardian", "other"]).optional(),
  photoUrl: z.string().url().optional(),
});

export type CreateStudentWithGuardianInput = z.infer<typeof createStudentWithGuardianSchema>;

export const createBookSchema = z.object({
  isbn: z.string().max(30).optional(),
  title: z.string().min(2).max(160),
  author: z.string().min(2).max(120),
  category: z.string().min(2).max(80),
  quantity: z.number().int().positive().max(5000),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

export const createTransportRouteSchema = z.object({
  name: z.string().min(2).max(120),
  stops: z.array(z.string().min(1).max(120)).min(1, "At least one stop is required"),
});

export type CreateTransportRouteInput = z.infer<typeof createTransportRouteSchema>;

export const assignStudentToRouteSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  routeId: z.string().min(1, "Route is required"),
  stopIndex: z.number().int().min(0),
});

export type AssignStudentToRouteInput = z.infer<typeof assignStudentToRouteSchema>;

export const createProductSchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  category: z.string().max(80).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const createTimetableSlotSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  room: z.string().max(80).optional(),
  academicYear: z.string().max(20).optional(),
}).refine((value) => value.endTime > value.startTime, {
  message: "End time must be later than start time",
  path: ["endTime"],
});

export type CreateTimetableSlotInput = z.infer<typeof createTimetableSlotSchema>;

export const createSchoolEventSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(1000).optional(),
  eventType: z.enum(["academic", "sports", "cultural", "holiday", "meeting", "other"]),
  startDate: dateSchema,
  endDate: dateSchema.optional().or(z.literal("")),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format").optional().or(z.literal("")),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format").optional().or(z.literal("")),
  location: z.string().max(160).optional(),
}).refine((value) => !value.endDate || value.endDate >= value.startDate, {
  message: "End date cannot be earlier than start date",
  path: ["endDate"],
}).refine((value) => {
  if (!value.startTime || !value.endTime) return true;
  return value.endTime > value.startTime;
}, {
  message: "End time must be later than start time",
  path: ["endTime"],
});

export type CreateSchoolEventInput = z.infer<typeof createSchoolEventSchema>;

export const updateNotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  parentNotifications: z.boolean(),
});

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
