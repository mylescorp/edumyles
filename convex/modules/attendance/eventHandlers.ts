import { defineModuleEventHandler } from "../moduleRuntime";

export const onStudentMarkedAbsent = defineModuleEventHandler(
  "mod_attendance",
  "onStudentMarkedAbsent"
);
