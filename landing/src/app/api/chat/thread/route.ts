import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { getLandingConvexClient } from "@/lib/server/convex";

const threadQuerySchema = z.object({
  engagementId: z.string().min(1),
  visitorToken: z.string().min(12),
});

const visitorMessageSchema = z.object({
  engagementId: z.string().min(1),
  visitorToken: z.string().min(12),
  message: z.string().min(1).max(2000),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = threadQuerySchema.safeParse({
    engagementId: url.searchParams.get("engagementId"),
    visitorToken: url.searchParams.get("visitorToken"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat reference." }, { status: 400 });
  }

  try {
    const convex = getLandingConvexClient();
    const thread = await convex.query(api.publicEngagements.getVisitorChatThread, {
      engagementId: parsed.data.engagementId as Id<"landingEngagements">,
      visitorToken: parsed.data.visitorToken,
    });
    return NextResponse.json({ success: true, thread });
  } catch (error) {
    console.error("Chat thread fetch error:", error);
    return NextResponse.json({ error: "Unable to load chat thread." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const parsed = visitorMessageSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message." },
      { status: 400 }
    );
  }

  try {
    const convex = getLandingConvexClient();
    const result = await convex.mutation(api.publicEngagements.sendVisitorChatMessage, {
      engagementId: parsed.data.engagementId as Id<"landingEngagements">,
      visitorToken: parsed.data.visitorToken,
      message: parsed.data.message,
    });
    return NextResponse.json({ success: true, thread: result });
  } catch (error) {
    console.error("Visitor chat send error:", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
