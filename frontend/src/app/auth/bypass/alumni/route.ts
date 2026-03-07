import { NextRequest, NextResponse } from 'next/server';
import { isBypassAllowed, setAuthCookie } from '@/lib/auth-bypass';

export async function GET(request: NextRequest) {
  if (!isBypassAllowed()) {
    return NextResponse.json(
      { error: "Access denied: bypass auth is disabled in production" },
      { status: 403 }
    );
  }

  // Create mock alumni session
  const mockUser = {
    _id: 'alumni-demo',
    email: 'alumni@edumyles.demo',
    firstName: 'Robert',
    lastName: 'Wilson',
    role: 'ALUMNI',
    tenantId: 'demo-tenant-id',
    eduMylesUserId: 'alumni-demo-id',
    permissions: ['profile.view', 'transcripts.request', 'events.view'],
    graduationYear: 2020,
    isDemo: true
  };

  // Set auth cookie
  await setAuthCookie(mockUser);

  // Redirect to alumni dashboard
  return NextResponse.redirect(new URL('/portal/alumni', request.url));
}
