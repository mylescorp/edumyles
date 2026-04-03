import { describe, expect, it } from "vitest";
import {
  buildLedgerDescription,
  getCompletedPaymentAmount,
  getInvoiceBalance,
  getInvoiceStatusFromPayments,
  resolveFinanceCurrency,
} from "../../../convex/modules/finance/paymentUtils";

describe("payment allocation utilities", () => {
  it("counts only completed and success payments toward invoice allocation", () => {
    expect(
      getCompletedPaymentAmount([
        { amount: 400, status: "completed" },
        { amount: 250, status: "success" },
        { amount: 999, status: "pending" },
      ])
    ).toBe(650);
  });

  it("derives partial and paid invoice states from completed allocation only", () => {
    expect(getInvoiceStatusFromPayments(1000, 0)).toBe("pending");
    expect(getInvoiceStatusFromPayments(1000, 600)).toBe("partially_paid");
    expect(getInvoiceStatusFromPayments(1000, 1000)).toBe("paid");
  });

  it("never returns a negative invoice balance", () => {
    expect(getInvoiceBalance(1000, 1200)).toBe(0);
  });

  it("falls back to KES when invoice currency is missing", () => {
    expect(resolveFinanceCurrency(undefined)).toBe("KES");
    expect(resolveFinanceCurrency({ currency: "UGX" })).toBe("UGX");
  });

  it("builds a ledger description from gateway metadata", () => {
    expect(
      buildLedgerDescription({
        method: "mpesa",
        reference: "ABC123",
        invoiceId: "invoice-1",
      })
    ).toContain("ABC123");
  });
});
