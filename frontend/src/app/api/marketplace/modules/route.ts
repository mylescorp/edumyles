import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

async function getSessionCompat(convex: ConvexHttpClient, sessionToken: string, serverSecret?: string) {
  const getSessionRef = (api.sessions as any).getSession;

  if (serverSecret) {
    try {
      return await convex.query(getSessionRef, {
        sessionToken,
        serverSecret,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("extra field `serverSecret`")) {
        throw error;
      }
    }
  }

  return await convex.query(getSessionRef, { sessionToken });
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("edumyles_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    const body = await req.json();
    const action = body?.action;
    const moduleId = body?.moduleId;

    if (!moduleId || (action !== "install" && action !== "uninstall")) {
      return NextResponse.json({ error: "Invalid marketplace request" }, { status: 400 });
    }

    const convex = getConvexClient();
    const session = await getSessionCompat(
      convex,
      sessionToken,
      process.env.CONVEX_WEBHOOK_SECRET
    );

    if (!session?.tenantId) {
      return NextResponse.json({ error: "Session could not be resolved" }, { status: 401 });
    }

    const mutationRef =
      action === "install"
        ? (api.modules.marketplace.mutations as any).installModule
        : (api.modules.marketplace.mutations as any).uninstallModule;

    const result = await convex.mutation(mutationRef, {
      sessionToken,
      tenantId: session.tenantId,
      moduleId,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marketplace operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
