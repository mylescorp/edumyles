import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { canAccessDevPanel, normalizeDevRole } from "@/lib/dev/access";
import type { DevAuditEntry } from "@/lib/dev/types";
import { buildDevSystemMap } from "@/lib/dev/systemMap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }

  return new ConvexHttpClient(convexUrl);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("edumyles_session")?.value ?? null;
    const role = normalizeDevRole(cookieStore.get("edumyles_role")?.value ?? null);

    if (!sessionToken || !canAccessDevPanel(role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const payload = await buildDevSystemMap();

    try {
      const convex = getConvexClient();
      const runtimeActivity = (await convex.query((api.platform.tenants.queries as any).getRecentActivity, {
        sessionToken,
        limit: 30,
      })) as Array<{
        _id?: string;
        action?: string;
        entityType?: string;
        entityId?: string;
        actorEmail?: string;
        tenantName?: string;
        timestamp?: number;
      }>;

      const runtimeEntries: DevAuditEntry[] = Array.isArray(runtimeActivity)
        ? runtimeActivity.map((entry, index) => ({
            id: `runtime:${String(entry._id ?? index)}`,
            title: String(entry.action ?? "platform.activity"),
            scope: "system",
            category: "runtime",
            timestamp: new Date(entry.timestamp ?? Date.now()).toISOString(),
            summary: `${entry.entityType ?? "entity"} • ${entry.entityId ?? "unknown"} • ${entry.tenantName ?? "Unknown tenant"}`,
            tenantName: entry.tenantName ? String(entry.tenantName) : undefined,
            actorEmail: entry.actorEmail ? String(entry.actorEmail) : undefined,
          }))
        : [];

      payload.auditTrail = [...runtimeEntries, ...payload.auditTrail]
        .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
        .slice(0, 120);
    } catch (runtimeAuditError) {
      console.warn("[api/dev/system-map] Failed to load runtime audit activity", runtimeAuditError);
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[api/dev/system-map] Failed to build system map", error);
    return NextResponse.json(
      {
        error: "Failed to build developer system map",
      },
      { status: 500 }
    );
  }
}
