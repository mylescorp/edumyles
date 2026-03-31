/**
 * GET /api/auth/wid
 *
 * Reads the httpOnly `edumyles_wid` cookie (set by the auth callback for
 * users placed on the waitlist) and returns the WorkOS user ID so the
 * client-side /auth/pending page can poll the waitlist status.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const wid = req.cookies.get("edumyles_wid")?.value ?? null;
  return NextResponse.json({ workosUserId: wid });
}
