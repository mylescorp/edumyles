// ============================================================
// EduMyles — Convex Client with Session-based Authentication
// ============================================================
import { ConvexReactClient } from "convex/react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL environment variable. " +
      "Set it in .env.local to point to your Convex deployment."
  );
}

/**
 * Creates a Convex client that handles authentication through session tokens
 * This client will automatically handle authentication by reading session data
 */
export function createConvexClientWithAuth(): ConvexReactClient {
  return new ConvexReactClient(CONVEX_URL);
}

/**
 * Singleton authenticated Convex client
 * Created lazily to avoid server-side initialization issues
 */
let _authenticatedConvexClient: ConvexReactClient | null = null;

export const authenticatedConvexClient = (() => {
  if (!_authenticatedConvexClient && typeof window !== 'undefined') {
    _authenticatedConvexClient = createConvexClientWithAuth();
  }
  return _authenticatedConvexClient;
})();
