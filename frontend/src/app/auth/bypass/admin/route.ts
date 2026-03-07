import { NextRequest, NextResponse } from 'next/server';
import { isBypassAllowed, setAuthCookie } from '@/lib/auth-bypass';

export async function GET(request: NextRequest) {
  if (!isBypassAllowed()) {
    return NextResponse.json(
      { error: "Access denied: bypass auth is disabled in production" },
      { status: 403 }
    );
  }

  // Create mock school admin session
  const mockUser = {
    _id: 'school-admin-demo',
    email: 'admin@edumyles.demo',
    firstName: 'School',
    lastName: 'Admin',
    role: 'SCHOOL_ADMIN',
    tenantId: 'demo-tenant-id',
    eduMylesUserId: 'admin-demo-id',
    permissions: ['school.admin', 'students.manage', 'staff.manage', 'finance.manage'],
    isDemo: true
  };

  // Set auth cookie
  await setAuthCookie(mockUser);

  // Redirect to admin dashboard
  return NextResponse.redirect(new URL('/admin', request.url));
}
