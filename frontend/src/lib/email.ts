import { Resend } from 'resend';

// Email template types
export interface EmailTemplate {
  fee_reminder: {
    amount: number;
    dueDate: string;
    studentName: string;
    parentName: string;
    term: string;
  };
  exam_results: {
    term: string;
    year: string;
    studentName: string;
    totalMarks: number;
    grade: string;
    position?: number;
  };
  attendance_alert: {
    studentName: string;
    date: string;
    subjects: string[];
    reason?: string;
  };
  payslip: {
    period: string;
    basicSalary: number;
    allowances: number;
    deductions: number;
    netPay: number;
    employeeName: string;
  };
  welcome_email: {
    name: string;
    role: string;
    schoolName: string;
    loginUrl: string;
  };
  password_reset: {
    name: string;
    resetUrl: string;
    expiryHours: number;
  };
  general_notification: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  };
}

// Email service class
export class EmailService {
  private resend: Resend | null = null;

  private getResendInstance(): Resend {
    if (!this.resend) {
      this.resend = new Resend(process.env.RESEND_API_KEY || '');
    }
    return this.resend;
  }

  /**
   * Send a templated email
   */
  async sendTemplatedEmail<T extends keyof EmailTemplate>(
    to: string,
    template: T,
    data: EmailTemplate[T]
  ) {
    const { subject, html } = this.generateEmailContent(template, data);
    
    return this.sendEmail({
      to,
      subject,
      html,
      from: process.env.RESEND_FROM_EMAIL || 'EduMyles <noreply@edumyles.com>',
    });
  }

  /**
   * Send a custom email
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    replyTo?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
  }) {
    try {
      const emailPayload = {
        from: options.from || process.env.RESEND_FROM_EMAIL || 'EduMyles <noreply@edumyles.com>',
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        ...(options.html ? { html: options.html } : {}),
        ...(options.text ? { text: options.text } : {}),
        ...(options.replyTo ? { replyTo: options.replyTo } : {}),
        ...(options.attachments ? { attachments: options.attachments } : {}),
      };
      const result = await this.getResendInstance().emails.send(emailPayload as any);

      return { success: true, data: result };
    } catch (error) {
      console.error('Email send error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate email content based on template
   */
  private generateEmailContent<T extends keyof EmailTemplate>(
    template: T,
    data: EmailTemplate[T]
  ): { subject: string; html: string } {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mylescorptech.com';

    switch (template) {
      case 'fee_reminder':
        return {
          subject: `Fee Payment Reminder - ${(data as EmailTemplate['fee_reminder']).studentName}`,
          html: this.generateFeeReminderEmail(data as EmailTemplate['fee_reminder']),
        };

      case 'exam_results':
        return {
          subject: `Exam Results Available - ${(data as EmailTemplate['exam_results']).term} ${(data as EmailTemplate['exam_results']).year}`,
          html: this.generateExamResultsEmail(data as EmailTemplate['exam_results']),
        };

      case 'attendance_alert':
        return {
          subject: `Attendance Alert - ${(data as EmailTemplate['attendance_alert']).studentName}`,
          html: this.generateAttendanceAlertEmail(data as EmailTemplate['attendance_alert']),
        };

      case 'payslip':
        return {
          subject: `Payslip Available - ${(data as EmailTemplate['payslip']).period}`,
          html: this.generatePayslipEmail(data as EmailTemplate['payslip']),
        };

      case 'welcome_email':
        return {
          subject: `Welcome to ${(data as EmailTemplate['welcome_email']).schoolName}`,
          html: this.generateWelcomeEmail(data as EmailTemplate['welcome_email']),
        };

      case 'password_reset':
        return {
          subject: 'Password Reset Request',
          html: this.generatePasswordResetEmail(data as EmailTemplate['password_reset']),
        };

      case 'general_notification':
        return {
          subject: (data as EmailTemplate['general_notification']).title,
          html: this.generateGeneralNotificationEmail(data as EmailTemplate['general_notification']),
        };

      default:
        throw new Error(`Unknown email template: ${template}`);
    }
  }

  private generateFeeReminderEmail(data: EmailTemplate['fee_reminder']): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fee Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #0f766e; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #0f766e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Fee Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${data.parentName},</p>
            <p>This is a friendly reminder that the school fee payment for <strong>${data.studentName}</strong> for <strong>${data.term}</strong> is due on <strong>${data.dueDate}</strong>.</p>
            <p><strong>Amount Due:</strong> <span class="amount">KES ${data.amount.toLocaleString()}</span></p>
            <p>Please ensure payment is made on time to avoid any inconvenience. You can pay through:</p>
            <ul>
              <li>M-Pesa Paybill</li>
              <li>Bank Transfer</li>
              <li>Cash at the school office</li>
            </ul>
            <a href="#" class="button">Pay Now</a>
            <p>If you have already made the payment, please disregard this notice.</p>
            <p>Thank you for your cooperation.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EduMyles School Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateExamResultsEmail(data: EmailTemplate['exam_results']): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Exam Results Available</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #0f766e; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .results { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .result-item { display: flex; justify-content: space-between; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Exam Results Available</h1>
          </div>
          <div class="content">
            <p>Dear Parent,</p>
            <p>We are pleased to inform you that the exam results for <strong>${data.studentName}</strong> for <strong>${data.term} ${data.year}</strong> are now available.</p>
            
            <div class="results">
              <h3>Summary</h3>
              <div class="result-item">
                <span>Total Marks:</span>
                <strong>${data.totalMarks}</strong>
              </div>
              <div class="result-item">
                <span>Grade:</span>
                <strong>${data.grade}</strong>
              </div>
              ${data.position ? `
              <div class="result-item">
                <span>Position:</span>
                <strong>${data.position}</strong>
              </div>
              ` : ''}
            </div>
            
            <p>Please log in to the parent portal to view the detailed results and subject-wise performance.</p>
            <a href="#" class="button">View Results</a>
            <p>Congratulations to your child on their achievements!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EduMyles School Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateAttendanceAlertEmail(data: EmailTemplate['attendance_alert']): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Attendance Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Attendance Alert</h1>
          </div>
          <div class="content">
            <p>Dear Parent,</p>
            <div class="alert">
              <strong>⚠️ Attendance Notice</strong><br>
              We noticed that <strong>${data.studentName}</strong> was marked absent on <strong>${data.date}</strong>.
            </div>
            
            ${data.subjects.length > 0 ? `
            <p><strong>Subjects Missed:</strong></p>
            <ul>
              ${data.subjects.map(subject => `<li>${subject}</li>`).join('')}
            </ul>
            ` : ''}
            
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            
            <p>Please contact the school immediately if this is an error or if you need to provide an explanation for the absence.</p>
            <p>Regular attendance is crucial for your child's academic progress.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EduMyles School Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePayslipEmail(data: EmailTemplate['payslip']): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payslip Available</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #0f766e; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .payslip { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .amount { font-size: 18px; font-weight: bold; color: #0f766e; }
          .net-pay { font-size: 24px; font-weight: bold; color: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payslip Available</h1>
          </div>
          <div class="content">
            <p>Dear ${data.employeeName},</p>
            <p>Your payslip for <strong>${data.period}</strong> is now available for download.</p>
            
            <div class="payslip">
              <h3>Payment Summary</h3>
              <div class="amount">Basic Salary: KES ${data.basicSalary.toLocaleString()}</div>
              <div class="amount">Allowances: KES ${data.allowances.toLocaleString()}</div>
              <div class="amount">Deductions: KES ${data.deductions.toLocaleString()}</div>
              <hr style="margin: 15px 0;">
              <div class="net-pay">Net Pay: KES ${data.netPay.toLocaleString()}</div>
            </div>
            
            <p>Please log in to the staff portal to view and download your detailed payslip.</p>
            <a href="#" class="button">View Payslip</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EduMyles School Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmail(data: EmailTemplate['welcome_email']): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${data.schoolName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #0f766e; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${data.schoolName}</h1>
          </div>
          <div class="content">
            <p>Dear ${data.name},</p>
            <p>Welcome aboard! We are excited to have you join our team as <strong>${data.role}</strong>.</p>
            <p>Your account has been created and you can now access the EduMyles School Management System.</p>
            <p>To get started, please log in using your credentials and update your profile information.</p>
            <a href="${data.loginUrl}" class="button">Login Now</a>
            <p>If you have any questions or need assistance, please don't hesitate to contact the IT department.</p>
            <p>We look forward to working with you!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EduMyles School Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetEmail(data: EmailTemplate['password_reset']): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Dear ${data.name},</p>
            <div class="alert">
              <strong>⚠️ Security Notice</strong><br>
              A password reset was requested for your account. If you didn't request this, please contact support immediately.
            </div>
            
            <p>To reset your password, click the button below:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link will expire in ${data.expiryHours} hours</li>
              <li>Do not share this link with anyone</li>
              <li>Make sure to choose a strong password</li>
            </ul>
            
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EduMyles School Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateGeneralNotificationEmail(data: EmailTemplate['general_notification']): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #0f766e; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.title}</h1>
          </div>
          <div class="content">
            <p>${data.message}</p>
            ${data.actionUrl && data.actionText ? `
            <a href="${data.actionUrl}" class="button">${data.actionText}</a>
            ` : ''}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EduMyles School Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Singleton instance
export const emailService = new EmailService();

// Helper functions for common email operations
export const emailHelpers = {
  sendFeeReminder: (to: string, data: EmailTemplate['fee_reminder']) =>
    emailService.sendTemplatedEmail(to, 'fee_reminder' as const, data),

  sendExamResults: (to: string, data: EmailTemplate['exam_results']) =>
    emailService.sendTemplatedEmail(to, 'exam_results' as const, data),

  sendAttendanceAlert: (to: string, data: EmailTemplate['attendance_alert']) =>
    emailService.sendTemplatedEmail(to, 'attendance_alert' as const, data),

  sendPayslip: (to: string, data: EmailTemplate['payslip']) =>
    emailService.sendTemplatedEmail(to, 'payslip' as const, data),

  sendWelcomeEmail: (to: string, data: EmailTemplate['welcome_email']) =>
    emailService.sendTemplatedEmail(to, 'welcome_email' as const, data),

  sendPasswordReset: (to: string, data: EmailTemplate['password_reset']) =>
    emailService.sendTemplatedEmail(to, 'password_reset' as const, data),

  sendGeneralNotification: (to: string, data: EmailTemplate['general_notification']) =>
    emailService.sendTemplatedEmail(to, 'general_notification' as const, data),
};
