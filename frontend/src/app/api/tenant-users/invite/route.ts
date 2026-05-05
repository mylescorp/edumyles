import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, email, firstName, lastName, role } = body as {
      sessionToken: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role: string;
    };

    if (!sessionToken || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const inviteResult = await convex.mutation(api.staffInvites.inviteStaffMember, {
      sessionToken,
      email: email.trim().toLowerCase(),
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
      role,
    });

    return NextResponse.json({
      success: true,
      emailSent: true,
      inviteId: inviteResult.staffInviteId,
      inviteToken: inviteResult.inviteToken,
    });
  } catch (error: any) {
    const message = error?.message ?? "Failed to send invitation";
    const status = message.includes("CONFLICT") ? 409 : 500;
    console.error("[tenant-users/invite] Error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
