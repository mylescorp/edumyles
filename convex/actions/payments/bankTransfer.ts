"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";

/**
 * Generate a human-readable payment reference such as "EMB-2026-A3F7".
 */
function generateReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => chars[b % chars.length])
    .join("");
  return `EMB-${new Date().getFullYear()}-${rand}`;
}

export function buildBankTransferInstructions(args: { amount: number; reference?: string }) {
  const bankAccount = process.env.BANK_ACCOUNT_NUMBER;
  const bankName = process.env.BANK_NAME;
  const bankBranch = process.env.BANK_BRANCH;
  const bankSwift = process.env.BANK_SWIFT ?? "";

  if (!bankAccount || !bankName) {
    throw new Error(
      "Bank transfer not configured. Set BANK_ACCOUNT_NUMBER and BANK_NAME in Convex env."
    );
  }

  const reference = args.reference ?? generateReference();

  return {
    reference,
    bankDetails: {
      accountNumber: bankAccount,
      bankName,
      branch: bankBranch ?? "",
      swift: bankSwift,
    },
    amount: args.amount,
    instructions: [
      "Transfer exactly the amount shown to the bank account above.",
      `Use the reference code "${reference}" as the payment description/narration.`,
      "Your payment will be confirmed within 1-2 business days after verification.",
    ],
  };
}

/**
 * Initiate a bank transfer payment for an invoice.
 *
 * Returns the school's bank account details plus a unique payment reference
 * that the parent must include when making the transfer. A pending payment
 * record is written to the DB so the finance officer can verify it later.
 *
 * Required Convex env vars:
 *   BANK_ACCOUNT_NUMBER  — school's bank account number
 *   BANK_NAME            — bank name (e.g. "Equity Bank")
 *   BANK_BRANCH          — branch name
 *   BANK_SWIFT           — SWIFT/BIC code (optional, for international transfers)
 */
export const initiateBankTransfer = action({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args): Promise<{
    reference: string;
    bankDetails: {
      accountNumber: string;
      bankName: string;
      branch: string;
      swift: string;
    };
    amount: number;
    invoiceId: string;
    instructions: string[];
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHENTICATED");
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET ?? "";

    const session = await ctx.runQuery(api.sessions.getSession, {
      sessionToken: identity.tokenIdentifier,
      serverSecret,
    });
    if (!session) throw new Error("UNAUTHENTICATED: Session not found");

    const invoice: any = await ctx.runQuery(api.modules.finance.queries.getInvoice, {
      invoiceId: args.invoiceId,
    });
    if (!invoice || invoice.tenantId !== session.tenantId) {
      throw new Error("Invoice not found");
    }
    if (invoice.status !== "pending" && invoice.status !== "partially_paid") {
      throw new Error("Invoice is not eligible for payment");
    }

    const transfer = buildBankTransferInstructions({ amount: invoice.amount });

    // Write a pending payment record so finance officers can verify it
    await ctx.runMutation(internal.modules.finance.mutations.savePaymentCallback, {
      tenantId: session.tenantId,
      gateway: "bank_transfer",
      externalId: transfer.reference,
      invoiceId: String(args.invoiceId),
      amount: invoice.amount,
      status: "pending",
    });

    return {
      reference: transfer.reference,
      bankDetails: transfer.bankDetails,
      amount: transfer.amount,
      invoiceId: String(args.invoiceId),
      instructions: transfer.instructions,
    };
  },
});

/**
 * Verify a bank transfer manually (finance officer / admin only).
 * Marks the pending payment as completed and posts it to the student ledger.
 */
export const verifyBankTransfer = action({
  args: {
    reference: v.string(),
    invoiceId: v.id("invoices"),
    adminNote: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    reference: string;
    alreadyVerified?: boolean;
    paymentId?: string;
    invoiceStatus?: string;
    balance?: number;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHENTICATED");
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET ?? "";

    const session = await ctx.runQuery(api.sessions.getSession, {
      sessionToken: identity.tokenIdentifier,
      serverSecret,
    });
    if (!session) throw new Error("UNAUTHENTICATED: Session not found");

    // Only bursar / school_admin / principal may verify
    const allowedRoles = ["bursar", "school_admin", "principal", "master_admin", "super_admin"];
    if (!allowedRoles.includes(session.role)) {
      throw new Error("FORBIDDEN: Only finance officers may verify bank transfers");
    }

    const pendingTransfers = (await ctx.runQuery(
      api.modules.finance.queries.listPendingBankTransfers,
      { sessionToken: identity.tokenIdentifier }
    )) as Array<{
      _id: Id<"paymentCallbacks">;
      externalId: string;
      invoiceId: string;
    }>;

    const transfer = pendingTransfers.find(
      (item) => item.externalId === args.reference && item.invoiceId === String(args.invoiceId)
    );

    if (!transfer) {
      throw new Error("Pending bank transfer request not found");
    }

    const result = (await ctx.runMutation(
      api.modules.finance.mutations.verifyBankTransfer,
      {
        callbackId: transfer._id,
        sessionToken: identity.tokenIdentifier,
        adminNote: args.adminNote,
      }
    )) as {
      success: boolean;
      alreadyVerified?: boolean;
      paymentId?: string;
      invoiceStatus?: string;
      balance?: number;
    };

    return { reference: args.reference, ...result };
  },
});
