import { defineModuleEventHandler } from "../moduleRuntime";

export const onApplicationAccepted = defineModuleEventHandler(
  "mod_admissions",
  "onApplicationAccepted"
);
