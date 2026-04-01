import { mutation } from "../../_generated/server";
import { requireTenantContext } from "../../helpers/tenantGuard";
import { requirePermission } from "../../helpers/authorize";
import { requireModule } from "../../helpers/moduleGuard";

// Africa's Talking SMS Service Integration
export const sendSMSViaAfricasTalking = mutation({
  args: {
    recipientPhone: v.string(),
    message: v.string(),
    templateId: v.optional(v.id("smsTemplates")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:messaging");

    // Africa's Talking API configuration
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;
    const senderId = process.env.AFRICASTALKING_SENDER_ID;

    if (!apiKey || !username) {
      throw new Error("Africa's Talking credentials not configured");
    }

    try {
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(args.recipientPhone);

      // Call Africa's Talking SMS API
      const response = await fetch(`https://api.africastalking.com/version1/messaging`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'apiKey': apiKey,
        },
        body: new URLSearchParams({
          username: username,
          to: normalizedPhone,
          message: args.message,
          from: senderId || 'EDUMYLES',
        }),
      });

      const result = await response.json();

      if (result.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
        // Log successful SMS
        await ctx.db.insert("smsLogs", {
          tenantId: tenant.tenantId,
          recipientPhone: normalizedPhone,
          message: args.message,
          templateId: args.templateId,
          status: "sent",
          sentBy: tenant.userId,
          externalId: result.SMSMessageData.Recipients[0].messageId,
          createdAt: Date.now(),
        });

        return { 
          success: true, 
          messageId: result.SMSMessageData.Recipients[0].messageId,
          status: "sent"
        };
      } else {
        // Log failed SMS
        await ctx.db.insert("smsLogs", {
          tenantId: tenant.tenantId,
          recipientPhone: normalizedPhone,
          message: args.message,
          templateId: args.templateId,
          status: "failed",
          sentBy: tenant.userId,
          error: result.SMSMessageData?.Recipients?.[0]?.statusText || 'Unknown error',
          createdAt: Date.now(),
        });

        return { 
          success: false, 
          error: result.SMSMessageData?.Recipients?.[0]?.statusText || 'Unknown error'
        };
      }
    } catch (error) {
      // Log error
      await ctx.db.insert("smsLogs", {
        tenantId: tenant.tenantId,
        recipientPhone: args.recipientPhone,
        message: args.message,
        templateId: args.templateId,
        status: "failed",
        sentBy: tenant.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: Date.now(),
      });

      throw error;
    }
  },
});

// Resend Email Service Integration
export const sendEmailViaResend = mutation({
  args: {
    recipientEmail: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.string(),
    templateId: v.optional(v.id("emailTemplates")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:messaging");

    // Resend API configuration
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      throw new Error("Resend credentials not configured");
    }

    try {
      // Call Resend Email API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [args.recipientEmail],
          subject: args.subject,
          html: args.htmlContent,
          text: args.textContent,
        }),
      });

      const result = await response.json();

      if (response.ok && result.id) {
        // Log successful email
        await ctx.db.insert("emailLogs", {
          tenantId: tenant.tenantId,
          recipientEmail: args.recipientEmail,
          subject: args.subject,
          htmlContent: args.htmlContent,
          textContent: args.textContent,
          templateId: args.templateId,
          status: "sent",
          sentBy: tenant.userId,
          externalId: result.id,
          createdAt: Date.now(),
        });

        return { 
          success: true, 
          messageId: result.id,
          status: "sent"
        };
      } else {
        // Log failed email
        await ctx.db.insert("emailLogs", {
          tenantId: tenant.tenantId,
          recipientEmail: args.recipientEmail,
          subject: args.subject,
          htmlContent: args.htmlContent,
          textContent: args.textContent,
          templateId: args.templateId,
          status: "failed",
          sentBy: tenant.userId,
          error: result.message || 'Unknown error',
          createdAt: Date.now(),
        });

        return { 
          success: false, 
          error: result.message || 'Unknown error'
        };
      }
    } catch (error) {
      // Log error
      await ctx.db.insert("emailLogs", {
        tenantId: tenant.tenantId,
        recipientEmail: args.recipientEmail,
        subject: args.subject,
        htmlContent: args.htmlContent,
        textContent: args.textContent,
        templateId: args.templateId,
        status: "failed",
        sentBy: tenant.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: Date.now(),
      });

      throw error;
    }
  },
});

// Bulk SMS sending
export const sendBulkSMS = mutation({
  args: {
    recipientPhones: v.array(v.string()),
    message: v.string(),
    templateId: v.optional(v.id("smsTemplates")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:messaging");

    const results = [];
    
    for (const phone of args.recipientPhones) {
      try {
        const result = await ctx.runMutation(
          (ctx as any).internal.modules.communications.services.sendSMSViaAfricasTalking,
          {
            recipientPhone: phone,
            message: args.message,
            templateId: args.templateId,
          }
        );
        results.push({ phone, ...result });
      } catch (error) {
        results.push({ 
          phone, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  },
});

// Bulk Email sending
export const sendBulkEmail = mutation({
  args: {
    recipientEmails: v.array(v.string()),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.string(),
    templateId: v.optional(v.id("emailTemplates")),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:messaging");

    const results = [];
    
    for (const email of args.recipientEmails) {
      try {
        const result = await ctx.runMutation(
          (ctx as any).internal.modules.communications.services.sendEmailViaResend,
          {
            recipientEmail: email,
            subject: args.subject,
            htmlContent: args.htmlContent,
            textContent: args.textContent,
            templateId: args.templateId,
          }
        );
        results.push({ email, ...result });
      } catch (error) {
        results.push({ 
          email, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  },
});

// Helper function to normalize phone numbers for Africa's Talking
function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different country codes
  if (cleaned.startsWith('254')) {
    // Kenya
    return cleaned;
  } else if (cleaned.startsWith('256')) {
    // Uganda
    return cleaned;
  } else if (cleaned.startsWith('255')) {
    // Tanzania
    return cleaned;
  } else if (cleaned.startsWith('250')) {
    // Rwanda
    return cleaned;
  } else if (cleaned.startsWith('251')) {
    // Ethiopia
    return cleaned;
  } else if (cleaned.startsWith('233')) {
    // Ghana
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    // Local format - assume Kenya by default
    return '254' + cleaned.substring(1);
  } else if (cleaned.length === 9 && cleaned.startsWith('7')) {
    // Kenya mobile format without prefix
    return '254' + cleaned;
  } else {
    // Default to Kenya if unsure
    return cleaned.startsWith('254') ? cleaned : '254' + cleaned;
  }
}

// Get SMS delivery status
export const getSMSDeliveryStatus = mutation({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await requireTenantContext(ctx);
    await requireModule(ctx, tenant.tenantId, "communications");
    requirePermission(tenant, "communications:read");

    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;

    if (!apiKey || !username) {
      throw new Error("Africa's Talking credentials not configured");
    }

    try {
      const response = await fetch(`https://api.africastalking.com/version1/messaging/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'apiKey': apiKey,
        },
        body: new URLSearchParams({
          username: username,
          messageId: args.messageId,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  },
});
