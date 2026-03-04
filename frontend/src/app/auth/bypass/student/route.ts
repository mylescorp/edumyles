import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth-bypass';

export async function GET(request: NextRequest) {
  // Create mock student session
  const mockUser = {
    _id: 'student-demo',
    email: 'student@edumyles.demo',
    firstName: 'John',
    lastName: 'Doe',
    role: 'STUDENT',
    tenantId: 'demo-tenant-id',
    eduMylesUserId: 'student-demo-id',
    permissions: ['profile.view', 'grades.view', 'assignments.view'],
    isDemo: true
  };

  // Set auth cookie
  await setAuthCookie(mockUser);

  // Redirect to student dashboard
  return NextResponse.redirect(new URL('/portal/student', request.url));
}
