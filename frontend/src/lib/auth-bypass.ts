import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const BYPASS_USER = {
  id: "bypass-user-001",
  email: "admin@school.edumyles.com",
  firstName: "Admin",
  lastName: "User",
  role: "super_admin",
  tenantId: "demo-school-001",
};

export function isBypassAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_BYPASS === "true";
}

function normalizeRole(role: unknown) {
  if (!role || typeof role !== "string") return "school_admin";
  return role.toLowerCase();
}

export function getBypassSession() {
  return { user: BYPASS_USER, sessionId: "bypass-session" };
}

export async function setAuthCookie(user: any) {
  const cookieStore = await cookies();
  const normalizedRole = normalizeRole(user?.role);
  
  // Set session cookie
  cookieStore.set('edumyles_session', JSON.stringify({
    user,
    sessionId: `bypass-${Date.now()}`,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  // Set user cookie for client-side access
  cookieStore.set('edumyles_user', JSON.stringify(user), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  cookieStore.set('edumyles_role', normalizedRole, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}
