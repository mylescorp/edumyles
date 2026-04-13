import { defineModuleEventHandler } from "../moduleRuntime";

export const onPartnerRequestReceived = defineModuleEventHandler(
  "mod_partner",
  "onPartnerRequestReceived"
);
