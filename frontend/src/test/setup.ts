import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Convex for testing
vi.mock('@/convex/_generated/api', () => ({
  api: {
    modules: {
      marketplace: {
        queries: {
          getAvailableForTier: vi.fn(),
          getInstalledModules: vi.fn(),
          getModuleDetails: vi.fn(),
        },
        mutations: {
          installModule: vi.fn(),
          uninstallModule: vi.fn(),
        },
      },
      sis: {
        queries: {
          listStudents: vi.fn(),
          getStudent: vi.fn(),
        },
      },
      academics: {
        queries: {
          getTeacherClasses: vi.fn(),
          getClassStudents: vi.fn(),
        },
      },
      finance: {
        queries: {
          listFeeStructures: vi.fn(),
        },
        actions: {
          recordPaymentFromGateway: vi.fn(),
        },
      },
    },
    platform: {
      tenants: {
        queries: {
          getPlatformStats: vi.fn(),
          getRecentActivity: vi.fn(),
        },
      },
    },
    users: {
      queries: {
        getCurrentUser: vi.fn(),
      },
    },
  },
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock environment variables
process.env.NEXT_PUBLIC_CONVEX_URL = 'http://localhost:3001';
