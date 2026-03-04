import { ConvexHttpClient } from "convex/browser";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const SESSION_COOKIE_NAME = "edumyles_session";

function redirectToLogin(nextPath: string): never {
  const next = encodeURIComponent(nextPath);
  const authBase = process.env.NEXT_PUBLIC_AUTH_BASE_URL;
  const url = authBase
    ? `${authBase}/auth/login?next=${next}`
    : `/auth/login?next=${next}`;
  redirect(url);
}

export async function requireSession(nextPath: string) {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(SESSION_COOKIE_NAME)?.value ??
    cookieStore.get("edumyles-session")?.value;

  if (!sessionToken) {
    redirectToLogin(nextPath);
  }

  try {
    const session = await convex.query(api.sessions.getSession, { sessionToken });
    if (!session) {
      redirectToLogin(nextPath);
    }
    return session;
  } catch {
    redirectToLogin(nextPath);
  }
}
