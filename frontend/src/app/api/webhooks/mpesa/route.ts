import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

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
  try {
    const raw = await req.json();
    const body = raw as MpesaCallbackBody;
    const stk = body.Body?.stkCallback;
    if (!stk?.CheckoutRequestID) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Missing CheckoutRequestID" }, { status: 400 });
    }

    const checkoutRequestId = stk.CheckoutRequestID;
    const resultCode = Number(stk.ResultCode) ?? 1;
    let reference: string | undefined;
    if (stk.CallbackMetadata?.Item) {
      const receipt = stk.CallbackMetadata.Item.find((i) => i.Name === "MpesaReceiptNumber");
      reference = receipt?.Value != null ? String(receipt.Value) : undefined;
    }

    const webhookSecret = process.env.CONVEX_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Server config error" }, { status: 500 });
    }

    await convex.mutation(api.modules.finance.mutations.recordPaymentFromGateway, {
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
