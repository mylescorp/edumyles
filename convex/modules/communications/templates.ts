import { v } from "convex/values";

// Template types for different communication channels
export type TemplateType = 
  | "fee_reminder"
  | "payment_confirmation" 
  | "assignment_due"
  | "grade_posted"
  | "attendance_alert"
  | "announcement"
  | "exam_schedule"
  | "school_closure"
  | "parent_meeting"
  | "library_overdue";

export interface SMSTemplate {
  id: string;
  type: TemplateType;
  tenantId: string;
  name: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EmailTemplate {
  id: string;
  type: TemplateType;
  tenantId: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Default SMS templates
export const DEFAULT_SMS_TEMPLATES: Record<TemplateType, Omit<SMSTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>> = {
  fee_reminder: {
    type: "fee_reminder",
    name: "Fee Payment Reminder",
    content: "Dear {{parentName}}, this is a reminder that fee payment of {{amount}} {{currency}} for {{studentName}} ({{admissionNumber}}) is due by {{dueDate}}. Please pay via M-Pesa, Airtel Money, or card. Thank you - {{schoolName}}",
    variables: ["parentName", "amount", "currency", "studentName", "admissionNumber", "dueDate", "schoolName"],
    isActive: true,
  },
  payment_confirmation: {
    type: "payment_confirmation",
    name: "Payment Confirmation",
    content: "Payment of {{amount}} {{currency}} received for {{studentName}} ({{admissionNumber}}). Receipt: {{receiptNumber}}. Thank you - {{schoolName}}",
    variables: ["amount", "currency", "studentName", "admissionNumber", "receiptNumber", "schoolName"],
    isActive: true,
  },
  assignment_due: {
    type: "assignment_due",
    name: "Assignment Due Reminder",
    content: "Reminder: {{assignmentTitle}} for {{subject}} is due on {{dueDate}}. Please submit on time. - {{schoolName}}",
    variables: ["assignmentTitle", "subject", "dueDate", "schoolName"],
    isActive: true,
  },
  grade_posted: {
    type: "grade_posted",
    name: "Grade Posted",
    content: "Grades for {{term}} {{academicYear}} have been posted. {{studentName}} scored {{grade}} in {{subject}}. Login to view full report. - {{schoolName}}",
    variables: ["term", "academicYear", "studentName", "grade", "subject", "schoolName"],
    isActive: true,
  },
  attendance_alert: {
    type: "attendance_alert",
    content: "{{studentName}} was absent from {{className}} on {{date}}. Please contact the school if this is incorrect. - {{schoolName}}",
    name: "Attendance Alert",
    variables: ["studentName", "className", "date", "schoolName"],
    isActive: true,
  },
  announcement: {
    type: "announcement",
    name: "School Announcement",
    content: "{{title}} - {{message}}. For more details, visit the school portal. - {{schoolName}}",
    variables: ["title", "message", "schoolName"],
    isActive: true,
  },
  exam_schedule: {
    type: "exam_schedule",
    name: "Exam Schedule",
    content: "{{examName}} exams start on {{startDate}}. {{studentName}} should report to {{venue}} by {{reportTime}}. Bring required materials. - {{schoolName}}",
    variables: ["examName", "startDate", "studentName", "venue", "reportTime", "schoolName"],
    isActive: true,
  },
  school_closure: {
    type: "school_closure",
    name: "School Closure",
    content: "School will be closed from {{startDate}} to {{endDate}} for {{reason}}. Classes resume on {{resumeDate}}. - {{schoolName}}",
    variables: ["startDate", "endDate", "reason", "resumeDate", "schoolName"],
    isActive: true,
  },
  parent_meeting: {
    type: "parent_meeting",
    name: "Parent Meeting",
    content: "Parent meeting scheduled for {{date}} at {{time}} in {{venue}}. Topic: {{topic}}. {{studentName}}'s attendance required. - {{schoolName}}",
    variables: ["date", "time", "venue", "topic", "studentName", "schoolName"],
    isActive: true,
  },
  library_overdue: {
    type: "library_overdue",
    name: "Library Book Overdue",
    content: "{{bookTitle}} borrowed by {{studentName}} is overdue. Return by {{returnDate}} to avoid fine of {{fineAmount}} {{currency}}. - {{schoolName}}",
    variables: ["bookTitle", "studentName", "returnDate", "fineAmount", "currency", "schoolName"],
    isActive: true,
  },
};

// Template variable substitution function
export function substituteTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
  }
  
  return result;
}

// Validate template variables
export function validateTemplateVariables(
  template: string,
  requiredVariables: string[]
): { isValid: boolean; missingVariables: string[] } {
  const templateVariableRegex = /\{\{(\w+)\}\}/g;
  const foundVariables: string[] = [];
  let match;
  
  while ((match = templateVariableRegex.exec(template)) !== null) {
    foundVariables.push(match[1]);
  }
  
  const missingVariables = requiredVariables.filter(
    variable => !foundVariables.includes(variable)
  );
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables
  };
}
