import { describe, expect, it } from "vitest";
import { filterAndSortUsers, getUserStatus } from "../../../convex/platform/users/utils";

const baseUsers = [
  {
    tenantId: "TENANT-b",
    role: "super_admin",
    email: "ops@edumyles.com",
    firstName: "Ops",
    lastName: "User",
    isActive: true,
    createdAt: 20,
  },
  {
    tenantId: "TENANT-a",
    role: "master_admin",
    email: "owner@edumyles.com",
    firstName: "Master",
    lastName: "Admin",
    isActive: false,
    createdAt: 30,
  },
  {
    tenantId: "TENANT-a",
    role: "teacher",
    email: "teacher@school.com",
    firstName: "School",
    lastName: "Teacher",
    isActive: true,
    createdAt: 10,
  },
];

describe("platform user filtering helpers", () => {
  it("derives status from isActive", () => {
    expect(getUserStatus({ isActive: true })).toBe("active");
    expect(getUserStatus({ isActive: false })).toBe("inactive");
  });

  it("filters by status, role, tenant, and search", () => {
    expect(filterAndSortUsers(baseUsers, { status: "inactive" })).toHaveLength(1);
    expect(filterAndSortUsers(baseUsers, { role: "master_admin" })).toHaveLength(1);
    expect(filterAndSortUsers(baseUsers, { tenantId: "TENANT-a" })).toHaveLength(2);
    expect(filterAndSortUsers(baseUsers, { search: "ops@edumyles" })).toHaveLength(1);
    expect(filterAndSortUsers(baseUsers, { search: "TENANT-a" })).toHaveLength(2);
  });

  it("sorts newest first and falls back to email for deterministic ordering", () => {
    const sorted = filterAndSortUsers(
      [
        ...baseUsers,
        {
          tenantId: "TENANT-z",
          role: "super_admin",
          email: "aaa@edumyles.com",
          isActive: true,
          createdAt: 30,
        },
      ],
      {}
    );

    expect(sorted[0].email).toBe("aaa@edumyles.com");
    expect(sorted[1].email).toBe("owner@edumyles.com");
    expect(sorted[2].email).toBe("ops@edumyles.com");
  });
});
