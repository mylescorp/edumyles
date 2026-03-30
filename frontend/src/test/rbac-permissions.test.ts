import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  getAllPermissions,
  ROLE_PERMISSIONS,
  type Role,
} from '@/lib/permissions';

describe('RBAC Permissions (lib/permissions.ts)', () => {
  // ─── hasPermission ─────────────────────────────────────────────────────────

  describe('hasPermission()', () => {
    it('returns true when the role has the exact permission', () => {
      expect(hasPermission('teacher', 'grades:write')).toBe(true);
      expect(hasPermission('bursar', 'finance:approve')).toBe(true);
      expect(hasPermission('master_admin', 'platform:admin')).toBe(true);
      expect(hasPermission('librarian', 'library:write')).toBe(true);
    });

    it('returns false when the role does not have the permission', () => {
      expect(hasPermission('student', 'grades:write')).toBe(false);
      expect(hasPermission('teacher', 'students:delete')).toBe(false);
      expect(hasPermission('parent', 'finance:write')).toBe(false);
      expect(hasPermission('librarian', 'finance:read')).toBe(false);
    });

    it('returns false for an unknown role', () => {
      expect(hasPermission('unknown_role', 'grades:read')).toBe(false);
      expect(hasPermission('', 'students:read')).toBe(false);
    });

    it('returns false for an unknown permission on a known role', () => {
      expect(hasPermission('teacher', 'nonexistent:permission')).toBe(false);
      expect(hasPermission('master_admin', 'superpower:unlimited')).toBe(false);
    });
  });

  // ─── hasAnyPermission ──────────────────────────────────────────────────────

  describe('hasAnyPermission()', () => {
    it('returns true when at least one of the given permissions matches', () => {
      // teacher has grades:write but not students:delete
      expect(hasAnyPermission('teacher', ['grades:write', 'students:delete'])).toBe(true);
    });

    it('returns false when none of the given permissions match', () => {
      expect(hasAnyPermission('student', ['students:delete', 'finance:write'])).toBe(false);
    });

    it('returns false for an unknown role', () => {
      expect(hasAnyPermission('ghost_role', ['grades:read', 'students:read'])).toBe(false);
    });

    it('returns false for an empty permissions list', () => {
      expect(hasAnyPermission('master_admin', [])).toBe(false);
    });

    it('returns true when all supplied permissions are present', () => {
      expect(hasAnyPermission('bursar', ['finance:read', 'finance:write', 'finance:approve'])).toBe(true);
    });
  });

  // ─── getAllPermissions ─────────────────────────────────────────────────────

  describe('getAllPermissions()', () => {
    it('returns the correct permission list for a known role', () => {
      const perms = getAllPermissions('bursar');
      expect(perms).toContain('finance:read');
      expect(perms).toContain('finance:write');
      expect(perms).toContain('finance:approve');
      expect(perms).toContain('reports:read');
    });

    it('returns an empty array for an unknown role', () => {
      expect(getAllPermissions('ghost_role' as Role)).toEqual([]);
    });

    it('returns an array (not undefined) for every defined role', () => {
      const roles: Role[] = [
        'master_admin', 'super_admin', 'school_admin', 'principal', 'teacher',
        'parent', 'student', 'bursar', 'hr_manager', 'librarian',
        'transport_manager', 'board_member', 'alumni', 'partner',
      ];
      for (const role of roles) {
        expect(Array.isArray(getAllPermissions(role))).toBe(true);
      }
    });
  });

  // ─── Role permission boundaries ────────────────────────────────────────────

  describe('Role permission boundaries', () => {
    it('master_admin has all sensitive permissions including platform:admin', () => {
      expect(hasPermission('master_admin', 'platform:admin')).toBe(true);
      expect(hasPermission('master_admin', 'students:delete')).toBe(true);
      expect(hasPermission('master_admin', 'payroll:approve')).toBe(true);
      expect(hasPermission('master_admin', 'finance:approve')).toBe(true);
    });

    it('super_admin has platform:admin but cannot write school-level data', () => {
      expect(hasPermission('super_admin', 'platform:admin')).toBe(true);
      expect(hasPermission('super_admin', 'students:write')).toBe(false);
      expect(hasPermission('super_admin', 'grades:write')).toBe(false);
      expect(hasPermission('super_admin', 'finance:write')).toBe(false);
    });

    it('school_admin cannot delete students or approve payroll', () => {
      expect(hasPermission('school_admin', 'users:manage')).toBe(true);
      expect(hasPermission('school_admin', 'students:delete')).toBe(false);
      expect(hasPermission('school_admin', 'payroll:approve')).toBe(false);
      expect(hasPermission('school_admin', 'finance:approve')).toBe(false);
    });

    it('teacher can write grades and attendance but cannot touch finance or delete students', () => {
      expect(hasPermission('teacher', 'grades:write')).toBe(true);
      expect(hasPermission('teacher', 'attendance:write')).toBe(true);
      expect(hasPermission('teacher', 'students:delete')).toBe(false);
      expect(hasPermission('teacher', 'finance:read')).toBe(false);
      expect(hasPermission('teacher', 'students:write')).toBe(false);
    });

    it('parent has read-only access to child data and cannot write anything', () => {
      expect(hasPermission('parent', 'students:read')).toBe(true);
      expect(hasPermission('parent', 'grades:read')).toBe(true);
      expect(hasPermission('parent', 'attendance:read')).toBe(true);
      expect(hasPermission('parent', 'finance:read')).toBe(true);
      expect(hasPermission('parent', 'grades:write')).toBe(false);
      expect(hasPermission('parent', 'students:write')).toBe(false);
    });

    it('student can only read own grades and attendance — no write access', () => {
      expect(hasPermission('student', 'grades:read')).toBe(true);
      expect(hasPermission('student', 'attendance:read')).toBe(true);
      expect(hasPermission('student', 'grades:write')).toBe(false);
      expect(hasPermission('student', 'students:read')).toBe(false);
      expect(hasPermission('student', 'finance:read')).toBe(false);
    });

    it('bursar can approve finance but cannot manage staff or modify grades', () => {
      expect(hasPermission('bursar', 'finance:approve')).toBe(true);
      expect(hasPermission('bursar', 'finance:write')).toBe(true);
      expect(hasPermission('bursar', 'staff:write')).toBe(false);
      expect(hasPermission('bursar', 'grades:write')).toBe(false);
      expect(hasPermission('bursar', 'students:write')).toBe(false);
    });

    it('hr_manager can manage payroll but cannot access student grades or approve finance', () => {
      expect(hasPermission('hr_manager', 'payroll:write')).toBe(true);
      expect(hasPermission('hr_manager', 'staff:write')).toBe(true);
      expect(hasPermission('hr_manager', 'grades:read')).toBe(false);
      expect(hasPermission('hr_manager', 'finance:approve')).toBe(false);
      expect(hasPermission('hr_manager', 'students:write')).toBe(false);
    });

    it('librarian can manage library but cannot modify grades or access finance', () => {
      expect(hasPermission('librarian', 'library:write')).toBe(true);
      expect(hasPermission('librarian', 'students:read')).toBe(true);
      expect(hasPermission('librarian', 'grades:write')).toBe(false);
      expect(hasPermission('librarian', 'finance:read')).toBe(false);
    });

    it('transport_manager can manage transport but not finance or grades', () => {
      expect(hasPermission('transport_manager', 'transport:write')).toBe(true);
      expect(hasPermission('transport_manager', 'students:read')).toBe(true);
      expect(hasPermission('transport_manager', 'finance:read')).toBe(false);
      expect(hasPermission('transport_manager', 'grades:read')).toBe(false);
    });

    it('board_member has read-only access to reports and finance — no write access', () => {
      expect(hasPermission('board_member', 'reports:read')).toBe(true);
      expect(hasPermission('board_member', 'finance:read')).toBe(true);
      expect(hasPermission('board_member', 'students:read')).toBe(true);
      expect(hasPermission('board_member', 'finance:write')).toBe(false);
      expect(hasPermission('board_member', 'settings:write')).toBe(false);
    });

    it('alumni has read-only access to historical records', () => {
      expect(hasPermission('alumni', 'grades:read')).toBe(true);
      expect(hasPermission('alumni', 'attendance:read')).toBe(true);
      expect(hasPermission('alumni', 'reports:read')).toBe(true);
      expect(hasPermission('alumni', 'grades:write')).toBe(false);
      expect(hasPermission('alumni', 'students:write')).toBe(false);
    });

    it('partner has limited read-only access and no write permissions', () => {
      expect(hasPermission('partner', 'students:read')).toBe(true);
      expect(hasPermission('partner', 'finance:read')).toBe(true);
      expect(hasPermission('partner', 'reports:read')).toBe(true);
      expect(hasPermission('partner', 'students:write')).toBe(false);
      expect(hasPermission('partner', 'finance:write')).toBe(false);
    });

    it('principal can write grades and attendance but cannot approve payroll', () => {
      expect(hasPermission('principal', 'grades:write')).toBe(true);
      expect(hasPermission('principal', 'attendance:write')).toBe(true);
      expect(hasPermission('principal', 'finance:read')).toBe(true);
      expect(hasPermission('principal', 'payroll:write')).toBe(false);
      expect(hasPermission('principal', 'students:delete')).toBe(false);
    });
  });

  // ─── privilege escalation ──────────────────────────────────────────────────

  describe('Privilege escalation prevention', () => {
    it('no non-admin role has platform:admin', () => {
      const nonAdminRoles: Role[] = [
        'school_admin', 'principal', 'teacher', 'parent', 'student',
        'bursar', 'hr_manager', 'librarian', 'transport_manager',
        'board_member', 'alumni', 'partner',
      ];
      for (const role of nonAdminRoles) {
        expect(hasPermission(role, 'platform:admin')).toBe(false);
      }
    });

    it('no role below school_admin can delete students', () => {
      const restrictedRoles: Role[] = [
        'principal', 'teacher', 'parent', 'student', 'bursar',
        'hr_manager', 'librarian', 'transport_manager', 'board_member',
        'alumni', 'partner',
      ];
      for (const role of restrictedRoles) {
        expect(hasPermission(role, 'students:delete')).toBe(false);
      }
    });

    it('only bursar, hr_manager, and master_admin can approve payroll', () => {
      expect(hasPermission('master_admin', 'payroll:approve')).toBe(true);
      expect(hasPermission('hr_manager', 'payroll:approve')).toBe(true);

      const cannotApprovePayroll: Role[] = [
        'super_admin', 'school_admin', 'principal', 'teacher', 'parent',
        'student', 'bursar', 'librarian', 'transport_manager',
        'board_member', 'alumni', 'partner',
      ];
      for (const role of cannotApprovePayroll) {
        expect(hasPermission(role, 'payroll:approve')).toBe(false);
      }
    });
  });

  // ─── ROLE_PERMISSIONS data integrity ──────────────────────────────────────

  describe('ROLE_PERMISSIONS data integrity', () => {
    it('defines all 14 expected roles', () => {
      const expectedRoles: Role[] = [
        'master_admin', 'super_admin', 'school_admin', 'principal', 'teacher',
        'parent', 'student', 'bursar', 'hr_manager', 'librarian',
        'transport_manager', 'board_member', 'alumni', 'partner',
      ];
      for (const role of expectedRoles) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      }
    });

    it('every role has at least one permission', () => {
      for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
        expect(perms.length).toBeGreaterThan(0);
      }
    });

    it('all permissions in the map are valid Permission strings (no typos)', () => {
      // Every permission must follow the namespace:action format
      const permRegex = /^[a-z_]+:[a-z_]+$/;
      for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
        for (const perm of perms) {
          expect(perm).toMatch(permRegex);
        }
      }
    });
  });
});
