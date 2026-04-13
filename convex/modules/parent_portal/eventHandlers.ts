import { defineModuleEventHandler } from "../moduleRuntime";

export const onParentLinked = defineModuleEventHandler(
  "mod_parent_portal",
  "onParentLinked"
);
