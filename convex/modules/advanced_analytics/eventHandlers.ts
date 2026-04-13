import { defineModuleEventHandler } from "../moduleRuntime";

export const onInsightGenerated = defineModuleEventHandler(
  "mod_advanced_analytics",
  "onInsightGenerated"
);
