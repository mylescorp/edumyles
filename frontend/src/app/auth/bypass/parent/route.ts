import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth-bypass';

export async function GET(request: NextRequest) {
  // Create mock parent session
  const mockUser = {
    _id: 'parent-demo',
    email: 'parent@edumyles.demo',
    firstName: 'Mary',
    lastName: 'Johnson',
    role: 'PARENT',
    tenantId: 'demo-tenant-id',
    eduMylesUserId: 'parent-demo-id',
    permissions: ['children.view', 'fees.view', 'communications.view'],
    isDemo: true
  };

  // Set auth cookie
  await setAuthCookie(mockUser);

  // Redirect to parent dashboard
  return NextResponse.redirect(new URL('/portal/parent', request.url));
}
