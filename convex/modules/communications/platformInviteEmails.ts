import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { requirePlatformSession } from "../../helpers/platformGuard";

// Platform invite email templates
export interface PlatformInviteEmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

const PLATFORM_INVITE_TEMPLATES: Record<string, PlatformInviteEmailTemplate> = {
  // New user invitation (needs account creation)
  new_user: {
    subject: "You're invited to join EduMyles Platform",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Platform Invitation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .role-badge { background: #e0f2fe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">EduMyles Platform</div>
            <div>You're invited to join our team!</div>
          </div>
          
          <div class="content">
            <p>Hi {{firstName}},</p>
            
            <p>You've been invited to join the EduMyles platform as a <strong>{{roleName}}</strong>.</p>
            
            <div class="role-badge">{{roleName}}</div>
            
            <p><strong>What you'll have access to:</strong></p>
            <ul>
              <li>Platform administration and management tools</li>
              <li>{{department}} department functions</li>
              <li>Collaboration with the platform team</li>
            </ul>
            
            <p><strong>Department:</strong> {{department}}</p>
            <p><strong>Invited by:</strong> {{invitedByName}} ({{invitedByEmail}})</p>
            
            <p style="margin: 30px 0;">
              <a href="{{inviteUrl}}" class="button">Accept Invitation</a>
            </p>
            
            <p><em>This invitation expires in 72 hours.</em></p>
          </div>
          
          <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>For questions, contact the platform administrator at {{invitedByEmail}}.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      EduMyles Platform Invitation
      
      Hi {{firstName}},
      
      You've been invited to join the EduMyles platform as a {{roleName}}.
      
      Department: {{department}}
      Invited by: {{invitedByName}} ({{invitedByEmail}})
      
      What you'll have access to:
      - Platform administration and management tools
      - {{department}} department functions
      - Collaboration with the platform team
      
      Accept your invitation here: {{inviteUrl}}
      
      This invitation expires in 72 hours.
      
      If you didn't expect this invitation, you can safely ignore this email.
      For questions, contact the platform administrator at {{invitedByEmail}}.
    `
  },
  
  // Existing user invitation (direct role assignment)
  existing_user: {
    subject: "You've been assigned a new role on EduMyles Platform",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Role Assignment</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .role-badge { background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">EduMyles Platform</div>
            <div>Your role has been updated!</div>
          </div>
          
          <div class="content">
            <p>Hi {{firstName}},</p>
            
            <p>You've been assigned a new role as <strong>{{roleName}}</strong> on the EduMyles platform.</p>
            
            <div class="role-badge">{{roleName}}</div>
            
            <p><strong>What's new:</strong></p>
            <ul>
              <li>New role: {{roleName}}</li>
              <li>Department: {{department}}</li>
              <li>Updated permissions and access levels</li>
            </ul>
            
            <p><strong>Assigned by:</strong> {{invitedByName}} ({{invitedByEmail}})</p>
            
            <p style="margin: 30px 0;">
              <a href="{{platformUrl}}" class="button">Go to Platform</a>
            </p>
            
            {{#if addedPermissions}}
            <p><strong>Additional Permissions:</strong></p>
            <ul>
              {{#each addedPermissions}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
            {{/if}}
            
            {{#if removedPermissions}}
            <p><strong>Removed Permissions:</strong></p>
            <ul>
              {{#each removedPermissions}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
            {{/if}}
          </div>
          
          <div class="footer">
            <p>If you have questions about your new role, please contact your administrator.</p>
            <p>For support, reach out to {{invitedByEmail}}.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    textContent: `
      EduMyles Platform - Role Assignment
      
      Hi {{firstName}},
      
      You've been assigned a new role as {{roleName}} on the EduMyles platform.
      
      Department: {{department}}
      Assigned by: {{invitedByName}} ({{invitedByEmail}})
      
      What's new:
      - New role: {{roleName}}
      - Department: {{department}}
      - Updated permissions and access levels
      
      Go to platform: {{platformUrl}}
      
      {{#if addedPermissions}}
      Additional Permissions:
      {{#each addedPermissions}}
      - {{this}}
      {{/each}}
      {{/if}}
      
      {{#if removedPermissions}}
      Removed Permissions:
      {{#each removedPermissions}}
      - {{this}}
      {{/each}}
      {{/if}}
      
      If you have questions about your new role, please contact your administrator.
      For support, reach out to {{invitedByEmail}}.
    `
  }
};

// Template variable substitution function
function substituteTemplateVariables(
  template: string,
  variables: Record<string, string | string[]>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = Array.isArray(value) ? value.join(', ') : String(value);
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
  }
  
  return result;
}

// Send platform invite email
export const sendPlatformInviteEmail = mutation({
  args: {
    sessionToken: v.string(),
    email: v.string(),
    templateType: v.union(v.literal("new_user"), v.literal("existing_user")),
    variables: v.record(v.string(), v.union(v.string(), v.array(v.string()))),
  },
  handler: async (ctx, args) => {
    const session = await requirePlatformSession(ctx, args);
    
    const template = PLATFORM_INVITE_TEMPLATES[args.templateType];
    if (!template) {
      throw new Error(`Invalid template type: ${args.templateType}`);
    }
    
    // Substitute template variables
    const htmlContent = substituteTemplateVariables(template.htmlContent, args.variables);
    const textContent = substituteTemplateVariables(template.textContent, args.variables);
    const subject = substituteTemplateVariables(template.subject, args.variables);
    
    // Log the email send (in a real implementation, this would use an email service)
    console.log("Platform invite email details:", {
      to: args.email,
      subject,
      templateType: args.templateType,
      variables: args.variables,
    });
    
    // In a real implementation, you would integrate with your email service here
    // For now, we'll just log and return success
    return {
      success: true,
      email: args.email,
      subject,
      templateType: args.templateType,
      sentAt: Date.now(),
    };
  },
});

// Get available email templates
export const getPlatformInviteEmailTemplates = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePlatformSession(ctx, args);
    
    return {
      templates: PLATFORM_INVITE_TEMPLATES,
      availableTypes: Object.keys(PLATFORM_INVITE_TEMPLATES),
    };
  },
});
