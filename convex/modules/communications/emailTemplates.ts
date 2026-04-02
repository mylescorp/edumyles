import { TemplateType, substituteTemplateVariables } from "./templates";

// Email HTML templates using React Email style
export const EMAIL_TEMPLATES = {
  fee_reminder: {
    subject: "Fee Payment Reminder - {{schoolName}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fee Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .fee-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .payment-methods { margin: 20px 0; }
          .payment-method { display: inline-block; margin: 10px 10px 10px 0; padding: 10px 20px; background: #e0e7ff; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
          .due-date { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{schoolName}}</h1>
            <h2>Fee Payment Reminder</h2>
          </div>
          <div class="content">
            <p>Dear {{parentName}},</p>
            <p>This is a friendly reminder that fee payment for your child is due soon.</p>
            
            <div class="fee-details">
              <h3>Fee Details</h3>
              <p><strong>Student:</strong> {{studentName}} ({{admissionNumber}})</p>
              <p><strong>Amount Due:</strong> <span class="amount">{{amount}} {{currency}}</span></p>
              <p><strong>Due Date:</strong> <span class="due-date">{{dueDate}}</span></p>
              <p><strong>Academic Year:</strong> {{academicYear}}</p>
            </div>
            
            <div class="payment-methods">
              <h3>Payment Methods</h3>
              <div class="payment-method">M-Pesa</div>
              <div class="payment-method">Airtel Money</div>
              <div class="payment-method">Credit/Debit Card</div>
              <div class="payment-method">Bank Transfer</div>
            </div>
            
            <p>To make a payment, please log in to your parent portal or visit the school office.</p>
            <p>If you have already made this payment, please disregard this reminder.</p>
            
            <div class="footer">
              <p>Thank you for choosing {{schoolName}}</p>
              <p>If you have any questions, please contact the finance office.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Fee Payment Reminder - {{schoolName}}

Dear {{parentName}},

This is a reminder that fee payment for {{studentName}} ({{admissionNumber}}) is due.

Amount: {{amount}} {{currency}}
Due Date: {{dueDate}}
Academic Year: {{academicYear}}

Payment Methods:
- M-Pesa
- Airtel Money  
- Credit/Debit Card
- Bank Transfer

Please log in to your parent portal to make a payment or visit the school office.

Thank you,
{{schoolName}}
    `
  },
  
  payment_confirmation: {
    subject: "Payment Confirmation - {{schoolName}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
          .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .amount { font-size: 24px; font-weight: bold; color: #16a34a; }
          .receipt-number { background: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{schoolName}}</h1>
            <h2>Payment Confirmation</h2>
          </div>
          <div class="content">
            <p>Dear {{parentName}},</p>
            <p>We have successfully received your payment. Thank you!</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Student:</strong> {{studentName}} ({{admissionNumber}})</p>
              <p><strong>Amount Paid:</strong> <span class="amount">{{amount}} {{currency}}</span></p>
              <p><strong>Payment Date:</strong> {{paymentDate}}</p>
              <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
              <p><strong>Receipt Number:</strong> <span class="receipt-number">{{receiptNumber}}</span></p>
            </div>
            
            <p>You can download the full receipt from your parent portal.</p>
            <p>Please keep this receipt for your records.</p>
            
            <div class="footer">
              <p>Thank you for your prompt payment!</p>
              <p>{{schoolName}}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Payment Confirmation - {{schoolName}}

Dear {{parentName}},

We have successfully received your payment. Thank you!

Payment Details:
Student: {{studentName}} ({{admissionNumber}})
Amount Paid: {{amount}} {{currency}}
Payment Date: {{paymentDate}}
Payment Method: {{paymentMethod}}
Receipt Number: {{receiptNumber}}

You can download the full receipt from your parent portal.

Thank you for your prompt payment!
{{schoolName}}
    `
  },

  assignment_due: {
    subject: "Assignment Due - {{assignmentTitle}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Assignment Due Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff7ed; padding: 30px; border-radius: 0 0 8px 8px; }
          .assignment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .due-date { color: #dc2626; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{schoolName}}</h1>
            <h2>Assignment Due Reminder</h2>
          </div>
          <div class="content">
            <p>Dear {{studentName}},</p>
            <p>This is a reminder that you have an assignment due soon.</p>
            
            <div class="assignment-details">
              <h3>Assignment Details</h3>
              <p><strong>Title:</strong> {{assignmentTitle}}</p>
              <p><strong>Subject:</strong> {{subject}}</p>
              <p><strong>Teacher:</strong> {{teacherName}}</p>
              <p><strong>Due Date:</strong> <span class="due-date">{{dueDate}}</span></p>
              <p><strong>Time Remaining:</strong> {{timeRemaining}}</p>
            </div>
            
            <p>Please ensure you submit your assignment on time. Late submissions may receive grade penalties.</p>
            <p>If you need help or have questions, please contact {{teacherName}}.</p>
            
            <div class="footer">
              <p>Good luck with your assignment!</p>
              <p>{{schoolName}}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Assignment Due Reminder - {{schoolName}}

Dear {{studentName}},

This is a reminder that you have an assignment due soon.

Assignment Details:
Title: {{assignmentTitle}}
Subject: {{subject}}
Teacher: {{teacherName}}
Due Date: {{dueDate}}
Time Remaining: {{timeRemaining}}

Please ensure you submit your assignment on time. Late submissions may receive grade penalties.

If you need help or have questions, please contact {{teacherName}}.

Good luck with your assignment!
{{schoolName}}
    `
  },

  grade_posted: {
    subject: "Grades Posted - {{term}} {{academicYear}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Grades Posted</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #faf5ff; padding: 30px; border-radius: 0 0 8px 8px; }
          .grade-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .grade { font-size: 24px; font-weight: bold; color: #7c3aed; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{schoolName}}</h1>
            <h2>Grades Posted</h2>
          </div>
          <div class="content">
            <p>Dear {{parentName}},</p>
            <p>Grades for {{term}} {{academicYear}} have been posted and are now available for viewing.</p>
            
            <div class="grade-details">
              <h3>Academic Performance</h3>
              <p><strong>Student:</strong> {{studentName}} ({{admissionNumber}})</p>
              <p><strong>Class:</strong> {{className}}</p>
              <p><strong>Term:</strong> {{term}} {{academicYear}}</p>
              <p><strong>Overall Grade:</strong> <span class="grade">{{overallGrade}}</span></p>
              <p><strong>Position in Class:</strong> {{classPosition}}/{{totalStudents}}</p>
            </div>
            
            <p>To view the complete grade report with detailed subject-wise performance, please log in to your parent portal.</p>
            <p>If you have any concerns about the grades or would like to discuss your child's performance, please feel free to contact the class teacher or school administration.</p>
            
            <div class="footer">
              <p>Congratulations to {{studentName}} on their academic performance!</p>
              <p>{{schoolName}}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Grades Posted - {{schoolName}}

Dear {{parentName}},

Grades for {{term}} {{academicYear}} have been posted and are now available for viewing.

Academic Performance:
Student: {{studentName}} ({{admissionNumber}})
Class: {{className}}
Term: {{term}} {{academicYear}}
Overall Grade: {{overallGrade}}
Position in Class: {{classPosition}}/{{totalStudents}}

To view the complete grade report with detailed subject-wise performance, please log in to your parent portal.

If you have any concerns about the grades or would like to discuss your child's performance, please feel free to contact the class teacher or school administration.

Congratulations to {{studentName}} on their academic performance!
{{schoolName}}
    `
  }
};
