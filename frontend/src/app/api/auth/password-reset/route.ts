import { NextRequest, NextResponse } from "next/server";
import { getWorkOSClientFromEnv } from "@/lib/workos-invitations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { workos } = getWorkOSClientFromEnv();
    const reset = await workos.userManagement.createPasswordReset({ email });

    return NextResponse.json({
      success: true,
      id: reset.id,
      message: "Password reset email sent if the account exists.",
    });
  } catch (error: any) {
    console.error("[auth/password-reset] Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to send password reset" },
      { status: 500 }
    );
  }
}
