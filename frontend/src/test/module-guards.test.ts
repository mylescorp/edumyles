import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestCtx, createMockTenantContext } from './convex/test-utils';

// Mock requireModule function
const mockRequireModule = vi.fn();

describe('Module Guard Tests', () => {
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

    // Reset mock
    mockRequireModule.mockReset();
  });

  describe('Module Installation Validation', () => {
    it('should allow access when module is installed and active', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'academics';

      // Mock installed module lookup
      const installedModule = {
        tenantId,
        moduleId,
        status: 'active',
        installedAt: Date.now(),
        installedBy: 'admin-user',
        config: {},
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(installedModule),
            }),
          }),
        }),
      });

      mockRequireModule.mockResolvedValue(true);

      const result = await mockRequireModule(mockCtx, tenantId, moduleId);

      expect(result).toBe(true);
      expect(mockRequireModule).toHaveBeenCalledWith(mockCtx, tenantId, moduleId);
    });

    it('should deny access when module is not installed', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'library';

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
        }),
      });

      mockRequireModule.mockImplementation(() => {
        throw new Error('MODULE_NOT_INSTALLED');
      });

      await expect(mockRequireModule(mockCtx, tenantId, moduleId)).rejects.toThrow('MODULE_NOT_INSTALLED');
    });

    it('should deny access when module is inactive', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'transport';

      const inactiveModule = {
        tenantId,
        moduleId,
        status: 'inactive',
        installedAt: Date.now(),
        installedBy: 'admin-user',
        config: {},
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(inactiveModule),
            }),
          }),
        }),
      });

      mockRequireModule.mockImplementation(() => {
        throw new Error('MODULE_INACTIVE');
      });

      await expect(mockRequireModule(mockCtx, tenantId, moduleId)).rejects.toThrow('MODULE_INACTIVE');
    });
  });

  describe('Module Tier Validation', () => {
    it('should allow access to modules within tenant tier', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'academics';

      // Mock tenant with standard tier
      const tenant = {
        tenantId,
        name: 'Test School',
        plan: 'standard',
        status: 'active',
      };

      const organization = {
        tenantId,
        tier: 'standard',
        isActive: true,
      };

      const installedModule = {
        tenantId,
        moduleId,
        status: 'active',
        installedAt: Date.now(),
      };

      // Mock tenant lookup
      mockDb.query.mockImplementation((table: string) => {
        if (table === 'tenants') {
          return {
            withIndex: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(tenant),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            withIndex: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(organization),
              }),
            }),
          };
        }
        if (table === 'installedModules') {
          return {
            withIndex: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  first: vi.fn().mockResolvedValue(installedModule),
                }),
              }),
            }),
          };
        }
        return {
          withIndex: vi.fn(),
        };
      });

      mockRequireModule.mockResolvedValue(true);

      const result = await mockRequireModule(mockCtx, tenantId, moduleId);

      expect(result).toBe(true);
    });

    it('should deny access to modules outside tenant tier', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'advanced_analytics'; // Enterprise-only module

      // Mock tenant with starter tier
      const tenant = {
        tenantId,
        name: 'Test School',
        plan: 'starter',
        status: 'active',
      };

      const organization = {
        tenantId,
        tier: 'starter',
        isActive: true,
      };

      // Mock tenant lookup
      mockDb.query.mockImplementation((table: string) => {
        if (table === 'tenants') {
          return {
            withIndex: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(tenant),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            withIndex: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(organization),
              }),
            }),
          };
        }
        return {
          withIndex: vi.fn(),
        };
      });

      mockRequireModule.mockImplementation(() => {
        throw new Error('MODULE_NOT_AVAILABLE_FOR_TIER');
      });

      await expect(mockRequireModule(mockCtx, tenantId, moduleId)).rejects.toThrow('MODULE_NOT_AVAILABLE_FOR_TIER');
    });
  });

  describe('Module Dependencies', () => {
    it('should validate module dependencies are met', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'timetable'; // Depends on academics module

      const academicsModule = {
        tenantId,
        moduleId: 'academics',
        status: 'active',
        installedAt: Date.now(),
      };

      const timetableModule = {
        tenantId,
        moduleId: 'timetable',
        status: 'active',
        installedAt: Date.now(),
        dependencies: ['academics'],
      };

      // Mock dependency check
      mockDb.query.mockImplementation((table: string) => {
        if (table === 'installedModules') {
          return {
            withIndex: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  collect: vi.fn().mockResolvedValue([academicsModule, timetableModule]),
                }),
              }),
            }),
          };
        }
        return {
          withIndex: vi.fn(),
        };
      });

      mockRequireModule.mockResolvedValue(true);

      const result = await mockRequireModule(mockCtx, tenantId, moduleId);

      expect(result).toBe(true);
    });

    it('should deny access when dependencies are not met', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'timetable';

      const timetableModule = {
        tenantId,
        moduleId: 'timetable',
        status: 'active',
        installedAt: Date.now(),
        dependencies: ['academics'],
      };

      // Mock dependency check (academics not installed)
      mockDb.query.mockImplementation((table: string) => {
        if (table === 'installedModules') {
          return {
            withIndex: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  collect: vi.fn().mockResolvedValue([timetableModule]), // Only timetable, no academics
                }),
              }),
            }),
          };
        }
        return {
          withIndex: vi.fn(),
        };
      });

      mockRequireModule.mockImplementation(() => {
        throw new Error('MODULE_DEPENDENCIES_NOT_MET');
      });

      await expect(mockRequireModule(mockCtx, tenantId, moduleId)).rejects.toThrow('MODULE_DEPENDENCIES_NOT_MET');
    });
  });

  describe('Module Configuration', () => {
    it('should respect module configuration settings', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'communications';

      const configuredModule = {
        tenantId,
        moduleId,
        status: 'active',
        installedAt: Date.now(),
        config: {
          smsEnabled: true,
          emailEnabled: false,
          maxDailyMessages: 100,
        },
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(configuredModule),
            }),
          }),
        }),
      });

      mockRequireModule.mockResolvedValue(configuredModule.config);

      const result = await mockRequireModule(mockCtx, tenantId, moduleId);

      expect(result).toEqual(configuredModule.config);
      expect(result.smsEnabled).toBe(true);
      expect(result.emailEnabled).toBe(false);
    });

    it('should handle missing configuration gracefully', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'library';

      const moduleWithoutConfig = {
        tenantId,
        moduleId,
        status: 'active',
        installedAt: Date.now(),
        config: {},
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(moduleWithoutConfig),
            }),
          }),
        }),
      });

      mockRequireModule.mockResolvedValue({});

      const result = await mockRequireModule(mockCtx, tenantId, moduleId);

      expect(result).toEqual({});
    });
  });

  describe('Module Status Transitions', () => {
    it('should handle module activation', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'ecommerce';

      const inactiveModule = {
        tenantId,
        moduleId,
        status: 'inactive',
        installedAt: Date.now(),
        config: {},
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(inactiveModule),
            }),
          }),
        }),
      });

      mockDb.patch.mockResolvedValue({
        _id: 'module-id',
        status: 'active',
      });

      // Simulate activation
      mockRequireModule.mockImplementation(async (ctx, tenantId, moduleId) => {
        const module = await ctx.db
          .query('installedModules')
          .withIndex('by_tenant_module', (q: any) => q.eq('tenantId', tenantId).eq('moduleId', moduleId))
          .collect()
          .then(modules => modules[0]);

        if (module && module.status === 'inactive') {
          await ctx.db.patch(module._id, { status: 'active' });
          return true;
        }
        throw new Error('MODULE_NOT_ACTIVE');
      });

      const result = await mockRequireModule(mockCtx, tenantId, moduleId);

      expect(result).toBe(true);
      expect(mockDb.patch).toHaveBeenCalledWith('module-id', { status: 'active' });
    });

    it('should handle module deactivation', async () => {
      const tenantId = 'tenant-1';
      const moduleId = 'transport';

      const activeModule = {
        tenantId,
        moduleId,
        status: 'active',
        installedAt: Date.now(),
        config: {},
      };

      mockDb.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(activeModule),
            }),
          }),
        }),
      });

      mockDb.patch.mockResolvedValue({
        _id: 'module-id',
        status: 'inactive',
      });

      // Simulate deactivation
      mockRequireModule.mockImplementation(async (ctx, tenantId, moduleId) => {
        const module = await ctx.db
          .query('installedModules')
          .withIndex('by_tenant_module', (q: any) => q.eq('tenantId', tenantId).eq('moduleId', moduleId))
          .collect()
          .then((modules: any[]) => modules[0]);

        if (module && module.status === 'active') {
          await ctx.db.patch(module._id, { status: 'inactive' });
          return true;
        }
        return false;
      });

      const result = await mockRequireModule(mockCtx, tenantId, moduleId);

      expect(result).toBe(true);
      expect(mockDb.patch).toHaveBeenCalledWith('module-id', { status: 'inactive' });
    });
  });
});
