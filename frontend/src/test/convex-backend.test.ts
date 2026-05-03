/**
 * Convex Backend Logic Tests
 *
 * Tests the pure business-logic functions from the Convex helper layer:
 *   - convex/helpers/authorize.ts  — requirePermission, requireRole, getPermissions
 *   - convex/helpers/moduleGuard.ts — requireModule, activateModule, deactivateModule
 *
 * authorize.ts is completely pure (no DB access).
 * moduleGuard.ts uses ctx.db; the Convex context is mocked via createTestCtx().
 *
 * NOTE: These modules import from Convex-generated files. The vitest.config.ts
 * adds a resolve alias mapping `/_generated\/server$/` to the frontend's copy
 * so these imports resolve correctly in the test environment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestCtx } from './convex/test-utils';

// ─── Import real backend modules ─────────────────────────────────────────────
import {
  requirePermission,
  requireRole,
  getPermissions,
} from '../../../convex/helpers/authorize';

import {
  requireModule,
  activateModule,
  deactivateModule,
  getInstalledModule,
} from '../../../convex/helpers/moduleGuard';

// ═════════════════════════════════════════════════════════════════════════════
// convex/helpers/authorize.ts — pure RBAC functions
// ═════════════════════════════════════════════════════════════════════════════

describe('requirePermission() — convex/helpers/authorize.ts', () => {
  const makeCtx = (role: string) => ({ tenantId: 'TENANT-1', userId: 'u1', role, email: '', permissions: [] as string[] });

  it('does not throw when the role has the permission', () => {
    expect(() => requirePermission(makeCtx('teacher'), 'grades:write')).not.toThrow();
    expect(() => requirePermission(makeCtx('bursar'), 'finance:approve')).not.toThrow();
    expect(() => requirePermission(makeCtx('master_admin'), 'platform:admin')).not.toThrow();
  });

  it('throws FORBIDDEN when the role lacks the permission', () => {
    expect(() => requirePermission(makeCtx('student'), 'grades:write')).toThrow(
      /FORBIDDEN.*grades:write/
    );
    expect(() => requirePermission(makeCtx('teacher'), 'students:delete')).toThrow('FORBIDDEN');
    expect(() => requirePermission(makeCtx('parent'), 'finance:write')).toThrow('FORBIDDEN');
  });

  it('throws FORBIDDEN for an unknown role', () => {
    expect(() => requirePermission(makeCtx('ghost_role'), 'grades:read')).toThrow('FORBIDDEN');
  });

  it('error message includes both role and permission name', () => {
    expect(() => requirePermission(makeCtx('student'), 'students:delete')).toThrow(
      /student.*students:delete/
    );
  });
});

describe('requireRole() — convex/helpers/authorize.ts', () => {
  const makeCtx = (role: string) => ({ tenantId: 'TENANT-1', userId: 'u1', role, email: '', permissions: [] as string[] });

  it('does not throw when ctx.role matches the required role', () => {
    expect(() => requireRole(makeCtx('teacher'), 'teacher')).not.toThrow();
    expect(() => requireRole(makeCtx('master_admin'), 'master_admin')).not.toThrow();
  });

  it('does not throw when ctx.role is one of multiple allowed roles', () => {
    expect(() =>
      requireRole(makeCtx('teacher'), 'school_admin', 'teacher', 'principal')
    ).not.toThrow();
  });

  it('throws FORBIDDEN when the role does not match', () => {
    expect(() => requireRole(makeCtx('student'), 'teacher')).toThrow('FORBIDDEN');
  });

  it('throws FORBIDDEN listing all required roles in the message', () => {
    expect(() =>
      requireRole(makeCtx('student'), 'school_admin', 'principal')
    ).toThrow(/school_admin.*principal/);
  });

  it('throws FORBIDDEN for an unknown role', () => {
    expect(() => requireRole(makeCtx('ghost'), 'teacher')).toThrow('FORBIDDEN');
  });
});

describe('getPermissions() — convex/helpers/authorize.ts', () => {
  it('returns a non-empty array for every defined role', () => {
    const roles = [
      'master_admin', 'super_admin', 'school_admin', 'principal', 'teacher',
      'parent', 'student', 'bursar', 'hr_manager', 'librarian',
      'transport_manager', 'board_member', 'alumni', 'partner',
    ] as const;
    for (const role of roles) {
      const perms = getPermissions(role);
      expect(Array.isArray(perms)).toBe(true);
      expect(perms.length).toBeGreaterThan(0);
    }
  });

  it('returns an empty array for an unknown role', () => {
    expect(getPermissions('unknown_role' as any)).toEqual([]);
  });

  it('master_admin includes platform:admin', () => {
    expect(getPermissions('master_admin')).toContain('platform:admin');
  });

  it('student does not include grades:write', () => {
    expect(getPermissions('student')).not.toContain('grades:write');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// convex/helpers/moduleGuard.ts — module access control
// ═════════════════════════════════════════════════════════════════════════════

// Helper: build a mock installed-module record
function mockModule(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'installed-id-1' as any,
    tenantId: 'TENANT-1',
    moduleId: 'finance',
    status: 'active',
    config: {},
    ...overrides,
  };
}

// Helper: configure ctx.db.query to return successive values for consecutive calls
function setupDbQuerySequence(ctx: ReturnType<typeof createTestCtx>, values: Array<unknown>) {
  values.forEach((value) => {
    (ctx.db.query as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      withIndex: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(value),
        unique: vi.fn().mockResolvedValue(value),
      }),
    });
  });
}

describe('requireModule() — convex/helpers/moduleGuard.ts', () => {
  let ctx: ReturnType<typeof createTestCtx>;

  beforeEach(() => {
    ctx = createTestCtx();
  });

  it('immediately returns for core modules without any DB access', async () => {
    // 'sis', 'communications', 'users' are core modules
    await expect(requireModule(ctx, 'TENANT-1', 'sis')).resolves.toBeUndefined();
    await expect(requireModule(ctx, 'TENANT-1', 'communications')).resolves.toBeUndefined();
    expect(ctx.db.query).not.toHaveBeenCalled();
  });

  it('throws MODULE_NOT_INSTALLED when the module record is absent', async () => {
    setupDbQuerySequence(ctx, [null]);

    await expect(requireModule(ctx, 'TENANT-1', 'finance')).rejects.toThrow(
      'MODULE_NOT_INSTALLED'
    );
  });

  it('throws MODULE_INACTIVE when the module is installed but inactive', async () => {
    setupDbQuerySequence(ctx, [mockModule({ status: 'disabled' })]);

    await expect(requireModule(ctx, 'TENANT-1', 'finance')).rejects.toThrow(
      'MODULE_INACTIVE'
    );
  });

  it('passes when module is active and its tier allows it', async () => {
    // Query sequence: installedModule → tenant → organization (null) → dependency sis
    setupDbQuerySequence(ctx, [
      mockModule({ moduleId: 'finance', status: 'active' }),
      { tenantId: 'TENANT-1', plan: 'standard' },             // tenants
      null,                                                    // organizations (none)
      mockModule({ moduleId: 'sis', status: 'active' }),      // dependency
    ]);

    await expect(requireModule(ctx, 'TENANT-1', 'finance')).resolves.toBeUndefined();
  });

  it('throws MODULE_NOT_AVAILABLE_FOR_TIER when tier does not include the module', async () => {
    // 'hr' is available for pro/enterprise but NOT free/starter/standard
    setupDbQuerySequence(ctx, [
      mockModule({ moduleId: 'hr', status: 'active' }),
      { tenantId: 'TENANT-1', plan: 'starter' },
      null,
    ]);

    await expect(requireModule(ctx, 'TENANT-1', 'hr')).rejects.toThrow(
      "MODULE_NOT_AVAILABLE_FOR_TIER: Module 'mod_hr' is not available for tier 'starter'"
    );
  });

  it('throws MODULE_DEPENDENCIES_NOT_MET when a required dep is missing', async () => {
    // 'timetable' depends on 'sis' and 'academics'
    setupDbQuerySequence(ctx, [
      mockModule({ moduleId: 'timetable', status: 'active' }),
      { tenantId: 'TENANT-1', plan: 'standard' }, // timetable IS in standard tier
      null,                                         // no org override
      mockModule({ moduleId: 'sis', status: 'active' }),
      null,                                         // dependency 'academics' not installed
    ]);

    await expect(requireModule(ctx, 'TENANT-1', 'timetable')).rejects.toThrow(
      "MODULE_DEPENDENCIES_NOT_MET: Module 'mod_timetable' requires 'mod_academics' which is not installed"
    );
  });

  it('throws MODULE_DEPENDENCIES_NOT_MET when a dep is installed but inactive', async () => {
    setupDbQuerySequence(ctx, [
      mockModule({ moduleId: 'timetable', status: 'active' }),
      { tenantId: 'TENANT-1', plan: 'standard' },
      null,
      mockModule({ moduleId: 'sis', status: 'active' }),
      mockModule({ moduleId: 'academics', status: 'inactive' }), // dep is inactive
    ]);

    await expect(requireModule(ctx, 'TENANT-1', 'timetable')).rejects.toThrow(
      "MODULE_DEPENDENCIES_NOT_MET: Module 'mod_timetable' requires 'mod_academics' which is not active"
    );
  });
});

describe('deactivateModule() — convex/helpers/moduleGuard.ts', () => {
  let ctx: ReturnType<typeof createTestCtx>;

  beforeEach(() => {
    ctx = createTestCtx();
    (ctx.db.patch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('throws MODULE_NOT_INSTALLED when the module is not found', async () => {
    setupDbQuerySequence(ctx, [null]);

    await expect(deactivateModule(ctx, 'TENANT-1', 'finance')).rejects.toThrow(
      "MODULE_NOT_INSTALLED: Module 'finance' is not installed"
    );
  });

  it('returns true immediately if the module is already disabled', async () => {
    setupDbQuerySequence(ctx, [mockModule({ status: 'disabled' })]);

    const result = await deactivateModule(ctx, 'TENANT-1', 'finance');
    expect(result).toBe(true);
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it('throws CANNOT_DEACTIVATE when another active module depends on this one', async () => {
    // Deactivating 'sis' — the first active dependent currently encountered is academics
    setupDbQuerySequence(ctx, [
      mockModule({ moduleId: 'sis', status: 'active' }),  // self
      mockModule({ moduleId: 'academics', status: 'active' }),
    ]);

    await expect(deactivateModule(ctx, 'TENANT-1', 'sis')).rejects.toThrow(
      "CANNOT_DEACTIVATE: Module 'sis' is required by active module 'academics'"
    );
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it('deactivates the module and patches status to disabled', async () => {
    // finance has one dependent (ewallet), so we need to show it is not installed
    setupDbQuerySequence(ctx, [
      mockModule({ moduleId: 'finance', status: 'active' }),
      null,
    ]);

    const result = await deactivateModule(ctx, 'TENANT-1', 'finance');
    expect(result).toBe(true);
    expect(ctx.db.patch).toHaveBeenCalledWith('installed-id-1', { status: 'disabled' });
  });
});

describe('activateModule() — convex/helpers/moduleGuard.ts', () => {
  let ctx: ReturnType<typeof createTestCtx>;

  beforeEach(() => {
    ctx = createTestCtx();
    (ctx.db.patch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('throws MODULE_NOT_INSTALLED when module is not found', async () => {
    setupDbQuerySequence(ctx, [null]);

    await expect(activateModule(ctx, 'TENANT-1', 'finance')).rejects.toThrow(
      "MODULE_NOT_INSTALLED: Module 'finance' is not installed"
    );
  });

  it('returns true immediately if the module is already active', async () => {
    setupDbQuerySequence(ctx, [mockModule({ status: 'active' })]);

    const result = await activateModule(ctx, 'TENANT-1', 'finance');
    expect(result).toBe(true);
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });
});
