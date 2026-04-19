import { defineModuleEventHandler } from "../moduleRuntime";

export const onAttendanceStudentAbsent = defineModuleEventHandler(
  "mod_communications",
  "onAttendanceStudentAbsent"
);
export const onAttendanceStudentConsecutive = defineModuleEventHandler(
  "mod_communications",
  "onAttendanceStudentConsecutive"
);
export const onAcademicsGradePosted = defineModuleEventHandler(
  "mod_communications",
  "onAcademicsGradePosted"
);
export const onAcademicsExamResultsPublished = defineModuleEventHandler(
  "mod_communications",
  "onAcademicsExamResultsPublished"
);
export const onFinanceInvoiceCreated = defineModuleEventHandler(
  "mod_communications",
  "onFinanceInvoiceCreated"
);
export const onFinanceInvoiceOverdue = defineModuleEventHandler(
  "mod_communications",
  "onFinanceInvoiceOverdue"
);
export const onFinancePaymentReceived = defineModuleEventHandler(
  "mod_communications",
  "onFinancePaymentReceived"
);
