export type FinancePaymentRecord = {
  _id?: string;
  status?: string;
  amount: number;
  invoiceId?: string | null;
};

export function getCompletedPaymentAmount(payments: FinancePaymentRecord[]): number {
  return payments
    .filter((payment) => payment.status === "completed" || payment.status === "success")
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function getInvoiceBalance(invoiceAmount: number, completedAmount: number): number {
  return Math.max(invoiceAmount - completedAmount, 0);
}

export function getInvoiceStatusFromPayments(invoiceAmount: number, completedAmount: number) {
  if (completedAmount >= invoiceAmount) return "paid";
  if (completedAmount > 0) return "partially_paid";
  return "pending";
}

export function resolveFinanceCurrency(
  invoice: { currency?: string | null } | null | undefined,
  fallback = "KES"
) {
  return invoice?.currency?.trim() || fallback;
}

export function buildLedgerDescription(args: {
  method: string;
  reference: string;
  invoiceId: string;
}) {
  return `Payment via ${args.method} (${args.reference}) for invoice ${args.invoiceId}`;
}
