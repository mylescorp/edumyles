import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, tenantId, email, firstName, lastName, role } = body as {
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

    return NextResponse.json({
      success: true,
      invitationId: null,
      emailSent: true,
      signUpUrl: (inviteResult as any).inviteUrl ?? null,
      tenantName: inviteResult.tenantName,
      inviteUrl: (inviteResult as any).inviteUrl ?? null,
      tenantUrl: (inviteResult as any).tenantUrl ?? null,
    });
  } catch (error: any) {
    const message = error?.message ?? "Failed to send tenant invite";
    const status = message.includes("CONFLICT") ? 409 : 500;
    console.error("[tenants/invite-admin] Error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
