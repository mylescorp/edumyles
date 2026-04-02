import '@testing-library/jest-dom';
import { beforeAll, afterEach, vi } from 'vitest';

// Mock Convex for testing
vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn(),
}));

// Mock WorkOS for testing
vi.mock('@workos-inc/authkit-nextjs', () => ({
  WorkOSProvider: ({ children }) => children,
  useAuth: () => ({
    user: null,
    isLoading: false,
    isSignedIn: false,
  }),
}));

// Global test setup
beforeAll(() => {
  // Set up any global test environment
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks();
});
