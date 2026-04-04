// ============================================================
// EduMyles — Current User API Endpoint
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export const dynamic = 'force-dynamic';

/**
 * Get current authenticated user information
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getServerSession();

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate session token with Convex and fetch user data
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

    if (!convexUrl || !serverSecret) {
      console.error('Missing Convex configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(convexUrl);

    try {
      // Get user session from Convex
      const session = await convex.query(api.sessions.getSessionByToken, {
        sessionToken,
        serverSecret,
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Invalid or expired session' },
          { status: 401 }
        );
      }

      // Get user details
      const user = await convex.query(api.users.getUserByWorkosId, {
        workosUserId: session.userId,
        tenantId: session.tenantId,
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: user.workosUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: session.role,
        tenantId: session.tenantId,
        isAuthenticated: true,
        profilePictureUrl: user.avatarUrl,
      });
    } catch (convexError) {
      console.error('Convex session validation error:', convexError);
      return NextResponse.json(
        { error: 'Session validation failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
