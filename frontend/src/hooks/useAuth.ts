"use client";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

type Session = {
  sessionToken: string;
  tenantId: string;
  userId: string;
  email: string;
  role: string;
  expiresAt: number;
};

function normalizeRole(role: string | null | undefined) {
  if (role === "platform_admin") return "super_admin";
  return role ?? null;
}

type AuthStoreState = {
  session: Session | null;
  isLoading: boolean;
};

const AUTH_CACHE_KEY = "edumyles_auth_session";

const authListeners = new Set<(state: AuthStoreState) => void>();
let authState: AuthStoreState = {
  session: null,
  isLoading: true,
};
let authLoadPromise: Promise<void> | null = null;

function emitAuthState() {
  for (const listener of authListeners) {
    listener(authState);
  }
}

function setAuthState(next: Partial<AuthStoreState>) {
  authState = {
    ...authState,
    ...next,
  };
  emitAuthState();
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}

function readStoredSession(): Session | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.email || !parsed?.role) return null;
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null) {
  if (typeof window === "undefined") return;

  try {
    if (!session) {
      window.localStorage.removeItem(AUTH_CACHE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(session));
  } catch {
    // Ignore localStorage quota / availability issues.
  }
}

function buildFallbackSessionFromCookies(): Session | null {
  const userCookie = readCookie("edumyles_user");
  const roleCookie = normalizeRole(readCookie("edumyles_role"));
  const storedSession = readStoredSession();

  if (!userCookie) return storedSession;

  try {
    const user = JSON.parse(userCookie) as {
      email?: string;
      role?: string;
      tenantId?: string;
      sessionToken?: string;
    };

    if (!user.email) return null;

    const role = normalizeRole(user.role) ?? roleCookie ?? "school_admin";
    const tenantId = role === "master_admin" ? "PLATFORM" : (user.tenantId ?? "PLATFORM");

    return {
      sessionToken:
        user.sessionToken ||
        (storedSession?.email === user.email
          ? storedSession.sessionToken
          : ""),
      tenantId:
        storedSession?.email === user.email
          ? storedSession.tenantId || tenantId
          : tenantId,
      userId: user.email,
      email: user.email,
      role,
      expiresAt:
        storedSession?.email === user.email
          ? storedSession.expiresAt
          : Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
  } catch {
    return storedSession;
  }
}

async function loadAuthSession(force = false) {
  if (authLoadPromise && !force) {
    return authLoadPromise;
  }

  authLoadPromise = (async () => {
    const cachedSession = readStoredSession();

    if (cachedSession && !force) {
      setAuthState({ session: cachedSession, isLoading: false });
    } else {
      setAuthState({ isLoading: true });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch("/api/auth/session", {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        setAuthState({
          session: buildFallbackSessionFromCookies(),
          isLoading: false,
        });
        return;
      }

      const data = await res.json();
      const nextSession = data.session
        ? {
            ...(data.session as Session),
            role: normalizeRole((data.session as Session).role) ?? "",
          }
        : null;
      const resolvedSession = nextSession ?? buildFallbackSessionFromCookies();

      writeStoredSession(resolvedSession);

      setAuthState({
        session: resolvedSession,
        isLoading: false,
      });
    } catch {
      const fallbackSession = buildFallbackSessionFromCookies();
      writeStoredSession(fallbackSession);
      setAuthState({
        session: fallbackSession,
        isLoading: false,
      });
    } finally {
      authLoadPromise = null;
    }
  })();

  return authLoadPromise;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(authState.session);
  const [isLoading, setIsLoading] = useState(authState.isLoading);

  useEffect(() => {
    const listener = (state: AuthStoreState) => {
      setSession(state.session);
      setIsLoading(state.isLoading);
    };

    authListeners.add(listener);
    const cachedSession = readStoredSession();
    if (cachedSession && !authState.session) {
      setAuthState({ session: cachedSession, isLoading: false });
    } else {
      listener(authState);
    }
    void loadAuthSession();

    return () => {
      authListeners.delete(listener);
    };
  }, []);

  const platformProfile = useQuery(
    api.platform.users.queries.getCurrentPlatformUser,
    { sessionToken: session?.sessionToken ?? "" },
    !!session?.sessionToken && (session.role === "master_admin" || session.role === "super_admin")
  );

  const tenantProfile = useQuery(
    api.users.getCurrentUser,
    { sessionToken: session?.sessionToken ?? "" },
    !!session?.sessionToken && session.role !== "master_admin" && session.role !== "super_admin"
  );

  const studentProfile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    {},
    !!session?.sessionToken && session.role === "student"
  );

  const parentProfile = useQuery(
    api.modules.portal.parent.queries.getParentProfile,
    {},
    !!session?.sessionToken && session.role === "parent"
  );

  const partnerProfile = useQuery(
    api.modules.portal.partner.queries.getPartnerProfile,
    {},
    !!session?.sessionToken && session.role === "partner"
  );

  const logout = useCallback(async () => {
    writeStoredSession(null);
    setAuthState({ session: null, isLoading: false });
    localStorage.clear();
    sessionStorage.clear();

    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Ignore logout transport failures and continue redirecting.
    }

    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL;
    window.location.replace(landingUrl && landingUrl.startsWith("http") ? landingUrl : "/auth/login");
  }, []);

  const buildUserObject = () => {
    if (!session) return null;

    const baseUser = {
      _id: session.userId,
      email: session.email,
      role: session.role,
      tenantId: session.tenantId,
      sessionToken: session.sessionToken,
    };

    if (platformProfile) {
      return {
        ...baseUser,
        firstName: platformProfile.firstName,
        lastName: platformProfile.lastName,
        phone: platformProfile.phone,
        bio: platformProfile.bio,
        location: platformProfile.location,
        avatarUrl: platformProfile.avatarUrl,
        createdAt: platformProfile.createdAt,
      };
    }

    if (tenantProfile) {
      return {
        ...baseUser,
        firstName: tenantProfile.firstName,
        lastName: tenantProfile.lastName,
        phone: tenantProfile.phone,
        avatarUrl: tenantProfile.avatarUrl,
        isActive: tenantProfile.isActive,
      };
    }

    if (studentProfile) {
      return {
        ...baseUser,
        firstName: studentProfile.firstName,
        lastName: studentProfile.lastName,
        admissionNo: studentProfile.admissionNo,
        curriculum: studentProfile.curriculum,
        status: studentProfile.status,
        classId: studentProfile.classId,
        dateOfBirth: studentProfile.dateOfBirth,
        gender: studentProfile.gender,
        guardianIds: studentProfile.guardianIds,
        photo: studentProfile.photo,
        createdAt: studentProfile.createdAt,
      };
    }

    if (parentProfile) {
      return {
        ...baseUser,
        firstName: parentProfile.firstName,
        lastName: parentProfile.lastName,
        phone: parentProfile.phone,
        childrenIds: parentProfile.childrenIds,
        occupation: parentProfile.occupation,
        employer: parentProfile.employer,
        workPhone: parentProfile.workPhone,
        createdAt: parentProfile.createdAt,
      };
    }

    if (partnerProfile) {
      return {
        ...baseUser,
        organizationName: partnerProfile.organizationName,
        organizationType: partnerProfile.organizationType,
        contactEmail: partnerProfile.contactEmail,
        contactPhone: partnerProfile.contactPhone,
        sponsorshipTerms: partnerProfile.sponsorshipTerms,
        createdAt: partnerProfile.createdAt,
      };
    }

    return {
      ...baseUser,
      firstName: session.email.split("@")[0],
      lastName: "",
      avatarUrl: undefined,
    };
  };

  const user = buildUserObject();

  return {
    user,
    isLoading,
    isAuthenticated: !!session,
    role: session?.role ?? null,
    tenantId: session?.tenantId ?? null,
    logout,
    sessionToken: session?.sessionToken ?? null,
    platformProfile,
    tenantProfile,
    studentProfile,
    parentProfile,
    partnerProfile,
  };
}
