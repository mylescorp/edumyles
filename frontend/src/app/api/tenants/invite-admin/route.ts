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
      tenantId,
      email,
      firstName,
      lastName,
      role,
    } = body as {
      sessionToken: string;
      tenantId: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role:
        | "school_admin"
        | "principal"
        | "bursar"
        | "hr_manager"
        | "librarian"
        | "transport_manager"
        | "teacher";
    };

    if (!sessionToken || !tenantId || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const inviteResult = await convex.mutation(api.platform.tenants.mutations.inviteTenantAdmin, {
      sessionToken,
      tenantId,
      email: email.trim().toLowerCase(),
      firstName: firstName?.trim() || "",
      lastName: lastName?.trim() || "",
      role,
    });

    let emailSent = false;
    let invitationId: string | null = null;
    let signUpUrl: string | null = null;
    let warning: string | null = null;

    try {
      const { workos } = getWorkOSClientFromEnv();
      const org = await ensureTenantWorkOSOrganization({
        convex,
        tenantId,
        sessionToken,
      });

      const invitation = await workos.userManagement.sendInvitation({
        email: email.trim().toLowerCase(),
        organizationId: org.workosOrgId,
        expiresInDays: 7,
      });

      invitationId = invitation.id;
      emailSent = true;
      signUpUrl = buildWorkOSSignUpUrl(req, email.trim().toLowerCase());
    } catch (error: any) {
      if (error?.message?.includes("WORKOS_NOT_CONFIGURED")) {
        warning = "WorkOS is not configured yet. The invite record was created, but the email invitation was not sent.";
      } else {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      invitationId,
      emailSent,
      signUpUrl,
      tenantName: inviteResult.tenantName,
      warning,
    });
  } catch (error: any) {
    const message = error?.message ?? "Failed to send tenant invite";
    const status = message.includes("CONFLICT") ? 409 : 500;
    console.error("[tenants/invite-admin] Error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
