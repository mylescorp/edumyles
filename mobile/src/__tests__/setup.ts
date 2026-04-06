// Jest setup for EduMyles Mobile tests.
// Mocks React Native modules that are unavailable in the Node.js test environment.

// Mock async-storage so cache.ts falls back to memory store in tests
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: null, // force cache.ts to use the in-memory fallback
}), { virtual: true });

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

// Mock expo-linking
jest.mock("expo-linking", () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn().mockResolvedValue(null),
  parse: jest.fn((url: string) => {
    const [scheme, rest] = url.split("://");
    const [path, query] = (rest ?? "").split("?");
    const params: Record<string, string> = {};
    if (query) {
      query.split("&").forEach((pair) => {
        const [k, v] = pair.split("=");
        if (k) params[k] = decodeURIComponent(v ?? "");
      });
    }
    return { scheme, path, queryParams: params };
  }),
}), { virtual: true });

// Silence React Native's Animated warnings in tests
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}), { virtual: true });
