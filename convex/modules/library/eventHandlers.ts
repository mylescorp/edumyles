import { defineModuleEventHandler } from "../moduleRuntime";

export const onFinanceInvoiceOverdue = defineModuleEventHandler(
  "mod_library",
  "onFinanceInvoiceOverdue"
);
export const onFinancePaymentReceived = defineModuleEventHandler(
  "mod_library",
  "onFinancePaymentReceived"
);
