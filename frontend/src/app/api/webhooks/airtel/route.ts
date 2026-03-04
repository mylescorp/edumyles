import { NextRequest, NextResponse } from "next/server";

/**
 * Airtel Money callback placeholder.
 * Wire when Airtel integration is configured (env + Convex recordPaymentFromGateway for gateway "airtel").
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  console.info("Airtel webhook received", Object.keys(body));
  return NextResponse.json({ received: true });
}
