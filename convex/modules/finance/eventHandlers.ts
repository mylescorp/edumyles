import { defineModuleEventHandler } from "../moduleRuntime";

export const onStudentEnrolled = defineModuleEventHandler(
  "mod_finance",
  "onStudentEnrolled"
);
export const onLibraryBookOverdue = defineModuleEventHandler(
  "mod_finance",
  "onLibraryBookOverdue"
);
