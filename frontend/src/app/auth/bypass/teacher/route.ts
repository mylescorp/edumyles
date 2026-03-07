import { NextRequest, NextResponse } from 'next/server';
import { isBypassAllowed, setAuthCookie } from '@/lib/auth-bypass';

export async function GET(request: NextRequest) {
  if (!isBypassAllowed()) {
    return NextResponse.json(
      { error: "Access denied: bypass auth is disabled in production" },
      { status: 403 }
    );
  }

  // Create mock teacher session
  const mockUser = {
    _id: 'teacher-demo',
    email: 'teacher@edumyles.demo',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'TEACHER',
    tenantId: 'demo-tenant-id',
    eduMylesUserId: 'teacher-demo-id',
    permissions: ['classes.view', 'grades.manage', 'attendance.manage'],
    isDemo: true
  };

  // Set auth cookie
  await setAuthCookie(mockUser);

  // Redirect to teacher dashboard
  return NextResponse.redirect(new URL('/portal/teacher', request.url));
}
