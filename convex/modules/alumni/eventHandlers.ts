import { defineModuleEventHandler } from "../moduleRuntime";

export const onStudentGraduated = defineModuleEventHandler(
  "mod_alumni",
  "onStudentGraduated"
);
