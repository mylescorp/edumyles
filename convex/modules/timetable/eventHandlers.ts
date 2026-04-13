import { defineModuleEventHandler } from "../moduleRuntime";

export const onHrLeaveApproved = defineModuleEventHandler(
  "mod_timetable",
  "onHrLeaveApproved"
);
