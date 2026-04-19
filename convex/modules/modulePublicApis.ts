export const MODULE_PUBLIC_APIS = {
  mod_finance: [
    "getStudentBalance",
    "getStudentInvoiceSummary",
    "getFeeStructureForClass",
    "getStudentOutstandingAmount",
  ],
  mod_attendance: [
    "getStudentAttendanceRate",
    "getClassAttendanceSummary",
    "getConsecutiveAbsences",
  ],
  mod_library: [
    "getStudentLibraryStatus",
    "getStudentBorrowingHistory",
  ],
  mod_academics: [
    "getStudentGradeSummary",
    "getStudentTermAverage",
  ],
  mod_hr: [
    "getStaffLeaveBalance",
    "getStaffOnLeaveToday",
  ],
  mod_ewallet: [
    "getStudentWalletBalance",
  ],
} as const;
