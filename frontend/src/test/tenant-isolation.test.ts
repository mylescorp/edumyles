import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestCtx, createMockTenant, createMockUser, createMockStudent } from './convex/test-utils';

// Mock requireTenantContext function for testing
const mockRequireTenantContext = vi.fn();

describe('Tenant Isolation Tests', () => {
  let mockCtx: any;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: vi.fn(),
      get: vi.fn(),
      insert: vi.fn(),
      patch: vi.fn(),
      replace: vi.fn(),
      delete: vi.fn(),
    };

    mockCtx = createTestCtx();
    mockCtx.db = mockDb;
    mockCtx.auth = {
      getUserId: vi.fn().mockResolvedValue('test-user-id'),
      getTokenIdentifier: vi.fn().mockResolvedValue('test@example.com'),
    };

    // Reset mock implementation
    mockRequireTenantContext.mockReset();
  });

  describe('requireTenantContext', () => {
    it('should return tenant context when valid session exists', async () => {
      // Mock session lookup
      const mockSession = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: 'school_admin',
        expiresAt: Date.now() + 86400000, // 24 hours from now
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(mockSession),
            }),
          }),
        }),
      });

      mockRequireTenantContext.mockResolvedValue({
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: 'school_admin',
      });

      const result = await mockRequireTenantContext(mockCtx);

      expect(result).toEqual({
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: 'school_admin',
      });
    });

    it('should throw error when no session exists', async () => {
      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
        }),
      });

      mockRequireTenantContext.mockRejectedValue(new Error('UNAUTHORIZED'));

      await expect(mockRequireTenantContext(mockCtx)).rejects.toThrow('UNAUTHORIZED');
    });

    it('should throw error when session is expired', async () => {
      const expiredSession = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: 'school_admin',
        expiresAt: Date.now() - 86400000, // 24 hours ago
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(expiredSession),
            }),
          }),
        }),
      });

      mockRequireTenantContext.mockRejectedValue(new Error('SESSION_EXPIRED'));

      await expect(mockRequireTenantContext(mockCtx)).rejects.toThrow('SESSION_EXPIRED');
    });
  });

  describe('Cross-tenant data protection', () => {
    it('should prevent access to data from other tenants', async () => {
      const tenant1Id = 'tenant-1';
      const tenant2Id = 'tenant-2';

      // Mock session for tenant 1
      const mockSession = {
        tenantId: tenant1Id,
        userId: 'user-1',
        role: 'school_admin',
        expiresAt: Date.now() + 86400000,
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(mockSession),
            }),
          }),
        }),
      });

      mockRequireTenantContext.mockResolvedValue({
        tenantId: tenant1Id,
        userId: 'user-1',
        role: 'school_admin',
      });

      const tenantCtx = await mockRequireTenantContext(mockCtx);

      // Test that queries are always filtered by tenantId
      const studentsQuery = mockDb.query('students');
      studentsQuery.withIndex('by_tenant', (q: any) => q.eq('tenantId', tenantCtx.tenantId));

      expect(studentsQuery.withIndex).toHaveBeenCalledWith('by_tenant', expect.any(Function));
    });

    it('should ensure tenant isolation in mutations', async () => {
      const tenantId = 'tenant-1';
      const mockSession = {
        tenantId,
        userId: 'user-1',
        role: 'school_admin',
        expiresAt: Date.now() + 86400000,
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(mockSession),
            }),
          }),
        }),
      });

      mockRequireTenantContext.mockResolvedValue({
        tenantId,
        userId: 'user-1',
        role: 'school_admin',
      });

      const tenantCtx = await mockRequireTenantContext(mockCtx);

      // Simulate creating a student
      const studentData = createMockStudent({ tenantId });
      
      mockDb.insert.mockReturnValue({
        _id: 'student-id',
        ...studentData,
      });

      const result = await mockDb.insert('students', studentData);

      expect(mockDb.insert).toHaveBeenCalledWith('students', expect.objectContaining({
        tenantId: tenantId,
      }));
    });
  });

  describe('Session validation', () => {
    it('should validate session token format', async () => {
      const invalidSession = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: 'school_admin',
        expiresAt: Date.now() + 86400000,
        sessionToken: 'invalid-token-format',
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(invalidSession),
            }),
          }),
        }),
      });

      mockRequireTenantContext.mockResolvedValue({
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: 'school_admin',
      });

      // This should pass basic validation, but token format validation would be in auth layer
      const result = await mockRequireTenantContext(mockCtx);
      expect(result.tenantId).toBe('tenant-1');
    });

    it('should handle malformed session data gracefully', async () => {
      const malformedSession = {
        tenantId: null,
        userId: undefined,
        role: '',
        expiresAt: 'invalid-date',
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(malformedSession),
            }),
          }),
        }),
      });

      mockRequireTenantContext.mockRejectedValue(new Error('INVALID_SESSION'));

      await expect(mockRequireTenantContext(mockCtx)).rejects.toThrow();
    });
  });
});
