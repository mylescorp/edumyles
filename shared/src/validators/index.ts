// ============================================================
// EduMyles — Shared Zod Validators
// ============================================================
import { z } from "zod";
import { SCHOOL_CURRICULUM_CODES } from "../constants";

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
  curriculumMode: z.enum(["single", "multi"]).optional(),
  primaryCurriculumCode: z
    .enum([
      SCHOOL_CURRICULUM_CODES.CBC,
      SCHOOL_CURRICULUM_CODES.ACE,
      SCHOOL_CURRICULUM_CODES.IGCSE,
      SCHOOL_CURRICULUM_CODES.KENYA_844,
    ])
    .optional(),
  activeCurriculumCodes: z
    .array(
      z.enum([
        SCHOOL_CURRICULUM_CODES.CBC,
        SCHOOL_CURRICULUM_CODES.ACE,
        SCHOOL_CURRICULUM_CODES.IGCSE,
        SCHOOL_CURRICULUM_CODES.KENYA_844,
      ])
    )
    .optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const tenantCurriculumSelectionSchema = z
  .object({
    curriculumMode: z.enum(["single", "multi"]),
    primaryCurriculumCode: z.enum([
      SCHOOL_CURRICULUM_CODES.CBC,
      SCHOOL_CURRICULUM_CODES.ACE,
      SCHOOL_CURRICULUM_CODES.IGCSE,
      SCHOOL_CURRICULUM_CODES.KENYA_844,
    ]),
    activeCurriculumCodes: z
      .array(
        z.enum([
          SCHOOL_CURRICULUM_CODES.CBC,
          SCHOOL_CURRICULUM_CODES.ACE,
          SCHOOL_CURRICULUM_CODES.IGCSE,
          SCHOOL_CURRICULUM_CODES.KENYA_844,
        ])
      )
      .min(1, "At least one curriculum is required"),
  })
  .superRefine((value, ctx) => {
    const uniqueCodes = new Set(value.activeCurriculumCodes);

    if (uniqueCodes.size !== value.activeCurriculumCodes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activeCurriculumCodes"],
        message: "Curriculum codes must be unique",
      });
    }

    if (!uniqueCodes.has(value.primaryCurriculumCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primaryCurriculumCode"],
        message: "Primary curriculum must be included in the active curriculum list",
      });
    }

    if (value.curriculumMode === "single" && uniqueCodes.size !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activeCurriculumCodes"],
        message: "Single-curriculum mode must contain exactly one active curriculum",
      });
    }

    if (value.curriculumMode === "multi" && uniqueCodes.size < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["activeCurriculumCodes"],
        message: "Multi-curriculum mode must contain at least two active curricula",
      });
    }
  });

export type TenantCurriculumSelectionInput = z.infer<typeof tenantCurriculumSelectionSchema>;

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
      "publisher",
      "reseller",
      "affiliate",
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

export const requestWalletTopUpSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(10, "Minimum top-up is 10"),
  method: z.enum(["mpesa", "card", "bank_transfer"]),
  phone: phoneSchema.optional().or(z.literal("")),
  note: z.string().max(200).optional(),
}).superRefine((value, ctx) => {
  if (value.method === "mpesa" && !value.phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phone"],
      message: "Phone number is required for M-Pesa top-up requests",
    });
  }
});

export type RequestWalletTopUpInput = z.infer<typeof requestWalletTopUpSchema>;

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
// Announcements
// ----------------------------------------------------------
export const createAnnouncementSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(160),
  body: z.string().min(1, "Body is required").max(5000),
  audience: z.enum(["all", "students", "parents", "guardians", "teachers", "staff"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  publishNow: z.boolean().default(true),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = createAnnouncementSchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

// ----------------------------------------------------------
// Student updates
// ----------------------------------------------------------
export const updateStudentSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  dateOfBirth: dateSchema.optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  classId: z.string().optional(),
  status: z.enum(["active", "graduated", "transferred", "suspended", "expelled"]).optional(),
  phone: phoneSchema.optional().or(z.literal("")),
  address: z.string().max(300).optional(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// ----------------------------------------------------------
// Staff updates
// ----------------------------------------------------------
export const updateStaffSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: phoneSchema.optional().or(z.literal("")),
  role: z.string().optional(),
  department: z.string().max(100).optional(),
  status: z.enum(["active", "inactive", "on_leave", "terminated"]).optional(),
  joinDate: dateSchema.optional(),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ----------------------------------------------------------
// Subjects
// ----------------------------------------------------------
export const createSubjectSchema = z.object({
  name: z.string().min(2, "Subject name is required").max(120),
  code: z.string().max(20).optional(),
  department: z.string().max(80).optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

// ----------------------------------------------------------
// Attendance
// ----------------------------------------------------------
export const markAttendanceSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  date: dateSchema,
  records: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(["present", "absent", "late", "excused"]),
    note: z.string().max(300).optional(),
  })).min(1, "At least one attendance record is required"),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

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

// ----------------------------------------------------------
// Admissions
// ----------------------------------------------------------
export const createAdmissionApplicationSchema = z.object({
  tenantId: tenantIdSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: dateSchema,
  gender: z.enum(["male", "female", "other"]),
  applyingForGrade: z.string().min(1).max(50),
  academicYear: z.string().min(4).max(20),
  guardianName: z.string().min(1).max(100),
  guardianEmail: z.string().email(),
  guardianPhone: phoneSchema,
  guardianRelationship: z.enum(["father", "mother", "guardian", "other"]),
  previousSchool: z.string().max(160).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateAdmissionApplicationInput = z.infer<typeof createAdmissionApplicationSchema>;

export const updateAdmissionStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(["submitted", "under_review", "accepted", "rejected", "waitlisted", "withdrawn"]),
  reviewNotes: z.string().max(1000).optional(),
  admissionNumber: z.string().max(30).optional(),
});

export type UpdateAdmissionStatusInput = z.infer<typeof updateAdmissionStatusSchema>;

// ----------------------------------------------------------
// Payroll
// ----------------------------------------------------------
export const createPayrollRunSchema = z.object({
  tenantId: tenantIdSchema,
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be in YYYY-MM format"),
  paymentDate: dateSchema,
  notes: z.string().max(500).optional(),
});

export type CreatePayrollRunInput = z.infer<typeof createPayrollRunSchema>;

export const createPayrollEntrySchema = z.object({
  payrollRunId: z.string().min(1),
  staffId: z.string().min(1),
  basicSalary: z.number().nonnegative(),
  allowances: z.number().nonnegative().default(0),
  deductions: z.number().nonnegative().default(0),
  netPay: z.number().nonnegative(),
  currency: z.string().length(3),
  notes: z.string().max(300).optional(),
});

export type CreatePayrollEntryInput = z.infer<typeof createPayrollEntrySchema>;

// ----------------------------------------------------------
// Staff Contracts
// ----------------------------------------------------------
export const createStaffContractSchema = z.object({
  tenantId: tenantIdSchema,
  staffId: z.string().min(1),
  contractType: z.enum(["permanent", "contract", "part_time", "intern", "volunteer"]),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
  basicSalary: z.number().nonnegative(),
  currency: z.string().length(3),
  allowances: z.record(z.string(), z.number().nonnegative()).optional(),
  terms: z.string().max(2000).optional(),
  signedByStaff: z.boolean().default(false),
  signedByAdmin: z.boolean().default(false),
}).refine((value) => !value.endDate || value.endDate > value.startDate, {
  message: "Contract end date must be after start date",
  path: ["endDate"],
});

export type CreateStaffContractInput = z.infer<typeof createStaffContractSchema>;

// ----------------------------------------------------------
// Library Borrows
// ----------------------------------------------------------
export const createLibraryBorrowSchema = z.object({
  tenantId: tenantIdSchema,
  bookId: z.string().min(1),
  borrowerId: z.string().min(1),
  borrowerType: z.enum(["student", "staff"]),
  borrowedAt: dateSchema,
  dueDate: dateSchema,
}).refine((value) => value.dueDate > value.borrowedAt, {
  message: "Due date must be after borrow date",
  path: ["dueDate"],
});

export type CreateLibraryBorrowInput = z.infer<typeof createLibraryBorrowSchema>;

export const returnLibraryBookSchema = z.object({
  borrowId: z.string().min(1),
  returnedAt: dateSchema,
  condition: z.enum(["good", "damaged", "lost"]).default("good"),
  fineAmount: z.number().nonnegative().default(0),
  fineReason: z.string().max(200).optional(),
});

export type ReturnLibraryBookInput = z.infer<typeof returnLibraryBookSchema>;
