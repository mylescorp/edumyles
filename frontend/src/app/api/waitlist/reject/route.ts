/**
 * POST /api/waitlist/reject
 *
 * Rejects a waitlist application.
 *
 * Body:
 *  {
 *    sessionToken: string,
 *    applicationId: string,   // Convex waitlistApplications _id
 *    reviewNotes?: string,
 *  }
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, applicationId, reviewNotes } = body as {
      sessionToken: string;
      applicationId: string;
      reviewNotes?: string;
    };

    if (!sessionToken || !applicationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);

    await convex.mutation(api.waitlist.rejectWaitlistApplication, {
      sessionToken,
      applicationId: applicationId as Id<"waitlistApplications">,
      reviewNotes,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[waitlist/reject] Error:", err);
    const message = err?.message ?? "Internal server error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
