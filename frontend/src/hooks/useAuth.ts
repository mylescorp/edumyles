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

async function loadAuthSession(force = false) {
  if (authLoadPromise && !force) {
    return authLoadPromise;
  }

  authLoadPromise = (async () => {
    setAuthState({ isLoading: true });

    try {
      const res = await fetch("/api/auth/session", {
        credentials: "same-origin",
      });

      if (!res.ok) {
        setAuthState({ session: null, isLoading: false });
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
      setAuthState({ session: null, isLoading: false });
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

  // Get platform user profile if session exists
  const platformProfile = useQuery(
    api.platform.users.queries.getCurrentPlatformUser,
    { sessionToken: session?.sessionToken ?? "" },
    !!session?.sessionToken && (session.role === "master_admin" || session.role === "super_admin")
  );

  // Get tenant user profile if session exists and not platform admin
  const tenantProfile = useQuery(
    api.users.getCurrentUser,
    { sessionToken: session?.sessionToken ?? "" },
    !!session?.sessionToken && session.role !== "master_admin" && session.role !== "super_admin"
  );

  // Get student profile if role is student
  const studentProfile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    {},
    !!session?.sessionToken && session.role === "student"
  );

  // Get parent profile if role is parent
  const parentProfile = useQuery(
    api.modules.portal.parent.queries.getParentProfile,
    {},
    !!session?.sessionToken && session.role === "parent"
  );

  // Get partner profile if role is partner
  const partnerProfile = useQuery(
    api.modules.portal.partner.queries.getPartnerProfile,
    {},
    !!session?.sessionToken && session.role === "partner"
  );

  const logout = useCallback(async () => {
    // Clear client state immediately so UI reacts right away
    setAuthState({ session: null, isLoading: false });
    localStorage.clear();
    sessionStorage.clear();

    try {
      // Invalidate server session + clear cookies
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Ignore — we still redirect to login regardless
    }

    // Redirect to landing page after logout
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL;
    window.location.replace(landingUrl && landingUrl.startsWith("http") ? landingUrl : "/auth/login");
  }, []);

  // Build user object based on role and available profile data
  const buildUserObject = () => {
    if (!session) return null;

    const baseUser = {
      _id: session.userId,
      email: session.email,
      role: session.role,
      tenantId: session.tenantId,
      sessionToken: session.sessionToken,
    };

    // Platform users (master_admin, super_admin)
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

    // Tenant users (school_admin, principal, teacher, etc.)
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

    // Students
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

    // Parents
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

    // Partners
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

    // Fallback to basic session data
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
    // Additional profile data for convenience
    platformProfile,
    tenantProfile,
    studentProfile,
    parentProfile,
    partnerProfile,
  };
}
