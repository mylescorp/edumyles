"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { WorkOS } from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export const sendInviteEmail = action({
  args: {
    to: v.string(),
    token: v.string(),
    roleName: v.string(),
    inviterName: v.string(),
    personalMessage: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    try {
      // Create the invite URL
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/platform/invite/accept?token=${args.token}`;

      // Create email content
      const emailContent = {
        subject: `You've been invited to join EduMyles Platform`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Platform Invitation</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
              }
              .container {
                background-color: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #059669, #84cc16);
                border-radius: 12px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 20px;
                margin-bottom: 16px;
              }
              .title {
                color: #1e293b;
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 8px;
              }
              .subtitle {
                color: #64748b;
                font-size: 16px;
                margin-bottom: 30px;
              }
              .role-badge {
                display: inline-block;
                background: linear-gradient(135deg, #059669, #84cc16);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 500;
                margin-bottom: 30px;
              }
              .personal-message {
                background-color: #f1f5f9;
                border-left: 4px solid #059669;
                padding: 16px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
                font-style: italic;
                color: #475569;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #059669, #84cc16);
                color: white;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: 600;
                text-align: center;
                margin: 30px 0;
                transition: all 0.2s;
              }
              .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(5, 150, 105, 0.3);
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                color: #94a3b8;
                font-size: 14px;
              }
              .permissions {
                background-color: #f8fafc;
                padding: 16px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .permissions h4 {
                margin: 0 0 12px 0;
                color: #1e293b;
                font-size: 14px;
                font-weight: 600;
              }
              .permission-list {
                list-style: none;
                padding: 0;
                margin: 0;
              }
              .permission-list li {
                padding: 4px 0;
                color: #64748b;
                font-size: 13px;
              }
              .permission-list li:before {
                content: "· ";
                color: #059669;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">EM</div>
                <h1 class="title">You're Invited!</h1>
                <p class="subtitle">Join the EduMyles Platform team</p>
              </div>

              <p>Hello,</p>
              
              <p>You've been invited to join the EduMyles Platform as a <strong class="role-badge">${args.roleName}</strong>.</p>
              
              ${args.personalMessage ? `
                <div class="personal-message">
                  "${args.personalMessage}"
                </div>
              ` : ''}

              <p>As a ${args.roleName}, you'll have access to powerful tools for managing educational institutions and helping schools succeed with our platform.</p>

              ${args.permissions.length > 0 ? `
                <div class="permissions">
                  <h4>Your permissions include:</h4>
                  <ul class="permission-list">
                    ${args.permissions.slice(0, 5).map((permission: any) => `<li>${permission.replace(/\./g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase())}</li>`).join('')}
                    ${args.permissions.length > 5 ? `<li>... and ${args.permissions.length - 5} more permissions</li>` : ''}
                  </ul>
                </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>

              <p>This invitation will expire in 7 days. If you need help or have questions, please don't hesitate to reach out to our support team.</p>

              <div class="footer">
                <p>This invitation was sent by ${args.inviterName}</p>
                <p>© 2024 EduMyles Platform. All rights reserved.</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          You're invited to join EduMyles Platform!
          
          Role: ${args.roleName}
          Invited by: ${args.inviterName}
          
          ${args.personalMessage ? `\nPersonal message: "${args.personalMessage}"\n` : ''}
          
          Accept your invitation: ${inviteUrl}
          
          This invitation expires in 7 days.
          
          © 2024 EduMyles Platform. All rights reserved.
        `,
      };

      // For now, we'll use a simple email sending approach
      // In production, you would integrate with WorkOS email service or another provider
      console.log(`Invite email prepared for ${args.to} with token ${args.token}`);
      console.log(`Email content length: ${emailContent.html.length} characters`);
      
      // TODO: Implement actual email sending with WorkOS or another provider
      // For now, we'll just log that the email would be sent
      console.log(`Email would be sent to: ${args.to}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Invite URL: ${inviteUrl}`);
      
    } catch (error) {
      console.error("Failed to prepare invite email:", error);
      // Don't throw the error - the invite was created successfully
      // Just log it and continue
    }
  },
});
