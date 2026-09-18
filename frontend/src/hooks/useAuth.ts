"use client";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

type Session = {
  sessionToken: string;
  tenantId: string;
  activeTenantId?: string;
  networkId?: string | null;
  identityId?: string | null;
  accessibleTenantIds?: string[];
  userId: string;
  email: string;
  role: string;
  expiresAt: number;
};

function normalizeRole(role: string | null | undefined) {
  if (role === "platform_admin") return "super_admin";
  return role ?? null;
}

function isPlatformRole(role: string | null | undefined) {
  if (!role) return false;
  return [
    "master_admin",
    "super_admin",
    "platform_manager",
    "support_agent",
    "billing_admin",
    "marketplace_reviewer",
    "content_moderator",
    "analytics_viewer",
  ].includes(role);
}

type AuthStoreState = {
  session: Session | null;
  isLoading: boolean;
};

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

function getRequestedWorkspace(): "admin" | "platform" | null {
  if (typeof window === "undefined") return null;
  const pathname = window.location.pathname;

  if (pathname.startsWith("/platform")) {
    return "platform";
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/portal/admin")) {
    return "admin";
  }

  return null;
}

async function loadAuthSession(force = false) {
  if (authLoadPromise && !force) {
    return authLoadPromise;
  }

  authLoadPromise = (async () => {
    if (!authState.session || force) {
      setAuthState({ isLoading: true });
    } else {
      // Keep the existing authenticated shell rendered while we refresh
      // the session in the background. Flipping back to `isLoading: true`
      // here causes RoleGuard to unmount the page and creates a blink loop.
      setAuthState({ isLoading: false });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const workspace = getRequestedWorkspace();
      const endpoint = workspace
        ? `/api/auth/session?workspace=${encodeURIComponent(workspace)}`
        : "/api/auth/session";
      const res = await fetch(endpoint, {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        setAuthState({
          session: null,
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
      setAuthState({
        session: nextSession,
        isLoading: false,
      });
    } catch {
      setAuthState({
        session: null,
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
    listener(authState);
    void loadAuthSession();

    return () => {
      authListeners.delete(listener);
    };
  }, []);

  const platformProfile = useQuery(
    api.platform.users.queries.getCurrentPlatformUser,
    { sessionToken: session?.sessionToken ?? "" },
    !!session?.sessionToken && isPlatformRole(session.role)
  );

  const tenantProfile = useQuery(
    api.users.getCurrentUser,
    { sessionToken: session?.sessionToken ?? "" },
    !!session?.sessionToken && !isPlatformRole(session.role)
  );

  const studentProfile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    { sessionToken: session?.sessionToken ?? undefined },
    !!session?.sessionToken && session.role === "student"
  );

  const parentProfile = useQuery(
    api.modules.portal.parent.queries.getParentProfile,
    { sessionToken: session?.sessionToken ?? undefined },
    !!session?.sessionToken && session.role === "parent"
  );

  const partnerProfile = useQuery(
    api.modules.portal.partner.queries.getPartnerProfile,
    {},
    !!session?.sessionToken && session.role === "partner"
  );

  const logout = useCallback(async () => {
    setAuthState({ session: null, isLoading: false });
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
    window.location.replace(
      landingUrl && landingUrl.startsWith("http") ? landingUrl : "/auth/login"
    );
  }, []);

  const buildUserObject = () => {
    if (!session) return null;

    const baseUser = {
      _id: session.userId,
      email: session.email,
      role: session.role,
      tenantId: session.activeTenantId ?? session.tenantId,
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
    tenantId: session?.activeTenantId ?? session?.tenantId ?? null,
    baseTenantId: session?.tenantId ?? null,
    activeTenantId: session?.activeTenantId ?? session?.tenantId ?? null,
    networkId: session?.networkId ?? null,
    identityId: session?.identityId ?? null,
    accessibleTenantIds: session?.accessibleTenantIds ?? (session ? [session.tenantId] : []),
    logout,
    sessionToken: session?.sessionToken ?? null,
    platformProfile,
    tenantProfile,
    studentProfile,
    parentProfile,
    partnerProfile,
  };
}
