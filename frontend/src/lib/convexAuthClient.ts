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
  const client = new ConvexReactClient(CONVEX_URL);
  
  // Only modify fetch on client side
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    
    // Override fetch to include authentication headers for Convex requests
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      // Only modify Convex requests
      if (typeof input === 'string' && input.includes(CONVEX_URL)) {
        const sessionData = localStorage.getItem('convex_auth');
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            const headers = new Headers(init?.headers);
            
            // Add session token as authorization header
            headers.set('Authorization', `Bearer ${session.sessionToken}`);
            
            return originalFetch(input, {
              ...init,
              headers,
            });
          } catch (error) {
            console.error('Failed to parse session data:', error);
          }
        }
      }
      
      return originalFetch(input, init);
    };
  }
  
  return client;
}

/**
 * Singleton authenticated Convex client
 */
export const authenticatedConvexClient = createConvexClientWithAuth();
