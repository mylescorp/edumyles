export type LandingAuthState = {
  nonce: string;
  mode: "sign-in" | "sign-up";
  returnTo?: string;
  schoolName?: string;
};

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL ?? "ayany004@gmail.com";

export function resolveRole(email: string, _organizationId?: string): string {
  if (
    MASTER_ADMIN_EMAIL &&
    email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  ) {
    return "master_admin";
  }

  return "school_admin";
}

export function getRoleDashboardPath(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "/platform";
    case "teacher":
      return "/portal/teacher";
    case "parent":
      return "/portal/parent";
    case "student":
      return "/portal/student";
    case "alumni":
      return "/portal/alumni";
    case "partner":
      return "/portal/partner";
    default:
      return "/admin";
  }
}

export function sanitizeReturnTo(
  returnTo: string | null | undefined,
  fallback: string
): string {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return fallback;
  }

  return returnTo;
}

export function encodeAuthState(state: LandingAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function decodeAuthState(
  rawState: string | null | undefined
): LandingAuthState | null {
  if (!rawState) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(rawState, "base64url").toString("utf-8")) as LandingAuthState;
  } catch {
    return null;
  }
}

export function getLandingRedirectUri(origin: string): string {
  return (
    process.env.WORKOS_REDIRECT_URI ||
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
    `${origin}/auth/callback`
  );
}

export function getAppBaseUrl(origin: string): string {
  return origin.replace(/\/$/, "");
}

export function buildPostAuthRedirectUrl(params: {
  origin: string;
  role: string;
  returnTo?: string | null;
}): string {
  const fallbackPath = getRoleDashboardPath(params.role);
  const safePath = sanitizeReturnTo(params.returnTo, fallbackPath);
  return new URL(safePath, `${getAppBaseUrl(params.origin)}/`).toString();
}
