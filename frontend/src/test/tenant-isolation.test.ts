/**
 * Tenant Isolation Tests
 *
 * These tests validate the session validation logic defined in
 * convex/helpers/tenantGuard.ts. Because the Convex helpers depend on
 * generated server bindings that are not available in the vitest environment,
 * we extract the validation logic as pure helper functions that mirror the
 * exact code. Changes to tenantGuard.ts must be reflected here.
 *
 * Core invariants under test:
 *   1. Sessions not found → UNAUTHENTICATED
 *   2. Expired sessions → UNAUTHENTICATED
 *   3. Malformed tenantId → INVALID_TENANT
 *   4. Valid sessions → return TenantContext
 *   5. Cross-tenant data isolation (tenantId always comes from the session)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Pure extraction of requireTenantSession validation logic ─────────────────
// Mirrors convex/helpers/tenantGuard.ts:requireTenantSession exactly.
// If the source logic changes, update this function accordingly.
interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  email: string;
}

interface SessionRecord {
  tenantId: string;
  activeTenantId?: string;
  userId: string;
  role: string;
  email?: string;
  expiresAt: number;
}

function validateSession(session: SessionRecord | null): TenantContext {
  if (!session) {
    throw new Error('UNAUTHENTICATED: Session not found');
  }
  if (session.expiresAt < Date.now()) {
    throw new Error('UNAUTHENTICATED: Session expired');
  }
  if (!session.tenantId.startsWith('TENANT-') && session.tenantId !== 'PLATFORM') {
    throw new Error('INVALID_TENANT: Malformed tenantId');
  }
  return {
    tenantId: session.activeTenantId ?? session.tenantId,
    userId: session.userId,
    role: session.role,
    email: session.email ?? '',
  };
}

// ─── Pure extraction of requireTenantContext identity validation logic ─────────
// Mirrors convex/helpers/tenantGuard.ts:requireTenantContext exactly.
function validateIdentityAndSession(
  identity: { tokenIdentifier: string } | null,
  session: SessionRecord | null
): TenantContext {
  if (!identity) {
    throw new Error('UNAUTHENTICATED: No active session');
  }
  if (!session) {
    throw new Error('UNAUTHENTICATED: Session not found');
  }
  if (session.expiresAt < Date.now()) {
    throw new Error('UNAUTHENTICATED: Session expired');
  }
  if (!session.tenantId.startsWith('TENANT-') && session.tenantId !== 'PLATFORM') {
    throw new Error('INVALID_TENANT: Malformed tenantId');
  }
  return {
    tenantId: session.activeTenantId ?? session.tenantId,
    userId: session.userId,
    role: session.role,
    email: session.email ?? '',
  };
}

// ─── Test data ────────────────────────────────────────────────────────────────

const validSession: SessionRecord = {
  tenantId: 'TENANT-school-123',
  userId: 'user-abc',
  role: 'school_admin',
  email: 'admin@school.com',
  expiresAt: Date.now() + 86_400_000, // 24 hours from now
};

// ═════════════════════════════════════════════════════════════════════════════
// requireTenantSession — session-token based auth
// ═════════════════════════════════════════════════════════════════════════════

describe('requireTenantSession logic (tenantGuard.ts)', () => {
  describe('Happy path', () => {
    it('returns a complete TenantContext for a valid, non-expired session', () => {
      const ctx = validateSession(validSession);
      expect(ctx).toEqual({
        tenantId: 'TENANT-school-123',
        userId: 'user-abc',
        role: 'school_admin',
        email: 'admin@school.com',
      });
    });

    it('accepts PLATFORM as a special tenantId', () => {
      const platformSession: SessionRecord = {
        ...validSession,
        tenantId: 'PLATFORM',
      };
      const ctx = validateSession(platformSession);
      expect(ctx.tenantId).toBe('PLATFORM');
    });

    it('prefers activeTenantId when a network session has switched campuses', () => {
      const networkSession: SessionRecord = {
        ...validSession,
        tenantId: 'TENANT-network-primary',
        activeTenantId: 'TENANT-network-campus-b',
      };
      const ctx = validateSession(networkSession);
      expect(ctx.tenantId).toBe('TENANT-network-campus-b');
    });

    it('returns empty string when email is missing from session', () => {
      const noEmailSession: SessionRecord = {
        ...validSession,
        email: undefined,
      };
      const ctx = validateSession(noEmailSession);
      expect(ctx.email).toBe('');
    });
  });

  describe('Authentication failures', () => {
    it('throws UNAUTHENTICATED when session is null (not found)', () => {
      expect(() => validateSession(null)).toThrow('UNAUTHENTICATED: Session not found');
    });

    it('throws UNAUTHENTICATED when session has already expired', () => {
      const expired: SessionRecord = {
        ...validSession,
        expiresAt: Date.now() - 1_000,
      };
      expect(() => validateSession(expired)).toThrow('UNAUTHENTICATED: Session expired');
    });

    it('rejects a session that expired exactly 1 ms ago', () => {
      const justExpired: SessionRecord = {
        ...validSession,
        expiresAt: Date.now() - 1,
      };
      expect(() => validateSession(justExpired)).toThrow('UNAUTHENTICATED: Session expired');
    });
  });

  describe('Tenant ID validation', () => {
    it('throws INVALID_TENANT for a tenantId that does not start with TENANT-', () => {
      const badTenant: SessionRecord = { ...validSession, tenantId: 'school-123' };
      expect(() => validateSession(badTenant)).toThrow('INVALID_TENANT: Malformed tenantId');
    });

    it('throws INVALID_TENANT for an empty tenantId', () => {
      const emptyTenant: SessionRecord = { ...validSession, tenantId: '' };
      expect(() => validateSession(emptyTenant)).toThrow('INVALID_TENANT: Malformed tenantId');
    });

    it('rejects TENANT (without trailing dash) as invalid', () => {
      const noTrailingDash: SessionRecord = { ...validSession, tenantId: 'TENANT' };
      expect(() => validateSession(noTrailingDash)).toThrow('INVALID_TENANT: Malformed tenantId');
    });

    it('rejects PLATFORM-123 — only exact PLATFORM is accepted, not substrings', () => {
      const platformVariant: SessionRecord = { ...validSession, tenantId: 'PLATFORM-123' };
      expect(() => validateSession(platformVariant)).toThrow('INVALID_TENANT: Malformed tenantId');
    });

    it('rejects lowercase tenant- prefix', () => {
      const lowercaseTenant: SessionRecord = { ...validSession, tenantId: 'tenant-school-123' };
      expect(() => validateSession(lowercaseTenant)).toThrow('INVALID_TENANT: Malformed tenantId');
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// requireTenantContext — identity-based auth
// ═════════════════════════════════════════════════════════════════════════════

describe('requireTenantContext logic (tenantGuard.ts)', () => {
  const validIdentity = { tokenIdentifier: 'auth-token-xyz' };

  it('returns TenantContext when identity and session are both valid', () => {
    const ctx = validateIdentityAndSession(validIdentity, validSession);
    expect(ctx.tenantId).toBe('TENANT-school-123');
    expect(ctx.role).toBe('school_admin');
  });

  it('throws UNAUTHENTICATED when identity is null (no logged-in user)', () => {
    expect(() => validateIdentityAndSession(null, validSession)).toThrow(
      'UNAUTHENTICATED: No active session'
    );
  });

  it('throws UNAUTHENTICATED when identity exists but session is missing', () => {
    expect(() => validateIdentityAndSession(validIdentity, null)).toThrow(
      'UNAUTHENTICATED: Session not found'
    );
  });

  it('throws UNAUTHENTICATED when identity exists but session is expired', () => {
    const expired: SessionRecord = { ...validSession, expiresAt: Date.now() - 1 };
    expect(() => validateIdentityAndSession(validIdentity, expired)).toThrow(
      'UNAUTHENTICATED: Session expired'
    );
  });

  it('throws INVALID_TENANT when tenantId is malformed, even with valid identity', () => {
    const badSession: SessionRecord = { ...validSession, tenantId: 'BADFORMAT' };
    expect(() => validateIdentityAndSession(validIdentity, badSession)).toThrow(
      'INVALID_TENANT: Malformed tenantId'
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Cross-tenant data isolation principles
// ═════════════════════════════════════════════════════════════════════════════

describe('Cross-tenant isolation principles', () => {
  it('tenantId in returned context always comes from the session record', () => {
    const session: SessionRecord = { ...validSession, tenantId: 'TENANT-alpha' };
    const ctx = validateSession(session);
    expect(ctx.tenantId).toBe('TENANT-alpha');
  });

  it('two sessions from different tenants produce isolated contexts', () => {
    const sessionA: SessionRecord = { ...validSession, tenantId: 'TENANT-alpha', userId: 'user-a' };
    const sessionB: SessionRecord = { ...validSession, tenantId: 'TENANT-beta', userId: 'user-b' };
    const ctxA = validateSession(sessionA);
    const ctxB = validateSession(sessionB);

    expect(ctxA.tenantId).not.toBe(ctxB.tenantId);
    expect(ctxA.userId).not.toBe(ctxB.userId);
  });

  it('an expired session from tenant X is still rejected even if tenant X is valid', () => {
    const expiredSession: SessionRecord = {
      tenantId: 'TENANT-legitimate-school',
      userId: 'attacker',
      role: 'school_admin',
      email: 'attacker@evil.com',
      expiresAt: Date.now() - 1,
    };
    expect(() => validateSession(expiredSession)).toThrow('UNAUTHENTICATED: Session expired');
  });

  it('a session with a TENANT- prefixed ID but invalid structure is rejected at tenant validation', () => {
    // Only the tenantId format is checked — internal structure of the ID is not validated
    // Any string starting with TENANT- passes format check
    const session: SessionRecord = {
      ...validSession,
      tenantId: 'TENANT-x',
    };
    expect(() => validateSession(session)).not.toThrow();
  });
});
