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

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        // Use server-side API endpoint to validate the httpOnly session cookie
        const res = await fetch("/api/auth/session", {
          credentials: "same-origin",
        });

        if (!res.ok) {
          if (!cancelled) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        const data = await res.json();

        if (!cancelled) {
          setSession(data.session as Session | null);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Get platform user profile if session exists
  const platformProfile = useQuery(
    api.platform.users.queries.getCurrentPlatformUser,
    { sessionToken: session?.sessionToken ?? "" },
    !!session?.sessionToken && session.role === "master_admin"
  );

  // Get tenant user profile if session exists and not platform admin
  const tenantProfile = useQuery(
    api.users.getCurrentUser,
    { sessionToken: session?.sessionToken ?? "" },
    !!session?.sessionToken && session.role !== "master_admin"
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
    try {
      // Call the logout API route
      const response = await fetch("/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setSession(null);
        setIsLoading(false);
      }

      if (response.ok) {
        // Clear local storage and session storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to login page
        const returnTo = encodeURIComponent(window.location.pathname);
        window.location.href = `/auth/login?returnTo=${returnTo}`;
      } else {
        console.error("Logout failed");
        // Fallback: still redirect to login
        window.location.href = "/auth/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: still redirect to login
      window.location.href = "/auth/login";
    }
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
