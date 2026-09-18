// ============================================================
// EduMyles — Current User API Endpoint
// ============================================================

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export const dynamic = 'force-dynamic';

/**
 * Get current authenticated user information
 */
export async function GET() {
  try {
    const sessionToken = await getServerSession();

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: 'Your session has expired. Please sign in to continue.' },
        { status: 401 }
      );
    }

    // Validate session token with Convex and fetch user data
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;

    if (!convexUrl || !serverSecret) {
      console.error('Missing Convex configuration');
      return NextResponse.json(
        { success: false, message: 'We could not verify your identity. Please sign in again.' },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(convexUrl);

    try {
      // Get user session from Convex
      const session = await convex.query(api.sessions.getSession, {
        sessionToken,
        serverSecret,
      });

      if (!session) {
        return NextResponse.json(
          { success: false, message: 'Your session has expired. Please sign in to continue.' },
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
          { success: false, message: 'We could not load your account. Please sign in again.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
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
        { success: false, message: 'We could not verify your session. Please sign in again.' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong on our end. Please try again.' },
      { status: 500 }
    );
  }
}
