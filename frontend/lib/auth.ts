import { ConvexHttpClient } from "convex/browser";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function redirectToLogin(nextPath: string): never {
  const next = encodeURIComponent(nextPath);
  redirect(`/auth/login?next=${next}`);
}

export async function requireSession(nextPath: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("edumyles-session")?.value;

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
