import { NextRequest, NextResponse } from "next/server";

/**
 * WorkOS webhook placeholder (user sync, etc.).
 * Verify signature and process events when needed.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  console.info("WorkOS webhook received", body.type ?? Object.keys(body));
  return NextResponse.json({ received: true });
}
