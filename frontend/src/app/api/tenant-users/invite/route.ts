import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  buildWorkOSSignUpUrl,
  ensureTenantWorkOSOrganization,
  getWorkOSClientFromEnv,
} from "@/lib/workos-invitations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionToken,
      email,
      firstName,
      lastName,
      role,
    } = body as {
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
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
    if (!convexUrl || !serverSecret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const inviteResult = await convex.mutation(api.users.inviteTenantUser, {
      sessionToken,
      email: email.trim().toLowerCase(),
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
      role,
    });

    const { workos } = getWorkOSClientFromEnv();
    const org = await ensureTenantWorkOSOrganization({
      convex,
      tenantId: inviteResult.tenantId,
      serverSecret,
    });

    const invitation = await workos.userManagement.sendInvitation({
      email: email.trim().toLowerCase(),
      organizationId: org.workosOrgId,
      expiresInDays: 7,
    });

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
      emailSent: true,
      signUpUrl: buildWorkOSSignUpUrl(req, email.trim().toLowerCase()),
    });
  } catch (error: any) {
    const message = error?.message ?? "Failed to send invitation";
    const status = message.includes("CONFLICT") ? 409 : 500;
    console.error("[tenant-users/invite] Error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
