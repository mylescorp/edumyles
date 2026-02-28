// ============================================================
// EduMyles — Auth Helper Functions
// ============================================================

const SESSION_COOKIE_NAME = "edumyles_session";

/**
 * Read the session token from the browser cookie (client-side only).
 * Returns `null` if no session cookie is present.
 */
export function getSessionFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split("=");
    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

/**
 * Redirect the user to the login page.
 * Preserves the current URL as a `returnTo` query parameter so
 * the auth flow can redirect back after sign-in.
 */
export function redirectToLogin(): void {
  if (typeof window === "undefined") {
    return;
  }

  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/auth/login?returnTo=${returnTo}`;
}

/**
 * Server-side session reader.
 * Reads the session token from the request cookies using next/headers.
 * Must only be called in Server Components or Route Handlers.
 */
export async function getServerSession(): Promise<string | null> {
  // Dynamic import to avoid bundling next/headers in client builds
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value ?? null;
}
