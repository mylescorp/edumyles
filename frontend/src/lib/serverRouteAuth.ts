import { withAuth } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";

export async function ensureProtectedRouteSession() {
  // Skip WorkOS auth check in dev bypass mode — proxy.ts already allows all requests through
  const isDevBypass =
    process.env.ENABLE_DEV_AUTH_BYPASS === "true" &&
    process.env.NODE_ENV !== "production";

  if (!isDevBypass) {
    await withAuth({ ensureSignedIn: true });
  }

  const cookieStore = await cookies();

  return {
    sessionToken: cookieStore.get("edumyles_session")?.value ?? null,
    role: cookieStore.get("edumyles_role")?.value ?? null,
  };
}
