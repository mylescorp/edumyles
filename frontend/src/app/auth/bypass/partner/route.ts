import { NextRequest, NextResponse } from 'next/server';
import { isBypassAllowed, setAuthCookie } from '@/lib/auth-bypass';

export async function GET(request: NextRequest) {
  if (!isBypassAllowed()) {
    return NextResponse.json(
      { error: "Access denied: bypass auth is disabled in production" },
      { status: 403 }
    );
  }

  // Create mock partner session
  const mockUser = {
    _id: 'partner-demo',
    email: 'partner@edumyles.demo',
    firstName: 'Sarah',
    lastName: 'Lee',
    role: 'PARTNER',
    tenantId: 'demo-tenant-id',
    eduMylesUserId: 'partner-demo-id',
    permissions: ['resources.view', 'collaboration.manage', 'services.view'],
    organization: 'Education Partners Inc.',
    isDemo: true
  };

  // Set auth cookie
  await setAuthCookie(mockUser);

  // Redirect to partner dashboard
  return NextResponse.redirect(new URL('/portal/partner', request.url));
}
