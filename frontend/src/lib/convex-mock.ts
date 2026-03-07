// Mock Convex hooks for SSR safety
export const mockUseQuery = () => undefined;
export const mockUseMutation = () => ({ 
  mutate: async () => {}, 
  isPending: false 
});

// Check if we're in SSR/build environment
export const isSSREnvironment = () => {
  return typeof window === 'undefined';
};
