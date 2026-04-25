import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeDevRole } from "@/lib/dev/access";

export async function ensureProtectedRouteSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("edumyles_session")?.value ?? null;
  const role = cookieStore.get("edumyles_role")?.value ?? null;

  if (!sessionToken) {
    redirect("/auth/login");
  }

  return {
    sessionToken,
    role,
  };
}

export async function ensureAuthorizedRouteSession(allowedRoles: readonly string[]) {
  const session = await ensureProtectedRouteSession();
  const normalizedRole = normalizeDevRole(session.role);

  if (!normalizedRole || !allowedRoles.includes(normalizedRole)) {
    redirect("/platform");
  }

  return {
    ...session,
    role: normalizedRole,
  };
}
