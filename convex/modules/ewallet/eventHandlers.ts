import { defineModuleEventHandler } from "../moduleRuntime";

export const onFinancePaymentReceived = defineModuleEventHandler(
  "mod_ewallet",
  "onFinancePaymentReceived"
);
