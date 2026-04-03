import { describe, expect, it } from "vitest";
import {
  assignStudentToRouteSchema,
  createStaffSchema,
  createStudentWithGuardianSchema,
  createTimetableSlotSchema,
  updateOrderStatusSchema,
} from "../../../shared/src/validators";

describe("admin CRUD validator contracts", () => {
  it("accepts a valid student-with-guardian payload", () => {
    const parsed = createStudentWithGuardianSchema.parse({
      firstName: "Amina",
      lastName: "Otieno",
      dateOfBirth: "2014-05-02",
      gender: "female",
      classId: "class-1",
      admissionNo: "ADM-001",
      guardianName: "Jane Otieno",
      guardianEmail: "jane@example.com",
      guardianPhone: "+254712345678",
      guardianRelationship: "mother",
    });

    expect(parsed.admissionNo).toBe("ADM-001");
  });

  it("requires canonical staff fields for create flow", () => {
    const parsed = createStaffSchema.parse({
      tenantId: "TENANT-school-1",
      firstName: "John",
      lastName: "Kamau",
      email: "john@example.com",
      role: "teacher",
      employeeId: "EMP-100",
      joinDate: "2026-01-10",
      status: "active",
    });

    expect(parsed.employeeId).toBe("EMP-100");
  });

  it("rejects timetable slots whose end time is before the start time", () => {
    const result = createTimetableSlotSchema.safeParse({
      classId: "class-1",
      subjectId: "subject-1",
      teacherId: "teacher-1",
      dayOfWeek: 2,
      startTime: "14:00",
      endTime: "13:30",
    });

    expect(result.success).toBe(false);
  });

  it("requires both student and route for transport assignment", () => {
    const result = assignStudentToRouteSchema.safeParse({
      studentId: "",
      routeId: "route-1",
      stopIndex: 0,
    });

    expect(result.success).toBe(false);
  });

  it("limits ecommerce order updates to supported fulfillment statuses", () => {
    const parsed = updateOrderStatusSchema.parse({
      orderId: "order-1",
      status: "shipped",
    });

    expect(parsed.status).toBe("shipped");
  });
});
