import { NextRequest, NextResponse } from "next/server";
import { getVerifiedSession } from "@/lib/server/impersonation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get("edumyles_session")?.value;
  const isImpersonating = request.cookies.get("edumyles_impersonating")?.value === "true";

  if (!sessionToken || !isImpersonating) {
    return NextResponse.json({ success: true, active: false });
  }

  try {
    const session = await getVerifiedSession(sessionToken);

    return NextResponse.json({
      success: true,
      active: Boolean(session?.impersonatedBy),
    });
  } catch (error) {
    console.error("[api/impersonation/status] Session verification failed", error);
    return NextResponse.json({ success: true, active: false });
  }
}
