import { vi } from 'vitest';
import type { DataModel } from '../../../convex/_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../../../convex/_generated/server';

// Create a test context that mimics Convex environment
export function createTestCtx() {
  return {
    db: {
      query: vi.fn(),
      get: vi.fn(),
      insert: vi.fn(),
      patch: vi.fn(),
      replace: vi.fn(),
      delete: vi.fn(),
    },
    auth: {
      getUserId: vi.fn(),
      getTokenIdentifier: vi.fn(),
    },
    scheduler: {
      runAfter: vi.fn(),
      runAfterJob: vi.fn(),
      cancel: vi.fn(),
    },
    storage: {
      generateUploadUrl: vi.fn(),
      getUrl: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as QueryCtx & MutationCtx;
}

// Mock tenant context for testing
export function createMockTenantContext(tenantId: string, role: string) {
  return {
    tenantId,
    userId: 'test-user-id',
    role,
    permissions: getMockPermissions(role),
  };
}

function getMockPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    master_admin: [
      'platform:admin', 'users:manage', 'settings:write', 'settings:read',
      'students:read', 'students:write', 'students:delete',
      'finance:read', 'finance:write', 'finance:approve',
      'staff:read', 'staff:write',
      'grades:read', 'grades:write',
      'attendance:read', 'attendance:write',
      'payroll:read', 'payroll:write', 'payroll:approve',
      'library:read', 'library:write',
      'transport:read', 'transport:write',
      'reports:read'
    ],
    super_admin: [
      'platform:admin', 'users:manage', 'settings:write', 'settings:read', 'reports:read'
    ],
    school_admin: [
      'users:manage', 'settings:write', 'settings:read',
      'students:read', 'students:write',
      'staff:read', 'staff:write',
      'finance:read', 'reports:read',
      'attendance:read', 'grades:read'
    ],
    teacher: [
      'students:read', 'grades:read', 'grades:write',
      'attendance:read', 'attendance:write'
    ],
    parent: [
      'students:read', 'grades:read', 'attendance:read', 'finance:read'
    ],
    student: [
      'grades:read', 'attendance:read'
    ],
    alumni: [
      'grades:read', 'reports:read', 'attendance:read'
    ],
    partner: [
      'students:read', 'finance:read', 'reports:read', 'communications:read'
    ],
    principal: [
      'students:read', 'staff:read', 'grades:read', 'grades:write',
      'attendance:read', 'attendance:write', 'reports:read', 'settings:read', 'finance:read'
    ],
    bursar: [
      'finance:read', 'finance:write', 'finance:approve', 'reports:read'
    ],
    hr_manager: [
      'staff:read', 'staff:write', 'payroll:read', 'payroll:write', 'reports:read'
    ],
    librarian: [
      'library:read', 'library:write', 'students:read'
    ],
    transport_manager: [
      'transport:read', 'transport:write', 'students:read'
    ],
    board_member: [
      'reports:read', 'finance:read', 'students:read'
    ]
  };
  return permissions[role] || [];
}

// Test data factories
export function createMockTenant(overrides: Partial<DataModel['tenants']> = {}) {
  return {
    tenantId: 'test-tenant-id',
    name: 'Test School',
    subdomain: 'test-school',
    email: 'admin@testschool.com',
    phone: '+254700000000',
    plan: 'standard',
    status: 'active',
    county: 'Nairobi',
    country: 'Kenya',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createMockUser(overrides: Partial<DataModel['users']> = {}) {
  return {
    tenantId: 'test-tenant-id',
    eduMylesUserId: 'test-user-id',
    workosUserId: 'workos-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'school_admin',
    permissions: ['users:manage', 'settings:write'],
    organizationId: 'org-id' as string,
    isActive: true,
    createdAt: Date.now(),
    ...overrides,
  };
}

export function createMockStudent(overrides: Partial<DataModel['students']> = {}) {
  return {
    tenantId: 'test-tenant-id',
    studentId: 'student-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@school.com',
    classId: 'class-id',
    grade: 'Grade 10',
    status: 'active',
    enrollmentDate: Date.now(),
    guardianIds: ['guardian-id'],
    createdAt: Date.now(),
    ...overrides,
  };
}
