import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Safaricom production callback IP allowlist
const DEFAULT_MPESA_ALLOWED_IPS = [
  "196.201.214.200",
  "196.201.214.206",
  "196.201.213.114",
  "196.201.214.207",
  "196.201.214.208",
  "196.201.213.113",
  "196.201.214.209",
  "196.201.214.210",
];

function getAllowedIPs(): string[] {
  const override = process.env.MPESA_ALLOWED_IPS;
  if (override) {
    return override.split(",").map((ip) => ip.trim()).filter(Boolean);
  }
  return DEFAULT_MPESA_ALLOWED_IPS;
}

function getClientIP(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return null;
}

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

interface MpesaCallbackBody {
  Body?: {
    stkCallback?: {
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: Array<{ Name?: string; Value?: string | number }>;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  // IP allowlist verification
  const clientIP = getClientIP(req);
  const allowedIPs = getAllowedIPs();
  const isProduction = process.env.NODE_ENV === "production";

  if (clientIP && !allowedIPs.includes(clientIP)) {
    if (isProduction) {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: "Forbidden" },
        { status: 403 }
      );
    } else {
      console.warn(`[M-Pesa webhook] Warning: request from unlisted IP ${clientIP} — allowed in non-production`);
    }
  }

  try {
    const convex = getConvexClient();
    const raw = await req.json();
    const body = raw as MpesaCallbackBody;
    const stk = body.Body?.stkCallback;
    if (!stk?.CheckoutRequestID) {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: "Missing CheckoutRequestID" },
        { status: 400 }
      );
    }

    const checkoutRequestId = stk.CheckoutRequestID;
    const resultCode = stk.ResultCode != null ? Number(stk.ResultCode) : 1;
    let reference: string | undefined;
    if (stk.CallbackMetadata?.Item) {
      const receipt = stk.CallbackMetadata.Item.find((i) => i.Name === "MpesaReceiptNumber");
      reference = receipt?.Value != null ? String(receipt.Value) : undefined;
    }

    const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: "Server config error" },
        { status: 500 }
      );
    }

    await convex.action(api.modules.finance.actions.recordPaymentFromGateway, {
      webhookSecret,
      gateway: "mpesa",
      externalId: checkoutRequestId,
      resultCode,
      reference,
    });

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (e) {
    console.error("M-Pesa webhook error:", e);
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: e instanceof Error ? e.message : "Processing failed" },
      { status: 200 }
    );
  }
}
